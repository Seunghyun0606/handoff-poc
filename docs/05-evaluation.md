# 05. Lightweight Evaluation

공모전 PoC의 목적은 정식 benchmark가 아니라 **누락 탐지의 유용성 신호**를 만드는 것이다.

## Demo samples

| 문서 | 사람 기대 | 목표 AI Score | 핵심 특징 |
| --- | --- | --- | --- |
| Sample A | 부족 | 20~35 | 시스템/권한/검증/구체 연락처 부족 |
| Sample B | 보통 | 50~70 | 기본 절차는 있으나 권한/장애/검증 취약 |
| Sample C | 양호 | 80~95 | 목적/절차/권한/마감/예외/장애/검증 대부분 포함 |

## Readiness score rule

카테고리 판정은 LLM이 수행하지만 숫자 점수 자체는 모델이 임의로 결정하지 않는다.

1. 카테고리 점수: `CLEAR=100`, `PARTIAL=50`, `MISSING=0`
2. 12개 카테고리별 가중 평균을 계산한다.
3. 실행에 직접 영향을 주는 핵심 카테고리(`procedure`, `systems_tools`, `access_permissions`, `incident_response`)가 `MISSING`이면 항목당 5점을 감점한다.
4. 12개 카테고리 모두 `MISSING`이 없으면 문서 완결성 보너스 10점을 더한다.
5. 최종 점수 상한은 95점이다.

이 보정은 특정 Sample 점수에 맞추기 위한 임의 매핑이 아니라, **업무를 시작할 수 없는 핵심 누락은 더 강하게 반영하고 모든 정보 영역이 최소한 존재하는 문서는 별도로 인정**하기 위한 readiness 규칙이다.

## Production acceptance baseline

실제 Azure OpenAI production 호출은 다음을 동시에 만족해야 한다.

- HTTP 200
- `source=azure-openai`
- 12개 카테고리 반환
- fallback notice 없음
- Sample A/B/C가 각각 목표 점수 범위 유지
- 질문은 실제 `PARTIAL`/`MISSING` Gap에만 연결되어 `questionCount <= gapCount`

2026-08-30 최종 production 확인 결과:

| Sample | Score | Questions | Gaps | Latency |
| --- | ---: | ---: | ---: | ---: |
| A | 27 | 8 | 11 | 14.3s |
| B | 64 | 5 | 5 | 10.9s |
| C | 95 | 3 | 3 | 10.8s |

## Real-document evaluation

익명화한 실제 인수인계 문서 5~10건을 준비한다. 문서별로 AI 결과를 보기 전에 사람이 먼저 `Human grade`를 기록한다.

### Human grade rubric

- `POOR`: 현재 문서만으로 독립 수행하기 어렵고, 핵심 절차/시스템/권한/장애 대응 등 다수 확인이 필요하다.
- `FAIR`: 기본 업무는 이해할 수 있지만 몇 가지 확인 질문 없이는 안정적인 수행이 어렵다.
- `GOOD`: 대부분의 핵심 정보가 있어 소수의 보완만으로 독립 수행 가능하다.

참고 점수 밴드는 `POOR=0~49`, `FAIR=50~79`, `GOOD=80~95`로 두되, 점수를 맞추기 위해 Human grade를 변경하지 않는다.

### Question usefulness rubric

AI 질문은 다음 조건을 모두 만족하면 `Useful`로 표시한다.

1. 원문에 이미 답이 적혀 있지 않다.
2. 업무 실행·검증·예외·장애 대응을 위해 실제 확인할 가치가 있다.
3. 다른 질문과 실질적으로 중복되지 않는다.
4. 지나치게 일반적이지 않고 무엇을 확인해야 하는지 알 수 있다.

### Critical miss rubric

사람이 보기에 **해당 정보가 없으면 독립 수행이 중단되거나 중대한 오류 가능성이 높은데 AI가 Gap/질문으로 잡지 못한 항목**을 `Critical miss`로 기록한다.

예: 실행 절차 자체 부재, 필수 시스템/권한 부재, 장애 시 아무 대응 방법이 없음, 결과 정상 여부를 판별할 방법이 없음.

### Recording sheet

| Document | Human grade | AI Score | Score band match | AI questions | Useful questions | Useful ratio | Critical misses | Notes |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| D1 |  |  |  |  |  |  |  |  |
| D2 |  |  |  |  |  |  |  |  |
| D3 |  |  |  |  |  |  |  |  |
| D4 |  |  |  |  |  |  |  |  |
| D5 |  |  |  |  |  |  |  |  |

`Useful ratio = Useful questions / AI questions`

전체 문서 기준으로는 두 값을 함께 본다.

- Micro useful ratio = 전체 Useful questions 합 / 전체 AI questions 합
- Score band agreement = Human grade와 AI score band가 일치한 문서 수 / 전체 문서 수

## PoC hypothesis signals

정식 benchmark가 아니므로 통계적 유의성을 주장하지 않는다. 아래는 공모전 PoC에서 가설이 유망한지를 판단하는 실용 기준이다.

- H1 누락 탐지: 실제 문서 대부분에서 사람이 인정하는 유효 Gap을 최소 1개 이상 찾고, Critical miss가 반복적으로 나타나지 않는다.
- H2 질문 가치: Micro useful ratio가 **70% 이상**이면 유의미한 신호로 본다.
- H3 Before/After: 최소 3건에서 `원문 → AI Gap/질문 → 사람이 사실을 채운 개선 문서` 흐름을 시각적으로 제시한다.

Score band agreement는 제품 보정 자료로 기록하되, 누락 탐지/질문 유용성보다 우선하지 않는다.

## Human question

> "AI가 발견한 질문 중 실제 인수 시 도움이 될 질문은 몇 개인가?"

핵심 지표는 질문의 양이 아니라 **유용 질문 비율과 Critical miss**다.

## Before / After evidence

각 대표 문서에서 다음 3개를 캡처한다.

1. Before 원문
2. AI가 찾은 Gap/질문
3. 사람이 사실을 확인해 placeholder를 채운 After 문서

이 흐름이 공모전의 핵심 증거가 된다.
