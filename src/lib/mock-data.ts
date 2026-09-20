import { IndexInfo, HistoricalDataPoint } from './types';

export const INDICES_METADATA: IndexInfo[] = [
  {
    id: 'SP500',
    name: 'S&P 500',
    symbol: '^GSPC',
    market: 'US',
    currency: 'USD',
    currentPrice: 5648.40,
    change: 28.50,
    changePercent: 0.51,
    high52w: 5670.81,
    low52w: 4103.78,
    openPrice: 5625.10,
    volume: '2.48B',
    updatedAt: '2026-09-19 16:00 EDT',
    sparkline: [5580, 5595, 5610, 5602, 5620, 5635, 5648.4],
    description: '미국 대형주 500개 종목을 편입한 미국 대표 시장 벤치마크',
    color: '#38bdf8', // sky-400
  },
  {
    id: 'NASDAQ',
    name: 'NASDAQ 종합',
    symbol: '^IXIC',
    market: 'US',
    currency: 'USD',
    currentPrice: 17683.98,
    change: 114.30,
    changePercent: 0.65,
    high52w: 18671.07,
    low52w: 12543.86,
    openPrice: 17590.20,
    volume: '5.12B',
    updatedAt: '2026-09-19 16:00 EDT',
    sparkline: [17450, 17520, 17500, 17580, 17610, 17650, 17683.98],
    description: '빅테크 및 혁신 성장주 중심의 글로벌 기술주 대표 지수',
    color: '#818cf8', // indigo-400
  },
  {
    id: 'RUSSELL2000',
    name: 'Russell 2000',
    symbol: '^RUT',
    market: 'US',
    currency: 'USD',
    currentPrice: 2182.75,
    change: 32.10,
    changePercent: 1.49,
    high52w: 2299.18,
    low52w: 1633.67,
    openPrice: 2155.40,
    volume: '1.15B',
    updatedAt: '2026-09-19 16:00 EDT',
    sparkline: [2110, 2125, 2140, 2135, 2150, 2165, 2182.75],
    description: '미국 시가총액 하위 2,000개 중소형주 지수 (금리 및 내수 민감)',
    color: '#34d399', // emerald-400
  },
  {
    id: 'KOSPI',
    name: '코스피 (KOSPI)',
    symbol: '^KS11',
    market: 'KR',
    currency: 'KRW',
    currentPrice: 2593.37,
    change: 12.85,
    changePercent: 0.50,
    high52w: 2896.43,
    low52w: 2273.97,
    openPrice: 2585.20,
    volume: '412M',
    updatedAt: '2026-09-19 15:30 KST',
    sparkline: [2570, 2565, 2580, 2575, 2590, 2585, 2593.37],
    description: '대한민국 유가증권시장 대표 종합주가지수 (반도체/제조업 중심)',
    color: '#f43f5e', // rose-500
  },
  {
    id: 'KOSDAQ',
    name: '코스닥 (KOSDAQ)',
    symbol: '^KQ11',
    market: 'KR',
    currency: 'KRW',
    currentPrice: 748.33,
    change: -2.15,
    changePercent: -0.29,
    high52w: 928.37,
    low52w: 712.44,
    openPrice: 751.10,
    volume: '890M',
    updatedAt: '2026-09-19 15:30 KST',
    sparkline: [755, 752, 750, 753, 749, 747, 748.33],
    description: '대한민국 벤처·기술·바이오·2차전지 중심 중소형 성장주 지수',
    color: '#fbbf24', // amber-400
  },
];

// 180일치 정규화 시계열 데이터 생성기
export function generateHistoricalData(): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const now = new Date();
  
  // 기준 초기값 (180일 전)
  let sp500 = 5050;
  let russell = 1980;
  let kospi = 2650;
  let kosdaq = 840;
  let nasdaq = 15800;

  for (let i = 180; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // 주말 건너뛰기
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    // 모의 변동성 적용
    const seed = Math.sin(i * 0.15) * 0.005;
    sp500 *= (1 + (Math.random() - 0.48) * 0.012 + seed);
    nasdaq *= (1 + (Math.random() - 0.47) * 0.016 + seed * 1.3);
    russell *= (1 + (Math.random() - 0.48) * 0.020 + seed * 1.1);
    kospi *= (1 + (Math.random() - 0.49) * 0.014 + seed * 0.7);
    kosdaq *= (1 + (Math.random() - 0.50) * 0.022 + seed * 0.8);

    points.push({
      date: d.toISOString().split('T')[0],
      SP500: Number(sp500.toFixed(2)),
      RUSSELL2000: Number(russell.toFixed(2)),
      KOSPI: Number(kospi.toFixed(2)),
      KOSDAQ: Number(kosdaq.toFixed(2)),
      NASDAQ: Number(nasdaq.toFixed(2)),
    });
  }

  // 마지막 포인트를 현재 가격으로 보정
  if (points.length > 0) {
    const last = points[points.length - 1];
    last.SP500 = 5648.40;
    last.NASDAQ = 17683.98;
    last.RUSSELL2000 = 2182.75;
    last.KOSPI = 2593.37;
    last.KOSDAQ = 748.33;
  }

  return points;
}
