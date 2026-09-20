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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  charts?: string[];
  generatedCode?: string;
  logs?: {
    stdout: string[];
    stderr: string[];
  };
  executionTimeMs?: number;
  model?: string;
  isMock?: boolean;
  timestamp: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek';
  badge: string;
}

export const AI_MODELS: AIModelOption[] = [
  { id: 'gemini-flash-latest', name: 'Google Gemini (기본)', provider: 'Google', badge: '기본 모델' },
  { id: 'gemini-pro-latest', name: 'Gemini Pro', provider: 'Google', badge: 'High Logic' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'Flagship' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Top Quant' },
  { id: 'deepseek-v3', name: 'DeepSeek-V3', provider: 'DeepSeek', badge: 'Cost Efficient' },
];

export interface ApiConfig {
  e2bApiKey?: string;
  selectedModel: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
}

