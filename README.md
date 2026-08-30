# Handoff Gap Detector PoC

> "이 문서만 받고 내일부터 혼자 일할 수 있을까?"를 AI가 검사하는 인수인계 문서 리뷰어.

AI가 인수자의 입장에서 인수인계 문서를 검토하고 누락 정보, 모호한 표현, 실행 불가능한 설명, 예외/장애 대응, 권한/담당자/마감 정보를 찾아냅니다.

## MVP

- 텍스트 입력 및 `.txt` / `.md` 업로드
- 12개 카테고리 `CLEAR` / `PARTIAL` / `MISSING` 판정
- 완성도 점수, 중요 누락, 확인 필요 항목, 인수자 질문 표시
- 확인되지 않은 내용을 만들어내지 않는 개선 문서 생성
- 샘플 문서 3종
- API 키가 없을 때도 데모 가능한 로컬 fallback 분석기
- `OPENAI_API_KEY` 설정 시 OpenAI Responses API Structured Outputs 사용

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

OpenAI 연동을 사용하려면 `.env.local`에 `OPENAI_API_KEY`를 설정합니다. 키가 없으면 샘플/데모용 deterministic 분석기가 자동으로 동작합니다.

## Project docs

- `docs/01-requirements.md`
- `docs/02-screen-storyboard.md`
- `docs/03-llm-prompt.md`
- `docs/04-output-schema.md`
- `docs/05-evaluation.md`

## Scope guard

이번 PoC에는 인증, DB, RAG/Vector DB, 조직 관리, Teams/Slack/Jira 연동, 다중 Agent를 포함하지 않습니다.
