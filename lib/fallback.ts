import { CATEGORY_DEFINITIONS, normalizeAnalysis } from "./schema";
import type { AnalysisResult, CategoryId, CategoryResult, Gap } from "./types";

const rules: Record<CategoryId, { signals: RegExp[]; clearAt: number; question: string; missing: string }> = {
  purpose: { signals: [/업무\s*목적/i, /목적\s*:/i, /위해/i, /현황을.*공유/i], clearAt: 2, question: "이 업무의 목적과 이 결과를 사용하는 사람은 누구인가요?", missing: "업무 목적이 명시되어 있지 않습니다." },
  procedure: { signals: [/절차\s*:/i, /\d+[.)]/, /→/, /접속|로그인/i, /다운로드|업로드/i], clearAt: 3, question: "업무를 처음부터 끝까지 어떤 순서로 수행하나요?", missing: "재현 가능한 실행 절차가 부족합니다." },
  systems_tools: { signals: [/시스템\s*:/i, /포털|SalesHub|ERP|SAP|Teams|Slack/i, /메뉴/i, /https?:\/\//i], clearAt: 2, question: "어떤 시스템/도구의 어느 메뉴에서 작업하나요?", missing: "사용할 시스템 또는 도구가 명확하지 않습니다." },
  access_permissions: { signals: [/권한/i, /계정/i, /신청/i, /승인/i, /접근/i], clearAt: 3, question: "필요한 계정과 권한은 무엇이며 어떻게 신청하나요?", missing: "계정과 접근권한 정보가 없습니다." },
  contacts: { signals: [/담당자/i, /연락처/i, /@[A-Z0-9._%+-]+\.[A-Z]{2,}/i, /Help Desk|헬프데스크/i, /팀\s*:/i], clearAt: 2, question: "업무/장애별 문의 담당자와 연락 채널은 무엇인가요?", missing: "문의할 담당자나 연락 채널이 구체적이지 않습니다." },
  schedule_deadline: { signals: [/매일|평일|주간|월말|매월/i, /\d{1,2}:\d{2}/, /\d{1,2}시/i, /까지|마감/i, /공휴일/i], clearAt: 3, question: "정확한 수행 주기와 완료 마감시간은 언제인가요?", missing: "수행 주기 또는 정확한 마감시간이 부족합니다." },
  input_data: { signals: [/입력\s*(데이터)?\s*:/i, /기준일/i, /원천/i, /전일.*데이터/i], clearAt: 2, question: "업무에 필요한 입력 데이터의 기준일·출처·조건은 무엇인가요?", missing: "입력 데이터의 출처나 기준이 불명확합니다." },
  output_results: { signals: [/출력/i, /CSV|XLSX|엑셀|파일/i, /파일명/i, /업로드|전달|공유/i, /완료\s*기준/i], clearAt: 3, question: "최종 산출물의 형식, 파일명, 전달 대상/채널은 무엇인가요?", missing: "산출물과 완료 기준이 충분히 구체적이지 않습니다." },
  exception_handling: { signals: [/예외/i, /공휴일|휴일/i, /월말/i, /미확정|누락/i, /지연/i, /재처리/i], clearAt: 2, question: "공휴일·월말·데이터 미확정 등 예외 상황은 어떻게 처리하나요?", missing: "예외 상황과 처리 기준이 없습니다." },
  incident_response: { signals: [/장애/i, /오류|실패/i, /재시도/i, /티켓/i, /Help Desk|헬프데스크/i, /문의/i], clearAt: 3, question: "시스템 장애나 작업 실패 시 재시도·에스컬레이션 절차는 무엇인가요?", missing: "장애 발생 시 구체적인 대응 절차가 없습니다." },
  validation: { signals: [/검증/i, /대조/i, /합계/i, /일치/i, /건수/i, /확인/i], clearAt: 3, question: "결과가 정상인지 무엇과 어떻게 검증하나요?", missing: "결과 검증 방법과 정상 기준이 없습니다." },
  follow_up: { signals: [/후속/i, /보관/i, /업로드/i, /전달|공유/i, /게시물/i, /완료/i], clearAt: 2, question: "완료 후 공유·보관·후속 조치는 무엇인가요?", missing: "업무 완료 후 후속 조치가 불명확합니다." },
};

const criticalIds = new Set<CategoryId>(["procedure", "systems_tools", "access_permissions", "incident_response"]);

function evaluate(id: CategoryId, name: string, text: string): CategoryResult {
  const rule = rules[id];
  const matched = rule.signals.filter((signal) => signal.test(text)).length;
  if (matched >= rule.clearAt) return { id, name, status: "CLEAR", score: 100, reason: "실행에 필요한 구체 정보가 비교적 명확하게 포함되어 있습니다." };
  if (matched > 0) return { id, name, status: "PARTIAL", score: 50, reason: "관련 정보는 있으나 인수자가 추가 확인해야 할 구체성이 남아 있습니다." };
  return { id, name, status: "MISSING", score: 0, reason: rule.missing };
}

function improved(text: string, categories: CategoryResult[]) {
  const placeholder: Partial<Record<CategoryId, string>> = {
    purpose: "[정보 필요: 업무 목적과 사용 주체]",
    procedure: "[정보 필요: 단계별 실행 절차]",
    systems_tools: "[정보 필요: 시스템명 / 메뉴 경로]",
    access_permissions: "[권한 확인 필요: 계정 / 권한 / 신청 방법]",
    contacts: "[담당자 확인 필요: 업무 문의 / 장애 문의 연락처]",
    schedule_deadline: "[시간 확인 필요: 수행 주기 / 정확한 마감시간 / 휴일 기준]",
    input_data: "[정보 필요: 입력 데이터 출처 / 기준일 / 조건]",
    output_results: "[정보 필요: 산출물 형식 / 파일명 / 전달 대상]",
    exception_handling: "[정보 필요: 예외 상황과 처리 기준]",
    incident_response: "[정보 필요: 실패 시 재시도 / 에스컬레이션 절차]",
    validation: "[정보 필요: 검증 방법 / 정상 기준]",
    follow_up: "[정보 필요: 완료 후 공유 / 보관 / 후속 조치]",
  };
  const needs = categories.filter((item) => item.status !== "CLEAR").map((item) => `- ${item.name}: ${placeholder[item.id]}`).join("\n");
  return `# 개선된 인수인계서 초안\n\n## 기존에 확인된 내용\n${text.trim()}\n\n## 추가로 확인하여 채워야 할 정보\n${needs || "- 현재 기준으로 큰 누락이 발견되지 않았습니다. 실제 인수자 검토로 최종 확인하세요."}\n\n> 위 placeholder는 원문에 없는 정보를 임의로 생성하지 않기 위해 남겨둔 항목입니다.`;
}

export function analyzeFallback(text: string): AnalysisResult {
  const categories = CATEGORY_DEFINITIONS.map((definition) => evaluate(definition.id, definition.name, text));
  const gaps: Gap[] = categories
    .filter((item) => item.status !== "CLEAR")
    .map((item) => ({
      severity: item.status === "MISSING" && criticalIds.has(item.id) ? "CRITICAL" : "WARNING",
      category_id: item.id,
      title: item.status === "MISSING" ? `${item.name} 정보 누락` : `${item.name} 구체화 필요`,
      reason: item.reason,
      suggestion: rules[item.id].question,
    }));
  const questions = categories.filter((item) => item.status !== "CLEAR").slice(0, 8).map((item) => rules[item.id].question);
  const partial = categories.filter((item) => item.status === "PARTIAL").length;
  const missing = categories.filter((item) => item.status === "MISSING").length;
  const summary = missing > 4
    ? `업무 맥락은 일부 보이지만 핵심 실행 정보 ${missing}개 영역이 비어 있어 추가 질문 없이 인수하기 어렵습니다.`
    : partial + missing > 3
      ? "기본 흐름은 이해할 수 있지만 권한·예외·장애·검증 같은 운영 정보 보완이 필요합니다."
      : "대부분의 핵심 정보가 포함되어 있으며 남은 확인 항목을 보완하면 독립 수행 가능성이 높습니다.";

  const normalized = normalizeAnalysis({
    overall_score: 0,
    summary,
    categories,
    gaps,
    questions,
    improved_document: improved(text, categories),
    source: "fallback",
    notice: "LLM API 키가 없어 데모용 규칙 기반 분석기를 사용했습니다.",
  });

  return {
    ...normalized,
    overall_score: Math.min(95, normalized.overall_score),
  };
}
