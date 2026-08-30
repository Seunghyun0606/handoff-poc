import { NextResponse } from "next/server";
import { analyzeFallback } from "@/lib/fallback";
import { analyzeWithOpenAI } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < 20) {
      return NextResponse.json({ error: "인수인계 문서를 20자 이상 입력해 주세요." }, { status: 400 });
    }
    if (text.length > 20000) {
      return NextResponse.json({ error: "PoC에서는 문서 길이를 20,000자로 제한합니다." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(analyzeFallback(text));
    }

    try {
      return NextResponse.json(await analyzeWithOpenAI(text));
    } catch (error) {
      const fallback = analyzeFallback(text);
      return NextResponse.json({
        ...fallback,
        notice: `LLM 분석에 실패해 데모 분석기로 전환했습니다. ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  } catch {
    return NextResponse.json({ error: "요청을 처리할 수 없습니다." }, { status: 400 });
  }
}
