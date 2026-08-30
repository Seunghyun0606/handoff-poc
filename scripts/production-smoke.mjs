const baseUrl = (process.env.HANDOFF_BASE_URL || "https://handoff-poc.vercel.app").replace(/\/$/, "");

const samples = [
  {
    id: "A",
    expected: [20, 35],
    text: `매일 오전 매출 자료를 다운받아 팀에 공유한다.
월말에는 정산자료도 만들어야 한다.
오류가 발생하면 담당자에게 문의한다.`,
  },
  {
    id: "B",
    expected: [50, 70],
    text: `업무명: 일일 매출 공유
목적: 전일 매출 현황을 영업팀에 공유한다.
수행시간: 평일 오전 9시까지.
시스템: SalesHub > 리포트 > 일매출.
절차: SalesHub 로그인 → 기준일을 전일로 설정 → CSV 다운로드 → 파일명을 YYYYMMDD_sales.csv로 변경 → 영업팀 Teams 채널에 업로드한다.
입력: 전일 기준 매출 데이터.
출력: CSV 파일.
월말에는 같은 화면에서 월간 정산 CSV도 생성한다.
오류가 나면 운영 담당자에게 문의한다.`,
  },
  {
    id: "C",
    expected: [80, 95],
    text: `업무명: 일일 매출 현황 공유
업무 목적: 전일 확정 매출을 영업팀이 오전 회의 전에 확인할 수 있도록 공유한다.
수행 주기: 평일 매일 오전 08:30~09:00, 09:00까지 완료한다. 공휴일에는 수행하지 않는다.
시스템: SalesHub(사내 포털 > 업무시스템 > SalesHub)에서 리포트 > 일매출 메뉴를 사용한다.
권한: SalesHub 조회권한과 영업공유 Teams 채널 권한이 필요하다. 신규 인수자는 IT Service Portal에서 SalesHub-Read 권한을 신청하고 팀장의 승인을 받는다.
입력 데이터: 기준일을 전일로 설정한 확정 매출 데이터.
절차: 1) SalesHub 로그인 2) 리포트 > 일매출 이동 3) 기준일 전일 선택 4) CSV 다운로드 5) 합계 금액과 전일 마감 대시보드 합계를 대조 6) YYYYMMDD_sales.csv로 저장 7) 영업팀 Teams > 일일매출 채널 업로드.
출력/완료 기준: CSV 업로드 후 Teams 게시물에 총매출과 전일 대비 증감률을 적고 파일이 정상 열리는 것을 확인하면 완료다.
검증: CSV 총매출과 SalesHub 화면 합계가 일치해야 한다. 불일치하면 재다운로드하고 동일하면 운영 담당자에게 전달한다.
예외: 월말 마지막 영업일에는 월간 정산 CSV도 함께 생성한다. 데이터가 미확정 상태면 09:00 전에 영업팀에 지연 안내를 남긴다.
장애 대응: SalesHub 접속 실패 시 5분 뒤 1회 재시도하고 계속 실패하면 IT Help Desk 티켓을 등록한다. 데이터 불일치는 Sales Operations 담당자(sales-ops@example.com)에게 문의한다.
후속 업무: 업로드한 파일은 Teams 채널에 보관하며 별도 로컬 보관은 하지 않는다.`,
  },
];

let failed = false;
const results = [];

for (const sample of samples) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sample.text }),
    });
    const data = await response.json();
    const scoreInRange = Number.isFinite(data.overall_score)
      && data.overall_score >= sample.expected[0]
      && data.overall_score <= sample.expected[1];
    const ok = response.ok
      && data.source === "azure-openai"
      && Array.isArray(data.categories)
      && data.categories.length === 12
      && !data.notice
      && scoreInRange;

    results.push({
      sample: sample.id,
      httpStatus: response.status,
      source: data.source,
      score: data.overall_score,
      expected: `${sample.expected[0]}-${sample.expected[1]}`,
      categoryCount: Array.isArray(data.categories) ? data.categories.length : null,
      questionCount: Array.isArray(data.questions) ? data.questions.length : null,
      gapCount: Array.isArray(data.gaps) ? data.gaps.length : null,
      latencyMs: Date.now() - startedAt,
      ok,
    });

    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    results.push({
      sample: sample.id,
      latencyMs: Date.now() - startedAt,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.table(results);
if (failed) process.exit(1);
