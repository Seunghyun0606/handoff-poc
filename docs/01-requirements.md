# 01. MVP Requirements

## Product statement

> "이 문서만 받고 내일부터 혼자 일할 수 있을까?"를 AI가 검사해주는 인수인계 문서 리뷰어.

## Hypotheses

- **H1** AI는 인수인계 문서에서 실제 업무 수행에 필요한 누락 정보를 찾을 수 있다.
- **H2** 단순 요약보다 질문 생성 + 누락 탐지가 문서 품질 개선에 직접 도움이 된다.
- **H3** 분석 전후 차이를 점수/카테고리/질문/개선문서로 보여주면 사용자가 품질 차이를 직관적으로 이해한다.

## Functional requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-01 | 텍스트 입력 | 20~20,000자의 인수인계 문서를 붙여넣을 수 있다. |
| FR-02 | 파일 입력 | `.txt`, `.md`를 브라우저에서 읽어 textarea에 넣는다. |
| FR-03 | 샘플 | 부족/보통/양호 3종 샘플을 즉시 불러온다. |
| FR-04 | 12개 진단 | 모든 분석 결과는 정의된 12개 카테고리를 가진다. |
| FR-05 | 상태 | 각 카테고리는 CLEAR/PARTIAL/MISSING 중 하나다. |
| FR-06 | 점수 | 0~100 전체 점수와 카테고리 점수를 표시한다. |
| FR-07 | Gap | 중요 누락(CRITICAL)과 확인 필요(WARNING)를 이유/보완방향과 함께 표시한다. |
| FR-08 | Questions | 인수자가 실제로 물어볼 질문을 중복 없이 생성한다. |
| FR-09 | Improved | 원문에 없는 사실은 placeholder로 남긴 개선 문서를 생성한다. |
| FR-10 | LLM fallback | API 키가 없거나 LLM 호출 실패 시 데모 분석기로 결과를 보여준다. |

## Non-functional requirements

- 로그인/DB 없이 동작한다.
- 입력 문서를 애플리케이션 DB에 저장하지 않는다.
- 서버 API 키는 클라이언트에 노출하지 않는다.
- 입력 문서의 prompt injection 문장은 분석 대상 데이터로 취급한다.
- 데모 화면만 보고도 10초 안에 서비스 목적을 이해할 수 있어야 한다.

## Scope guard

인증, 조직관리, 문서 버전관리, RAG/Vector DB, Slack/Teams/Jira 연동, 다중 Agent, 상용 SaaS 권한체계는 MVP에서 제외한다.

## Definition of Done

1. 샘플 3종에서 서로 다른 점수와 Gap이 나온다.
2. API 키 없이 전체 사용자 흐름을 시연할 수 있다.
3. API 키를 설정하면 Structured Outputs JSON으로 실제 LLM 분석이 된다.
4. 결과 화면에 점수, 12개 진단, Gap, 질문, 개선 문서가 모두 보인다.
