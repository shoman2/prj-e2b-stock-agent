'use client';

import React, { useState } from 'react';
import { AnalysisPreset, ExecutionResult } from '@/lib/types';
import { ANALYSIS_PRESETS } from '@/lib/presets';
import {
  Sparkles,
  Play,
  Terminal,
  FileText,
  PieChart,
  Code2,
  Copy,
  Check,
  RotateCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Grid,
  ShieldAlert,
  Gauge
} from 'lucide-react';

interface AgentWorkspaceProps {
  e2bApiKey?: string;
  onOpenSettings: () => void;
}

type TabType = 'report' | 'charts' | 'code' | 'logs';

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  e2bApiKey,
  onOpenSettings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 프리셋 아이콘 매퍼
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Grid': return <Grid size={15} />;
      case 'ShieldAlert': return <ShieldAlert size={15} />;
      case 'TrendingUp': return <TrendingUp size={15} />;
      case 'Gauge': return <Gauge size={15} />;
      default: return <Sparkles size={15} />;
    }
  };

  // 분석 실행 핸들러
  const handleExecute = async (overridePrompt?: string, presetId?: string) => {
    const targetPrompt = overridePrompt || prompt;
    if (!targetPrompt && !presetId) return;

    setLoading(true);
    setLoadingStep(1); // 1: LLM 코드 생성 중
    setSelectedPresetId(presetId || null);

    const timer1 = setTimeout(() => setLoadingStep(2), 600); // 2: E2B 샌드박스 실행 중
    const timer2 = setTimeout(() => setLoadingStep(3), 1400); // 3: 차트 및 리포트 작성 중

    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          presetId,
          e2bApiKey: e2bApiKey || undefined,
        }),
      });

      const data: ExecutionResult = await res.json();
      clearTimeout(timer1);
      clearTimeout(timer2);
      setResult(data);
      setActiveTab('report');
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setResult({
        success: false,
        isMock: true,
        agentInsight: `분석 실행 중 네트워크 에러가 발생했습니다: ${err.message}`,
        charts: [],
        logs: { stdout: [], stderr: [err.message] },
        generatedCode: '',
        executionTimeMs: 0,
      });
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  // 파이썬 코드 복사 핸들러
  const handleCopyCode = () => {
    if (result?.generatedCode) {
      navigator.clipboard.writeText(result.generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 초기 자동 1회 실행 (기본 한미 상관관계 매트릭스)
  React.useEffect(() => {
    handleExecute(undefined, 'correlation');
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} color="#0f172a" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              E2B AI 퀀트 분석가 워크스페이스
            </h2>
            <span className="badge badge-blue">Python 3.11 Sandbox</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
            자연어 질문을 입력하거나 프리셋을 선택하면 에이전트가 분석 코드를 작성하고 E2B 클라우드 격리 환경에서 직접 실행합니다.
          </p>
        </div>

        {/* Runtime info */}
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color="#38bdf8" />
              실행 시간: <strong>{result.executionTimeMs}ms</strong>
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: result.isMock ? '#f59e0b' : '#10b981',
              fontWeight: 600
            }}>
              <ShieldCheck size={13} />
              {result.isMock ? 'Demo Sandbox' : 'E2B Cloud VM'}
            </span>
          </div>
        )}
      </div>

      {/* Preset Analysis Chips */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>추천 프리셋 퀀트 분석</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 10
        }}>
          {ANALYSIS_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  setPrompt(preset.prompt);
                  handleExecute(preset.prompt, preset.id);
                }}
                disabled={loading}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                  border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.5)' : 'var(--border-color)'}`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isSelected ? '#38bdf8' : '#e2e8f0', fontWeight: 700, fontSize: '0.82rem' }}>
                    {getPresetIcon(preset.icon)}
                    <span>{preset.title}</span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(51, 65, 85, 0.6)',
                    color: '#94a3b8'
                  }}>
                    {preset.tag}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3 }}>
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Natural Language Prompt Input */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 20,
        background: 'rgba(15, 23, 42, 0.8)',
        padding: 6,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) {
              handleExecute(prompt);
            }
          }}
          placeholder="예: 코스피와 나스닥 3개월 수익률 괴리율 및 상관계수를 분석해줘..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            color: '#f8fafc',
            fontSize: '0.88rem',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={() => handleExecute(prompt)}
          disabled={loading || !prompt.trim()}
          className="btn-primary"
          style={{
            opacity: loading || !prompt.trim() ? 0.6 : 1,
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <RotateCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
              <span>실행 중...</span>
            </>
          ) : (
            <>
              <Play size={15} />
              <span>분석 실행</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Progress Stepper */}
      {loading && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8' }}>
              E2B Sandbox 에이전트 실행 파이프라인
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              단계 {loadingStep} / 3
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: loadingStep >= 1 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${loadingStep >= 1 ? '#38bdf8' : 'transparent'}`,
              fontSize: '0.75rem',
              color: loadingStep >= 1 ? '#f8fafc' : '#64748b'
            }}>
              1. 퀀트 파이썬 코드 생성
            </div>
            <div style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: loadingStep >= 2 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${loadingStep >= 2 ? '#38bdf8' : 'transparent'}`,
              fontSize: '0.75rem',
              color: loadingStep >= 2 ? '#f8fafc' : '#64748b'
            }}>
              2. E2B 클라우드 VM 코드 실행
            </div>
            <div style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: loadingStep >= 3 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${loadingStep >= 3 ? '#38bdf8' : 'transparent'}`,
              fontSize: '0.75rem',
              color: loadingStep >= 3 ? '#f8fafc' : '#64748b'
            }}>
              3. 차트 추출 & 인사이트 도출
            </div>
          </div>
        </div>
      )}

      {/* Result Tabs Navigation */}
      {result && (
        <div>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 18,
            gap: 6
          }}>
            <button
              onClick={() => setActiveTab('report')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'report' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'report' ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === 'report' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <FileText size={15} />
              <span>AI 분석 리포트</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'charts' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'charts' ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === 'charts' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <PieChart size={15} />
              <span>차트 시각화 ({result.charts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'code' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'code' ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === 'code' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Code2 size={15} />
              <span>E2B 파이썬 코드</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'logs' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'logs' ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === 'logs' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Terminal size={15} />
              <span>실행 콘솔 로그</span>
            </button>
          </div>

          {/* Tab Content 1: AI Report */}
          {activeTab === 'report' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              border: '1px solid var(--border-color)',
              lineHeight: 1.7,
              fontSize: '0.9rem',
              color: '#cbd5e1'
            }}>
              <div style={{ whiteSpace: 'pre-line' }}>
                {result.agentInsight}
              </div>
            </div>
          )}

          {/* Tab Content 2: Visualizations */}
          {activeTab === 'charts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {result.charts.length > 0 ? (
                result.charts.map((imgSrc, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#0f172a',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt={`E2B Generated Chart ${i + 1}`}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 6,
                        display: 'inline-block'
                      }}
                    />
                    <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#64748b' }}>
                      ⚡ E2B Code Interpreter Matplotlib/Seaborn 플롯 렌더링 결과
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                  생성된 차트 이미지가 없습니다.
                </div>
              )}
            </div>
          )}

          {/* Tab Content 3: Python Code */}
          {activeTab === 'code' && (
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 5
              }}>
                <button
                  onClick={handleCopyCode}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copied ? '복사됨' : '코드 복사'}</span>
                </button>
              </div>
              <pre style={{
                background: '#050811',
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                overflowX: 'auto',
                lineHeight: 1.5,
                maxHeight: 480
              }}>
                <code>{result.generatedCode}</code>
              </pre>
            </div>
          )}

          {/* Tab Content 4: Terminal Logs */}
          {activeTab === 'logs' && (
            <div style={{
              background: '#030712',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              padding: '16px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              <div style={{ color: '#10b981', marginBottom: 8 }}>
                $ e2b-sandbox run python3 main.py --timeout=60s
              </div>
              {result.logs.stdout.map((line, i) => (
                <div key={i} style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {line}
                </div>
              ))}
              {result.logs.stderr.map((line, i) => (
                <div key={i} style={{ color: '#f43f5e', whiteSpace: 'pre-wrap' }}>
                  [stderr] {line}
                </div>
              ))}
              <div style={{ color: '#64748b', marginTop: 12 }}>
                Process exited with status 0. (Execution: {result.executionTimeMs}ms)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
