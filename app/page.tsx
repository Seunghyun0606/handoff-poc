"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { SAMPLES } from "@/lib/samples";
import type { AnalysisResult, AnalysisSource, CategoryStatus, Gap } from "@/lib/types";

const statusMeta: Record<CategoryStatus, { label: string; className: string; bar: string }> = {
  CLEAR: { label: "잘 작성됨", className: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
  PARTIAL: { label: "확인 필요", className: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-500" },
  MISSING: { label: "누락", className: "bg-rose-50 text-rose-700 border-rose-200", bar: "bg-rose-500" },
};

const sourceMeta: Record<AnalysisSource, { label: string; className: string }> = {
  "azure-openai": { label: "Azure OpenAI 실시간 분석", className: "border-sky-200 bg-sky-50 text-sky-700" },
  openai: { label: "OpenAI 실시간 분석", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  fallback: { label: "Demo fallback 분석", className: "border-amber-200 bg-amber-50 text-amber-700" },
};

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="grid h-32 w-32 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#4f46e5 ${score * 3.6}deg, #e5e7eb 0deg)` }}>
      <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-inner">
        <div><strong className="text-3xl text-slate-900">{score}</strong><span className="text-sm text-slate-400"> / 100</span></div>
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: Gap }) {
  const critical = gap.severity === "CRITICAL";
  return (
    <article className={`rounded-2xl border p-4 ${critical ? "border-rose-200 bg-rose-50/70" : "border-amber-200 bg-amber-50/70"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span>{critical ? "🔴" : "🟡"}</span>
        <strong className="text-sm text-slate-900">{gap.title}</strong>
      </div>
      <p className="text-sm leading-6 text-slate-600">{gap.reason}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">→ {gap.suggestion}</p>
    </article>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"gaps" | "questions" | "improved">("gaps");
  const requestInFlight = useRef(false);

  const clearCount = useMemo(() => result?.categories.filter((item) => item.status === "CLEAR").length ?? 0, [result]);
  const engine = result?.source ? sourceMeta[result.source] : null;

  async function analyze() {
    if (requestInFlight.current || text.trim().length < 20) return;

    requestInFlight.current = true;
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "분석에 실패했습니다.");
      setResult(data);
      setTab("gaps");
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    if (requestInFlight.current) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setError("PoC에서는 .txt와 .md 파일만 지원합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result.improved_document);
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">AI Handoff Review PoC</span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">이 문서만 받고<br />내일부터 혼자 일할 수 있을까요?</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">AI가 인수자의 입장에서 문서를 읽고, 작성자에게는 당연해서 빠뜨린 정보와 실제로 물어봐야 할 질문을 찾아드립니다.</p>
        </div>

        <div aria-busy={loading} className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 md:p-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="handoff" className="font-bold text-slate-900">인수인계 문서</label>
            <label className={`rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 ${loading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-50"}`}>
              .txt / .md 업로드
              <input disabled={loading} className="hidden" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={onFile} />
            </label>
          </div>
          <textarea
            id="handoff"
            value={text}
            disabled={loading}
            onChange={(e) => setText(e.target.value)}
            placeholder="인수인계 문서를 붙여넣어 주세요..."
            className="min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                disabled={loading}
                onClick={() => { setText(sample.text); setResult(null); }}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sample.label} <span className="text-slate-400">({sample.expected})</span>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button disabled={loading || text.trim().length < 20} onClick={analyze} className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
            {loading && <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {loading ? "AI가 인수자의 입장에서 검토 중..." : "AI 분석하기"}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">입력 내용은 이 PoC의 DB에 저장하지 않습니다.</p>

          {loading && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-white/90 p-6 backdrop-blur-sm">
              <div role="status" aria-live="polite" className="max-w-sm text-center">
                <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" aria-hidden="true" />
                <p className="mt-5 text-lg font-black text-slate-950">AI가 문서를 검토하고 있습니다</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">12개 기준으로 누락·모호성·장애 대응·검증 방법과 인수자가 물어볼 질문을 분석합니다.</p>
                <p className="mt-3 text-xs font-semibold text-indigo-600">분석이 끝날 때까지 입력과 재호출이 잠깁니다.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {result && (
        <section id="result" className="border-t border-slate-200 bg-white/70 py-12">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {engine && <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${engine.className}`}>분석 엔진 · {engine.label}</span>}
              {result.source === "azure-openai" && <span className="text-xs text-slate-400">실제 Azure OpenAI 응답으로 생성된 결과입니다.</span>}
            </div>
            {result.notice && <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">ℹ️ {result.notice}</div>}
            <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-500">인수인계 완성도</p>
                <div className="mt-5 flex justify-center"><ScoreRing score={result.overall_score} /></div>
                <p className="mt-5 text-sm leading-6 text-slate-600">{result.summary}</p>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">12개 영역 중 <strong className="text-emerald-700">{clearCount}개</strong>가 독립 수행 가능한 수준입니다.</div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">카테고리별 진단</h2><span className="text-xs text-slate-400">CLEAR · PARTIAL · MISSING</span></div>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.categories.map((item) => {
                    const meta = statusMeta[item.status];
                    return <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex items-start justify-between gap-3"><strong className="text-sm text-slate-800">{item.name}</strong><span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${meta.className}`}>{meta.label}</span></div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${item.score}%` }} /></div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{item.reason}</p>
                    </div>;
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {([["gaps", "누락사항"], ["questions", "인수자가 물어볼 질문"], ["improved", "개선 문서"]] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}
              </div>

              {tab === "gaps" && <div className="mt-5 grid gap-3 md:grid-cols-2">{result.gaps.length ? result.gaps.map((gap, index) => <GapCard key={`${gap.category_id}-${index}`} gap={gap} />) : <p className="text-sm text-slate-500">큰 누락이 발견되지 않았습니다. 실제 인수자 검토로 최종 확인하세요.</p>}</div>}
              {tab === "questions" && <ol className="mt-5 space-y-3">{result.questions.map((question, index) => <li key={`${question}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{index + 1}</span><span>{question}</span></li>)}</ol>}
              {tab === "improved" && <div className="mt-5"><div className="mb-3 flex justify-end"><button onClick={copyResult} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">개선 문서 복사</button></div><pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 p-5 font-sans text-sm leading-7 text-slate-100">{result.improved_document}</pre></div>}

              <div className="mt-6 flex flex-wrap justify-end gap-2"><button onClick={() => { setResult(null); setText(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">다른 문서 분석</button></div>
            </div>
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-6xl px-5 py-10 text-center text-xs text-slate-400">Generation → Review · AI가 문서를 쓰는 대신, 문서를 의심하게 했습니다.</footer>
    </main>
  );
}
