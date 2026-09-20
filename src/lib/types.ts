export type IndexId = 'SP500' | 'RUSSELL2000' | 'KOSPI' | 'KOSDAQ' | 'NASDAQ';

export interface IndexInfo {
  id: IndexId;
  name: string;
  symbol: string;
  market: 'US' | 'KR';
  currency: 'USD' | 'KRW';
  currentPrice: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  openPrice: number;
  volume: string;
  updatedAt: string;
  sparkline: number[];
  description: string;
  color: string;
}

export interface HistoricalDataPoint {
  date: string;
  SP500: number;
  RUSSELL2000: number;
  KOSPI: number;
  KOSDAQ: number;
  NASDAQ: number;
}

export interface AnalysisPreset {
  id: string;
  title: string;
  icon: string;
  tag: string;
  description: string;
  prompt: string;
  pythonCode: string;
}

export interface ExecutionResult {
  success: boolean;
  isMock?: boolean;
  agentInsight: string;
  charts: string[]; // base64 PNG images
  logs: {
    stdout: string[];
    stderr: string[];
  };
  generatedCode: string;
  executionTimeMs: number;
  stats?: Record<string, any>;
  error?: string;
}

export interface ApiConfig {
  e2bApiKey?: string;
  llmProvider: 'gemini' | 'openai' | 'mock';
  llmApiKey?: string;
}
