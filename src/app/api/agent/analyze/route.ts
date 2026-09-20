import { NextRequest, NextResponse } from 'next/server';
import { ANALYSIS_PRESETS } from '@/lib/presets';
import { runPythonInE2B } from '@/lib/e2b-runner';

// 자연어 질문에서 최적의 파이썬 코드 및 분석 프리셋 매핑
function resolveCodeForPrompt(prompt: string, presetId?: string): { code: string; resolvedPresetId: string } {
  if (presetId) {
    const found = ANALYSIS_PRESETS.find(p => p.id === presetId);
    if (found) return { code: found.pythonCode, resolvedPresetId: presetId };
  }

  const p = prompt.toLowerCase();

  if (p.includes('상관') || p.includes('correlation') || p.includes('히트맵') || p.includes('동조화')) {
    const preset = ANALYSIS_PRESETS.find(pr => pr.id === 'correlation')!;
    return { code: preset.pythonCode, resolvedPresetId: 'correlation' };
  }

  if (p.includes('변동') || p.includes('mdd') || p.includes('낙폭') || p.includes('리스크') || p.includes('위험')) {
    const preset = ANALYSIS_PRESETS.find(pr => pr.id === 'volatility_mdd')!;
    return { code: preset.pythonCode, resolvedPresetId: 'volatility_mdd' };
  }

  if (p.includes('러셀') || p.includes('소형') || p.includes('대형') || p.includes('상대') || p.includes('비율')) {
    const preset = ANALYSIS_PRESETS.find(pr => pr.id === 'relative_strength')!;
    return { code: preset.pythonCode, resolvedPresetId: 'relative_strength' };
  }

  if (p.includes('rsi') || p.includes('이평선') || p.includes('이동평균') || p.includes('기술적') || p.includes('과매수')) {
    const preset = ANALYSIS_PRESETS.find(pr => pr.id === 'rsi_scanner')!;
    return { code: preset.pythonCode, resolvedPresetId: 'rsi_scanner' };
  }

  // 기본 커스텀 Python 코드 (5개 지수 다운로드 및 누적 수익률 비교 차트)
  const defaultCode = `import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt

tickers = {
    'S&P 500': '^GSPC',
    'NASDAQ': '^IXIC',
    'Russell 2000': '^RUT',
    'KOSPI': '^KS11',
    'KOSDAQ': '^KQ11'
}

print("== [E2B Sandbox] 5대 주요 주가지수 6개월 시세 분석 ==")
df = yf.download(list(tickers.values()), period='6mo', progress=False)['Close']
df = df.rename(columns={v: k for k, v in tickers.items()}).ffill().dropna()

# 누적 수익률(%) 정규화
normalized = (df / df.iloc[0] - 1) * 100

print("\\n[최근 6개월 누적 수익률 현황]")
for col in normalized.columns:
    print(f"{col:>12}: {normalized[col].iloc[-1]:>+6.2f}%")

plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(9, 4.8), dpi=120)
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

colors = {'S&P 500': '#38bdf8', 'NASDAQ': '#818cf8', 'Russell 2000': '#34d399', 'KOSPI': '#f43f5e', 'KOSDAQ': '#fbbf24'}
for col in normalized.columns:
    ax.plot(normalized.index, normalized[col], label=f"{col} ({normalized[col].iloc[-1]:+.1f}%)", color=colors.get(col, '#94a3b8'), linewidth=2)

ax.axhline(0, color='#64748b', linestyle='--', alpha=0.5)
ax.set_title("5 Major Indices Cumulative Return (6 Months)", fontsize=13, color='#f8fafc', pad=12)
ax.set_ylabel("Return (%)", color='#94a3b8')
ax.grid(True, linestyle=':', alpha=0.3, color='#334155')
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', loc='upper left')

plt.tight_layout()
plt.show()
`;

  return { code: defaultCode, resolvedPresetId: 'custom' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, presetId, customCode, e2bApiKey } = body;

    let targetCode = customCode;
    let resolvedPreset = presetId;

    if (!targetCode) {
      const resolved = resolveCodeForPrompt(prompt || '', presetId);
      targetCode = resolved.code;
      resolvedPreset = resolved.resolvedPresetId;
    }

    // E2B 샌드박스에서 실행
    const result = await runPythonInE2B(targetCode, e2bApiKey, resolvedPreset);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Agent analyze error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Analysis failed',
        agentInsight: '분석 처리 중 에러가 발생했습니다.',
        logs: { stdout: [], stderr: [String(error)] },
        charts: [],
        generatedCode: '',
        executionTimeMs: 0,
      },
      { status: 500 }
    );
  }
}
