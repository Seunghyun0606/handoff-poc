# 04. Structured Output Schema

실제 JSON Schema Source of Truth는 `lib/schema.ts`다.

```json
{
  "overall_score": 43,
  "summary": "핵심 실행 정보가 부족해 독립 수행이 어렵습니다.",
  "categories": [
    {
      "id": "purpose",
      "name": "업무 목적",
      "status": "CLEAR",
      "score": 100,
      "reason": "업무 목적이 명확히 작성되어 있음"
    }
  ],
  "gaps": [
    {
      "severity": "CRITICAL",
      "category_id": "access_permissions",
      "title": "계정 / 권한 정보 누락",
      "reason": "인수자가 시스템에 접근할 수 있는지 확인할 수 없음",
      "suggestion": "필요 권한과 신청 절차를 추가하세요."
    }
  ],
  "questions": [
    "시스템 권한 신청 방법은 무엇인가요?"
  ],
  "improved_document": "# 개선된 인수인계서..."
}
```

## Category IDs

1. `purpose`
2. `procedure`
3. `systems_tools`
4. `access_permissions`
5. `contacts`
6. `schedule_deadline`
7. `input_data`
8. `output_results`
9. `exception_handling`
10. `incident_response`
11. `validation`
12. `follow_up`

## Scoring

LLM이 카테고리별 점수를 생성하더라도 서버에서 고정 가중치로 전체 점수를 다시 계산한다. 이렇게 하면 모델이 overall score를 임의로 과대/과소평가하는 문제를 줄이고 샘플 간 비교 가능성을 높인다.
