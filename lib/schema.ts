import { CATEGORY_IDS, type AnalysisResult, type CategoryId, type CategoryResult, type CategoryStatus, type Gap } from "./types";

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
    status: { type: "string", enum: ["CLEAR", "PARTIAL", "MISSING"] },
    reason: { type: "string" },
  },
  required: ["id", "status", "reason"],
};

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    categories: {
      type: "array",
      minItems: 12,
      maxItems: 12,
      items: categoryItem,
    },
    questions: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["categories", "questions"],
} as const;

export const IMPROVEMENT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    improved_document: { type: "string" },
  },
  required: ["improved_document"],
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

const CRITICAL_CATEGORY_IDS = new Set<CategoryId>([
  "procedure",
  "systems_tools",
  "access_permissions",
  "incident_response",
]);
const CRITICAL_MISSING_PENALTY = 5;
const NO_MISSING_COMPLETENESS_BONUS = 10;
const MAX_OVERALL_SCORE = 95;

const GAP_SUGGESTIONS: Record<CategoryId, string> = {
  purpose: "이 업무의 목적과 결과를 사용하는 대상은 누구인가요?",
  procedure: "업무를 처음부터 끝까지 어떤 순서로 수행하나요?",
  systems_tools: "어떤 시스템/도구의 어느 메뉴에서 작업하나요?",
  access_permissions: "필요한 계정과 권한은 무엇이며 어떻게 확보하나요?",
  contacts: "업무·장애별 문의 담당자와 연락 채널은 무엇인가요?",
  schedule_deadline: "정확한 수행 주기와 완료 마감은 언제인가요?",
  input_data: "입력 데이터의 기준일·출처·선택 조건은 무엇인가요?",
  output_results: "최종 산출물의 형식과 전달·저장 위치는 어디인가요?",
  exception_handling: "예외 상황은 무엇이며 각 상황을 어떻게 처리하나요?",
  incident_response: "장애나 작업 실패 시 재시도·우회·에스컬레이션 절차는 무엇인가요?",
  validation: "결과가 정상인지 무엇과 어떤 기준으로 검증하나요?",
  follow_up: "완료 후 공유·보관·후속 조치는 무엇인가요?",
};

function deriveSummary(categories: CategoryResult[]): string {
  const clear = categories.filter((item) => item.status === "CLEAR").length;
  const partial = categories.filter((item) => item.status === "PARTIAL").length;
  const missing = categories.filter((item) => item.status === "MISSING").length;

  if (missing >= 5) {
    return `12개 영역 중 ${missing}개가 누락되어, 현재 문서만으로는 독립적인 업무 수행이 어렵습니다.`;
  }
  if (missing > 0 || partial >= 4) {
    return `12개 영역 중 ${clear}개는 충분하지만, 누락 ${missing}개와 확인 필요 ${partial}개를 보완해야 안정적인 인수가 가능합니다.`;
  }
  if (partial > 0) {
    return `핵심 정보는 대부분 갖춰져 있으며, 확인 필요 ${partial}개 영역을 보완하면 독립 수행 가능성이 높습니다.`;
  }
  return "12개 핵심 영역이 모두 구체적으로 작성되어 독립 수행 가능성이 높습니다.";
}

function deriveGaps(categories: CategoryResult[]): Gap[] {
  return categories
    .filter((item) => item.status !== "CLEAR")
    .map((item) => ({
      severity: item.status === "MISSING" && CRITICAL_CATEGORY_IDS.has(item.id) ? "CRITICAL" : "WARNING",
      category_id: item.id,
      title: item.status === "MISSING" ? `${item.name} 정보 누락` : `${item.name} 구체화 필요`,
      reason: item.reason,
      suggestion: GAP_SUGGESTIONS[item.id],
    }));
}

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

  const weightedScore = Math.round(categories.reduce((sum, item) => sum + item.score * (WEIGHTS[item.id] ?? 0), 0));
  const criticalMissingCount = categories.filter(
    (item) => item.status === "MISSING" && CRITICAL_CATEGORY_IDS.has(item.id),
  ).length;
  const missingCount = categories.filter((item) => item.status === "MISSING").length;
  const readinessAdjustment = missingCount === 0
    ? NO_MISSING_COMPLETENESS_BONUS
    : -(criticalMissingCount * CRITICAL_MISSING_PENALTY);
  const overall = Math.max(0, Math.min(MAX_OVERALL_SCORE, weightedScore + readinessAdjustment));

  return {
    ...result,
    overall_score: overall,
    summary: result.summary?.trim() || deriveSummary(categories),
    categories,
    gaps: result.gaps.length ? result.gaps.filter((gap) => categories.find((item) => item.id === gap.category_id)?.status !== "CLEAR") : deriveGaps(categories),
  };
}
