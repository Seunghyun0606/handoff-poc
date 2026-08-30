import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 인수인계 구멍 탐지기",
  description: "AI가 인수자의 입장에서 인수인계 문서의 누락과 모호성을 찾아냅니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
