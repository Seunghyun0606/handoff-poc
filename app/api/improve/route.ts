import { NextResponse } from "next/server";
import { analyzeFallback } from "@/lib/fallback";
import { improveWithOpenAI } from "@/lib/openai";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";

type ImprovementContext = Pick<AnalysisResult, "categories" | "gaps" | "questions">;

function readContext(value: unknown): ImprovementContext {
  if (!value || typeof value !== "object") {
    return { categories: [], gaps: [], questions: [] };
  }

  const context = value as Partial<ImprovementContext>;
  return {
    categories: Array.isArray(context.categories) ? context.categories : [],
    gaps: Array.isArray(context.gaps) ? context.gaps : [],
    questions: Array.isArray(context.questions) ? context.questions.filter((item): item is string => typeof item === "string") : [],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown; analysis?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < 20) {
      return NextResponse.json({ error: "인수인계 문서를 20자 이상 입력해 주세요." }, { status: 400 });
    }
    if (text.length > 20000) {
      return NextResponse.json({ error: "PoC에서는 문서 길이를 20,000자로 제한합니다." }, { status: 400 });
    }

    const context = readContext(body.analysis);
    const hasApiKey = Boolean(process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
    if (!hasApiKey) {
      const fallback = analyzeFallback(text);
      return NextResponse.json({
        improved_document: fallback.improved_document,
        source: "fallback",
        notice: "LLM API 키가 없어 데모용 규칙 기반 개선 문서를 생성했습니다.",
      });
    }

    try {
      return NextResponse.json(await improveWithOpenAI(text, context));
    } catch (error) {
      const provider = process.env.AZURE_OPENAI_ENDPOINT ? "Azure OpenAI" : "OpenAI";
      console.error(`${provider} improvement failed:`, error instanceof Error ? error.message : "Unknown error");
      const fallback = analyzeFallback(text);
      return NextResponse.json({
        improved_document: fallback.improved_document,
        source: "fallback",
        notice: `${provider} 개선 문서 생성에 실패해 데모 생성기로 전환했습니다.`,
      });
    }
  } catch {
    return NextResponse.json({ error: "요청을 처리할 수 없습니다." }, { status: 400 });
  }
}
