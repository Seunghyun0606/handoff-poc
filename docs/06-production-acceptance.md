# 06. Production Acceptance Baseline

## Environment

- Production: `https://handoff-poc.vercel.app`
- Provider expectation: `source=azure-openai`
- API: `POST /api/analyze`
- Required category count: 12
- Fallback notice: must be absent

## Acceptance result — 2026-08-30

실제 production endpoint를 GitHub Actions runner에서 호출했다.

| Sample | Expected score | Actual score | Source | Categories | Questions | Gaps | Latency |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| A · 부족 | 20~35 | 31 | azure-openai | 12 | 7 | 10 | 18.5s |
| B · 보통 | 50~70 | 64 | azure-openai | 12 | 5 | 5 | 15.7s |
| C · 양호 | 80~95 | 95 | azure-openai | 12 | 3 | 2 | 18.0s |

세 샘플 모두 HTTP 200, 실제 Azure OpenAI 경로, 12개 카테고리, fallback 없음, 목표 점수 범위를 만족했다.

## Repeatable check

비용이 발생하는 실제 LLM 호출이므로 일반 CI에서는 자동 실행하지 않는다.

```bash
npm run smoke:production
```

다른 환경을 검증할 때는 다음처럼 base URL을 바꿀 수 있다.

```bash
HANDOFF_BASE_URL=https://example.vercel.app npm run smoke:production
```

## Next validation

Demo Sample은 calibration/회귀용이다. 다음 단계에서는 실제 또는 익명화 인수인계 문서 5~10건을 사용해 사람 평가와 비교한다.

핵심 지표:

- Human grade vs AI Score 방향 일치 여부
- AI가 생성한 질문 중 실제 인수 시 유용한 질문 비율
- Critical miss 탐지 여부
- Before → Gap/Question → 사실 확인 후 After 흐름의 이해 가능성
- 실제 문서 기준 응답시간
