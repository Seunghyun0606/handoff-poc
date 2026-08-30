# 05. Lightweight Evaluation

공모전 PoC의 목적은 정식 benchmark가 아니라 **누락 탐지의 유용성 신호**를 만드는 것이다.

## Demo samples

| 문서 | 사람 기대 | 목표 AI Score | 핵심 특징 |
| --- | --- | --- | --- |
| Sample A | 부족 | 20~35 | 시스템/권한/검증/구체 연락처 부족 |
| Sample B | 보통 | 50~70 | 기본 절차는 있으나 권한/장애/검증 취약 |
| Sample C | 양호 | 80~95 | 목적/절차/권한/마감/예외/장애/검증 대부분 포함 |

## Real-document evaluation

익명화한 실제 인수인계 문서 5~10건에 대해 아래를 기록한다.

| Document | Human grade | AI Score | AI questions | Useful questions | Useful ratio | Critical misses |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| D1 |  |  |  |  |  |  |

## Human question

> "AI가 발견한 질문 중 실제 인수 시 도움이 될 질문은 몇 개인가?"

핵심 지표는 `Useful questions / AI questions`다. 목표 신호는 70% 이상이며, 단순 질문 수가 많아지는 것을 좋은 결과로 보지 않는다.

## Before / After evidence

각 문서에서 다음 3개를 캡처한다.

1. Before 원문
2. AI가 찾은 Gap/질문
3. 사람이 사실을 확인해 placeholder를 채운 After 문서

이 흐름이 공모전의 핵심 증거가 된다.
