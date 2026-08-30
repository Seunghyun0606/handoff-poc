# 02. Screen Storyboard

MVP는 한 페이지에서 3개 상태로 전환한다. 별도 라우팅을 만들지 않아 데모 흐름을 끊지 않는다.

## State 1 — Landing / Input

**목표:** 문제와 CTA를 10초 안에 이해.

- Hero: `이 문서만 받고 내일부터 혼자 일할 수 있을까요?`
- 설명: AI가 인수자 관점에서 빠진 정보와 질문을 탐지
- textarea
- `.txt/.md` 업로드
- Sample A/B/C 버튼과 예상 점수대
- `AI 분석하기`

## State 2 — Analysis Result

**상단:**
- 0~100 Score ring
- 한 문장 총평
- `12개 영역 중 N개 CLEAR`

**중단:**
- 12개 카테고리 카드
- 상태 badge + progress + 판정 이유

## State 3 — Deep Review tabs

### 누락사항
- CRITICAL: 독립 수행을 막는 정보
- WARNING: 모호하거나 추가 확인이 필요한 정보

### 인수자가 물어볼 질문
- 실제 작성자에게 질문할 우선순위 높은 질문

### 개선 문서
- 원문 사실은 유지
- 없는 사실은 `[정보 필요]` 계열 placeholder
- 복사 버튼

## Demo narrative

1. Sample A 로드 → 낮은 점수와 다수의 질문
2. Sample C 로드 → 높은 점수와 적은 Gap
3. `개선 문서` 탭 → AI가 사실을 지어내지 않는 것을 강조
4. `Generation → Review` 차별화 메시지로 종료
