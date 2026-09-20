import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'E2B Stock Quant Agent | 5대 주요 주가지수 AI 분석 플랫폼',
  description: 'E2B 클라우드 파이썬 샌드박스를 활용한 S&P 500, Russell 2000, KOSPI, KOSDAQ, NASDAQ 실시간 지수 분석 및 AI 퀀트 에이전트',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
