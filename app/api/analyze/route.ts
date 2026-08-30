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

    const hasApiKey = Boolean(process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
    if (!hasApiKey) {
      return NextResponse.json(analyzeFallback(text));
    }

    try {
      return NextResponse.json(await analyzeWithOpenAI(text));
    } catch (error) {
      const provider = process.env.AZURE_OPENAI_ENDPOINT ? "Azure OpenAI" : "OpenAI";
      console.error(`${provider} analysis failed:`, error instanceof Error ? error.message : "Unknown error");
      const fallback = analyzeFallback(text);
      return NextResponse.json({
        ...fallback,
        notice: `${provider} 분석에 실패해 데모 분석기로 전환했습니다. 환경변수, 모델 배포명, API 버전을 확인해 주세요.`,
      });
    }
  } catch {
    return NextResponse.json({ error: "요청을 처리할 수 없습니다." }, { status: 400 });
  }
}
