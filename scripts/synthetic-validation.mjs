import fs from "node:fs/promises";

const baseUrl = (process.env.HANDOFF_BASE_URL || "https://handoff-poc.vercel.app").replace(/\/$/, "");
const corpus = JSON.parse(await fs.readFile(new URL("../validation/synthetic-corpus.json", import.meta.url), "utf8"));

const scoreBands = {
  POOR: [0, 44],
  FAIR: [45, 74],
  GOOD: [75, 95],
};

const results = [];
let failed = false;

for (const doc of corpus) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: doc.text }),
    });
    const data = await response.json();
    const aiGapIds = Array.isArray(data.categories)
      ? data.categories.filter((item) => item.status !== "CLEAR").map((item) => item.id)
      : [];
    const expected = new Set(doc.ground_truth_gaps);
    const detectedExpected = aiGapIds.filter((id) => expected.has(id));
    const falsePositiveGaps = aiGapIds.filter((id) => !expected.has(id));
    const missedExpectedGaps = doc.ground_truth_gaps.filter((id) => !aiGapIds.includes(id));
    const criticalMisses = doc.critical_ground_truth_gaps.filter((id) => !aiGapIds.includes(id));
    const [minScore, maxScore] = scoreBands[doc.human_grade];
    const scoreBandMatch = Number.isFinite(data.overall_score)
      && data.overall_score >= minScore
      && data.overall_score <= maxScore;

    const ok = response.ok
      && data.source === "azure-openai"
      && Array.isArray(data.categories)
      && data.categories.length === 12
      && !data.notice;
    if (!ok) failed = true;

    const result = {
      id: doc.id,
      title: doc.title,
      human_grade: doc.human_grade,
      score: data.overall_score,
      score_band_match: scoreBandMatch,
      source: data.source,
      latency_ms: Date.now() - startedAt,
      ground_truth_gaps: doc.ground_truth_gaps,
      ai_gap_ids: aiGapIds,
      detected_expected_gaps: detectedExpected,
      missed_expected_gaps: missedExpectedGaps,
      false_positive_gaps: falsePositiveGaps,
      critical_misses: criticalMisses,
      gap_recall: doc.ground_truth_gaps.length
        ? detectedExpected.length / doc.ground_truth_gaps.length
        : null,
      gap_precision: aiGapIds.length
        ? detectedExpected.length / aiGapIds.length
        : (doc.ground_truth_gaps.length === 0 ? 1 : 0),
      questions: Array.isArray(data.questions) ? data.questions : [],
      gaps: Array.isArray(data.gaps) ? data.gaps : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      summary: data.summary,
      ok,
    };

    if (["D1", "D5", "D8"].includes(doc.id) && ok) {
      const improveStarted = Date.now();
      const improveResponse = await fetch(`${baseUrl}/api/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: doc.text,
          analysis: {
            categories: data.categories,
            gaps: data.gaps,
            questions: data.questions,
          },
        }),
      });
      const improved = await improveResponse.json();
      result.improvement = {
        source: improved.source,
        notice: improved.notice || null,
        latency_ms: Date.now() - improveStarted,
        improved_document: improved.improved_document || "",
      };
    }

    results.push(result);
    console.log(`[${doc.id}] ${doc.title}: grade=${doc.human_grade} score=${data.overall_score} gaps=${aiGapIds.length} questions=${result.questions.length} latency=${result.latency_ms}ms`);
  } catch (error) {
    failed = true;
    results.push({
      id: doc.id,
      title: doc.title,
      human_grade: doc.human_grade,
      error: error instanceof Error ? error.message : "Unknown error",
      ok: false,
    });
  }
}

const valid = results.filter((item) => item.ok);
const withGroundTruthGaps = valid.filter((item) => item.ground_truth_gaps?.length > 0);
const totalExpectedGaps = withGroundTruthGaps.reduce((sum, item) => sum + item.ground_truth_gaps.length, 0);
const totalDetectedExpected = withGroundTruthGaps.reduce((sum, item) => sum + item.detected_expected_gaps.length, 0);
const totalAiGaps = valid.reduce((sum, item) => sum + item.ai_gap_ids.length, 0);
const totalTrueAiGaps = valid.reduce((sum, item) => sum + item.detected_expected_gaps.length, 0);
const aggregate = {
  document_count: corpus.length,
  successful_count: valid.length,
  azure_source_rate: valid.length / corpus.length,
  score_band_match_count: valid.filter((item) => item.score_band_match).length,
  score_band_match_rate: valid.length ? valid.filter((item) => item.score_band_match).length / valid.length : 0,
  micro_gap_recall: totalExpectedGaps ? totalDetectedExpected / totalExpectedGaps : 0,
  micro_gap_precision: totalAiGaps ? totalTrueAiGaps / totalAiGaps : 0,
  critical_miss_count: valid.reduce((sum, item) => sum + item.critical_misses.length, 0),
  avg_latency_ms: valid.length ? Math.round(valid.reduce((sum, item) => sum + item.latency_ms, 0) / valid.length) : null,
};

const output = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  methodology: "Synthetic corpus with human grades and intentional gap ground truth fixed before AI execution.",
  aggregate,
  results,
};

await fs.writeFile("validation/synthetic-results.json", JSON.stringify(output, null, 2));
console.log("AGGREGATE", JSON.stringify(aggregate, null, 2));

if (failed) process.exit(1);
