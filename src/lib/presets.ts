import { AnalysisPreset } from './types';

export const ANALYSIS_PRESETS: AnalysisPreset[] = [
  {
    id: 'correlation',
    title: '한·미 주요 지수 상관관계 매트릭스',
    icon: 'Grid',
    tag: '상관관계',
    description: 'KOSPI, KOSDAQ과 S&P 500, NASDAQ, Russell 2000의 최근 6개월 일일 수익률 상관계수를 연산하고 히트맵을 생성합니다.',
    prompt: '최근 6개월 동안의 S&P 500, NASDAQ, Russell 2000, KOSPI, KOSDAQ 지수의 일일 수익률 간 상관계수(Pearson Correlation)를 구하고 히트맵 차트를 그려줘.',
    pythonCode: `import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 1. 지수 티커 매핑
tickers = {
    'S&P 500': '^GSPC',
    'NASDAQ': '^IXIC',
    'Russell 2000': '^RUT',
    'KOSPI': '^KS11',
    'KOSDAQ': '^KQ11'
}

print("== [E2B Sandbox] 5대 주요 주가지수 데이터 다운로드 중... ==")
data = yf.download(list(tickers.values()), period='6mo', progress=False)['Close']
data = data.rename(columns={v: k for k, v in tickers.items()})

# 결측치 보정 (국가별 공휴일 차이 고려)
data = data.ffill().dropna()

# 2. 일일 수익률 계산
returns = data.pct_change().dropna()
corr_matrix = returns.corr()

print("\\n[1] 일일 수익률 상관계수 매트릭스:")
print(corr_matrix.round(3))

# 3. 히트맵 시각화
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(8, 6), dpi=120)
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

sns.heatmap(
    corr_matrix, 
    annot=True, 
    cmap='vlag', 
    fmt='.2f', 
    vmin=-0.2, 
    vmax=1.0, 
    linewidths=1.5, 
    linecolor='#1e293b',
    cbar_kws={'label': 'Pearson Correlation'},
    ax=ax
)

ax.set_title("Stock Indices 6-Month Correlation Matrix", fontsize=14, color='#f8fafc', pad=15)
plt.tight_layout()
plt.show()

# 4. 분석 코멘트용 통계
us_kr_corr = (corr_matrix.loc['KOSPI', 'S&P 500'] + corr_matrix.loc['KOSPI', 'NASDAQ']) / 2
print(f"\\n[2] KOSPI - 미국 증시 평균 상관계수: {us_kr_corr:.3f}")
`
  },
  {
    id: 'volatility_mdd',
    title: '연간 변동성 및 최대낙폭(MDD) 리스크 비교',
    icon: 'ShieldAlert',
    tag: '리스크 분석',
    description: '최근 1년간 지수별 연율화 변동성(Annualized Volatility)과 고점 대비 최대 낙폭(MDD)을 계산하여 리스크 프로파일을 비교합니다.',
    prompt: '최근 1년간 S&P 500, Russell 2000, KOSPI, KOSDAQ, NASDAQ의 연간 변동성과 MDD(Maximum Drawdown)를 계산하여 막대그래프로 비교해줘.',
    pythonCode: `import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

tickers = {
    'S&P 500': '^GSPC',
    'NASDAQ': '^IXIC',
    'Russell 2000': '^RUT',
    'KOSPI': '^KS11',
    'KOSDAQ': '^KQ11'
}

print("== [E2B Sandbox] 1개년 일봉 데이터 수집 및 리스크 지표 연산 ==")
df = yf.download(list(tickers.values()), period='1y', progress=False)['Close']
df = df.rename(columns={v: k for k, v in tickers.items()}).ffill().dropna()

# 1. 연율화 변동성 (252영업일 기준)
returns = df.pct_change().dropna()
annual_vol = returns.std() * np.sqrt(252) * 100

# 2. Maximum Drawdown (MDD) 계산
mdd_dict = {}
for col in df.columns:
    cummax = df[col].cummax()
    drawdown = (df[col] - cummax) / cummax
    mdd_dict[col] = drawdown.min() * 100

risk_df = pd.DataFrame({
    'Annualized Volatility (%)': annual_vol,
    'Max Drawdown MDD (%)': mdd_dict
}).round(2)

print("\\n[지수별 리스크 지표 결과]")
print(risk_df)

# 3. 듀얼 막대그래프 시각화
plt.style.use('dark_background')
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.8), dpi=120)
fig.patch.set_facecolor('#0f172a')
ax1.set_facecolor('#0f172a')
ax2.set_facecolor('#0f172a')

colors = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24']

# 변동성 차트
ax1.bar(risk_df.index, risk_df['Annualized Volatility (%)'], color=colors, alpha=0.85)
ax1.set_title("Annualized Volatility (%)", fontsize=12, color='#f8fafc', pad=10)
ax1.tick_params(axis='x', rotation=35, colors='#94a3b8')
ax1.grid(axis='y', linestyle='--', alpha=0.2)

# MDD 차트
ax2.bar(risk_df.index, risk_df['Max Drawdown MDD (%)'], color=colors, alpha=0.85)
ax2.set_title("Maximum Drawdown MDD (%)", fontsize=12, color='#f8fafc', pad=10)
ax2.tick_params(axis='x', rotation=35, colors='#94a3b8')
ax2.grid(axis='y', linestyle='--', alpha=0.2)

plt.tight_layout()
plt.show()
`
  },
  {
    id: 'relative_strength',
    title: '미국 대형주(S&P) vs 소형주(Russell) 상대강도 추이',
    icon: 'TrendingUp',
    tag: '시장 구조',
    description: 'S&P 500 대비 Russell 2000(소형주)의 상대 비율(Ratio)과 50일 이동평균을 분석하여 시장의 위험 선호(Risk-On/Off) 및 금리 민감도를 진단합니다.',
    prompt: 'Russell 2000과 S&P 500의 상대강도 비율(RUT/GSPC)을 최근 1년간 구하고 50일 이동평균선과 함께 시각화해줘.',
    pythonCode: `import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt

print("== [E2B Sandbox] Russell 2000 및 S&P 500 지수 상대강도 분석 ==")
tickers = ['^RUT', '^GSPC']
df = yf.download(tickers, period='1y', progress=False)['Close']
df = df.ffill().dropna()

# 상대강도 Ratio: Russell 2000 / S&P 500
ratio = df['^RUT'] / df['^GSPC']
ratio_ma50 = ratio.rolling(window=50).mean()

current_ratio = ratio.iloc[-1]
ma50_val = ratio_ma50.iloc[-1]
print(f"최신 RUT/GSPC 비율: {current_ratio:.4f} (50MA: {ma50_val:.4f})")

plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=120)
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

ax.plot(ratio.index, ratio, label='Russell 2000 / S&P 500 Ratio', color='#38bdf8', linewidth=2)
ax.plot(ratio_ma50.index, ratio_ma50, label='50-Day Moving Average', color='#f59e0b', linestyle='--', linewidth=1.8)

ax.set_title("Russell 2000 vs S&P 500 Relative Strength (1 Year)", fontsize=13, color='#f8fafc', pad=12)
ax.set_ylabel("RUT / GSPC Ratio", color='#94a3b8')
ax.grid(True, linestyle=':', alpha=0.3, color='#475569')
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#f1f5f9')

plt.tight_layout()
plt.show()
`
  },
  {
    id: 'rsi_scanner',
    title: '5대 지수 RSI(14) 및 이평선 기술적 스캐너',
    icon: 'Gauge',
    tag: '기술적 지표',
    description: '모든 지수의 14일 상대강도지수(RSI)와 20일/60일 이동평균선 이격도를 산출하여 과매수/과매도 및 단기 추세 상태를 종합 판별합니다.',
    prompt: '5개 지수의 14일 RSI와 20일 이동평균선 대비 현재가 괴리율을 계산해서 표와 차트로 보여줘.',
    pythonCode: `import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

tickers = {
    'S&P 500': '^GSPC',
    'NASDAQ': '^IXIC',
    'Russell 2000': '^RUT',
    'KOSPI': '^KS11',
    'KOSDAQ': '^KQ11'
}

print("== [E2B Sandbox] 5대 지수 기술적 지표(RSI 14, 20MA 괴리율) 연산 ==")
df = yf.download(list(tickers.values()), period='6mo', progress=False)['Close']
df = df.rename(columns={v: k for k, v in tickers.items()}).ffill().dropna()

# 1. RSI 계산 함수
def compute_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

results = []
for name in tickers.keys():
    s = df[name]
    rsi = compute_rsi(s).iloc[-1]
    ma20 = s.rolling(20).mean().iloc[-1]
    disparity = ((s.iloc[-1] - ma20) / ma20) * 100
    results.append({'Index': name, 'Current': round(s.iloc[-1], 2), 'RSI(14)': round(rsi, 1), '20MA Disparity(%)': round(disparity, 2)})

res_df = pd.DataFrame(results).set_index('Index')
print("\\n[기술적 지표 현황표]")
print(res_df)

# 2. RSI 수평 막대 차트
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(8.5, 4.5), dpi=120)
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

colors = ['#ef4444' if r >= 70 else '#10b981' if r <= 30 else '#38bdf8' for r in res_df['RSI(14)']]
bars = ax.barh(res_df.index, res_df['RSI(14)'], color=colors, height=0.55, alpha=0.9)

ax.axvline(70, color='#ef4444', linestyle='--', alpha=0.7, label='Overbought (70)')
ax.axvline(30, color='#10b981', linestyle='--', alpha=0.7, label='Oversold (30)')
ax.axvline(50, color='#64748b', linestyle=':', alpha=0.5)

for bar in bars:
    w = bar.get_width()
    ax.text(w + 1, bar.get_y() + bar.get_height()/2, f'{w:.1f}', va='center', color='#f8fafc', fontweight='bold', fontsize=10)

ax.set_xlim(0, 100)
ax.set_title("Current 14-Day RSI Levels Across 5 Indices", fontsize=13, color='#f8fafc', pad=12)
ax.set_xlabel("RSI Level (0-100)", color='#94a3b8')
ax.legend(loc='lower right', facecolor='#1e293b', edgecolor='#334155', labelcolor='#cbd5e1')
ax.grid(axis='x', linestyle=':', alpha=0.3)

plt.tight_layout()
plt.show()
`
  }
];
