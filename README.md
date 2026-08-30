# Handoff Gap Detector PoC

> "이 문서만 받고 내일부터 혼자 일할 수 있을까?"를 AI가 검사하는 인수인계 문서 리뷰어.

AI가 인수자의 입장에서 인수인계 문서를 검토하고 누락 정보, 모호한 표현, 실행 불가능한 설명, 예외/장애 대응, 권한/담당자/마감 정보를 찾아냅니다.

## Project status

- **Status:** Contest PoC completed
- **Submitted:** 2026-08-31
- **Production:** Vercel + Azure OpenAI
- **Current development:** Closed after contest submission

Synthetic 8건 Production Validation 결과:

- Azure 실제 호출 성공: **8/8 (100%)**
- Planted Gap Recall: **77.8%**
- Critical Gap Recall: **92.3% (12/13)**
- Human grade ↔ AI score band 일치: **75%**
- 평균 초기 분석시간: **약 11.5초**

현재 PoC의 핵심 가치는 절대 점수보다 **문서에 빠진 실행정보를 찾아 실제 확인 질문으로 변환하는 것**으로 정리했습니다.

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

```env
OPENAI_API_KEY=<your-api-key>
OPENAI_MODEL=gpt-4.1
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

`AZURE_OPENAI_ENDPOINT`가 있으면 앱은 Azure OpenAI Chat Completions API를 사용하며 `api-key` 헤더로 인증합니다. `AZURE_OPENAI_API_KEY`를 별도로 설정한 경우에는 해당 값이 `OPENAI_API_KEY`보다 우선합니다.

### Native OpenAI

Azure endpoint를 설정하지 않으면 OpenAI Responses API를 사용합니다.

```env
OPENAI_API_KEY=<your-api-key>
OPENAI_MODEL=gpt-5.4-mini
```

API 키가 없거나 LLM 호출이 실패하면 샘플/데모용 deterministic 분석기가 자동으로 동작합니다.

## Project docs

- `docs/01-requirements.md` — 요구사항
- `docs/02-screen-storyboard.md` — 화면 스토리보드
- `docs/03-llm-prompt.md` — LLM 프롬프트
- `docs/04-output-schema.md` — 출력 스키마
- `docs/05-evaluation.md` — 평가 기준
- `docs/06-synthetic-validation.md` — Synthetic Validation 결과
- `docs/07-contest-submission-story.md` — 공모전 제출 스토리
- `docs/08-project-closure.md` — 프로젝트 종료 기록

## Scope guard

이번 PoC에는 인증, DB, RAG/Vector DB, 조직 관리, Teams/Slack/Jira 연동, 다중 Agent를 포함하지 않습니다.

후속 제품화 시 우선 검토할 항목은 실제 사용자 문서 기반 독립 Validation, 공개 API rate limit/WAF, 조직별 평가 카테고리 커스터마이징입니다.
