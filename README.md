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
- Native OpenAI Responses API와 Azure OpenAI Chat Completions 모두 지원
- `AZURE_OPENAI_ENDPOINT`가 설정되면 Azure OpenAI를 자동 사용

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

### Azure OpenAI

사용 중인 Azure OpenAI 키를 `OPENAI_API_KEY`에 그대로 넣을 수 있습니다.

```env
OPENAI_API_KEY=atl-...
OPENAI_MODEL=gpt-4.1
AZURE_OPENAI_ENDPOINT=https://skax.ai-talentlab.com
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

`AZURE_OPENAI_ENDPOINT`가 있으면 앱은 Azure OpenAI Chat Completions API를 사용하며 `api-key` 헤더로 인증합니다. `AZURE_OPENAI_API_KEY`를 별도로 설정한 경우에는 해당 값이 `OPENAI_API_KEY`보다 우선합니다.

### Native OpenAI

Azure endpoint를 설정하지 않으면 기존 OpenAI Responses API를 사용합니다.

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
```

API 키가 없거나 LLM 호출이 실패하면 샘플/데모용 deterministic 분석기가 자동으로 동작합니다.

## Project docs

- `docs/01-requirements.md`
- `docs/02-screen-storyboard.md`
- `docs/03-llm-prompt.md`
- `docs/04-output-schema.md`
- `docs/05-evaluation.md`

## Scope guard

이번 PoC에는 인증, DB, RAG/Vector DB, 조직 관리, Teams/Slack/Jira 연동, 다중 Agent를 포함하지 않습니다.
