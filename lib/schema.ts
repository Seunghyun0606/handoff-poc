import { CATEGORY_IDS, type AnalysisResult, type CategoryStatus } from "./types";

export const CATEGORY_DEFINITIONS = [
  { id: "purpose", name: "업무 목적" },
  { id: "procedure", name: "실행 절차" },
  { id: "systems_tools", name: "시스템 / 도구" },
  { id: "access_permissions", name: "계정 / 권한" },
  { id: "contacts", name: "담당자 / 연락처" },
  { id: "schedule_deadline", name: "수행 주기 / 마감시간" },
  { id: "input_data", name: "입력 데이터" },
  { id: "output_results", name: "출력 결과" },
  { id: "exception_handling", name: "예외 처리" },
  { id: "incident_response", name: "장애 대응" },
  { id: "validation", name: "검증 방법" },
  { id: "follow_up", name: "후속 업무" },
] as const;

const categoryItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", enum: [...CATEGORY_IDS] },
    name: { type: "string" },
    status: { type: "string", enum: ["CLEAR", "PARTIAL", "MISSING"] },
    score: { type: "integer", minimum: 0, maximum: 100 },
    reason: { type: "string" },
  },
  required: ["id", "name", "status", "score", "reason"],
};

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    categories: {
      type: "array",
      minItems: 12,
      maxItems: 12,
      items: categoryItem,
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { type: "string", enum: ["CRITICAL", "WARNING"] },
          category_id: { type: "string", enum: [...CATEGORY_IDS] },
          title: { type: "string" },
          reason: { type: "string" },
          suggestion: { type: "string" },
        },
        required: ["severity", "category_id", "title", "reason", "suggestion"],
      },
    },
    questions: { type: "array", items: { type: "string" }, maxItems: 12 },
    improved_document: { type: "string" },
  },
  required: ["overall_score", "summary", "categories", "gaps", "questions", "improved_document"],
} as const;

const WEIGHTS: Record<string, number> = {
  purpose: 0.07,
  procedure: 0.13,
  systems_tools: 0.10,
  access_permissions: 0.10,
  contacts: 0.08,
  schedule_deadline: 0.08,
  input_data: 0.07,
  output_results: 0.07,
  exception_handling: 0.08,
  incident_response: 0.09,
  validation: 0.08,
  follow_up: 0.05,
};

const STATUS_SCORES: Record<CategoryStatus, number> = {
  CLEAR: 100,
  PARTIAL: 50,
  MISSING: 0,
};

const CRITICAL_CATEGORY_IDS = new Set([
  "procedure",
  "systems_tools",
  "access_permissions",
  "incident_response",
]);
const CRITICAL_MISSING_PENALTY = 5;
const NO_MISSING_COMPLETENESS_BONUS = 10;
const MAX_OVERALL_SCORE = 95;

export function normalizeAnalysis(result: AnalysisResult): AnalysisResult {
  const byId = new Map(result.categories.map((item) => [item.id, item]));
  const categories = CATEGORY_DEFINITIONS.map((definition) => {
    const found = byId.get(definition.id);
    if (!found) {
      return { ...definition, status: "MISSING" as const, score: 0, reason: "분석 결과에 항목이 없어 누락으로 처리했습니다." };
    }
    return {
      ...found,
      name: definition.name,
      score: STATUS_SCORES[found.status] ?? 0,
    };
  });

  const statusById = new Map(categories.map((item) => [item.id, item.status]));
  const gaps = result.gaps.filter((gap) => statusById.get(gap.category_id) !== "CLEAR");
  const weightedScore = Math.round(categories.reduce((sum, item) => sum + item.score * (WEIGHTS[item.id] ?? 0), 0));

  const criticalMissingCount = categories.filter(
    (item) => item.status === "MISSING" && CRITICAL_CATEGORY_IDS.has(item.id),
  ).length;
  const missingCount = categories.filter((item) => item.status === "MISSING").length;
  const readinessAdjustment = missingCount === 0
    ? NO_MISSING_COMPLETENESS_BONUS
    : -(criticalMissingCount * CRITICAL_MISSING_PENALTY);
  const overall = Math.max(0, Math.min(MAX_OVERALL_SCORE, weightedScore + readinessAdjustment));

  return { ...result, overall_score: overall, categories, gaps };
}
