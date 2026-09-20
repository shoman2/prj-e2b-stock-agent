'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChatMessage,
  IndexInfo,
  AIModelOption,
  AI_MODELS,
  ExecutionResult,
  TokenUsage
} from '@/lib/types';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Terminal,
  Code2,
  Clock,
  Check,
  Copy,
  ChevronRight,
  Maximize2,
  X,
  Activity,
  Grid,
  ShieldAlert,
  TrendingUp,
  Gauge,
  Square,
  Coins
} from 'lucide-react';

interface ChatInterfaceProps {
  selectedModel: string;
  e2bApiKey?: string;
  modelKeys: Record<string, string>;
  indices: IndexInfo[];
  onOpenSettings: () => void;
}

const QUICK_SUGGESTIONS = [
  {
    icon: <Grid size={14} color="#38bdf8" />,
    title: '한·미 지수 상관관계',
    prompt: '최근 6개월 동안의 S&P 500, NASDAQ, Russell 2000, KOSPI, KOSDAQ 지수의 일일 수익률 간 상관계수(Pearson Correlation)를 구하고 히트맵 차트를 그려줘.',
    presetId: 'correlation'
  },
  {
    icon: <ShieldAlert size={14} color="#f43f5e" />,
    title: '변동성 & MDD 리스크',
    prompt: '최근 1년간 S&P 500, Russell 2000, KOSPI, KOSDAQ, NASDAQ의 연간 변동성과 MDD(Maximum Drawdown)를 계산하여 막대그래프로 비교해줘.',
    presetId: 'volatility_mdd'
  },
  {
    icon: <TrendingUp size={14} color="#34d399" />,
    title: '대형주 vs 소형주 상대강도',
    prompt: 'Russell 2000과 S&P 500의 상대강도 비율(RUT/GSPC)을 최근 1년간 구하고 50일 이동평균선과 함께 시각화해줘.',
    presetId: 'relative_strength'
  },
  {
    icon: <Gauge size={14} color="#fbbf24" />,
    title: 'RSI(14) 기술적 스캐너',
    prompt: '5개 지수의 14일 RSI와 20일 이동평균선 대비 현재가 괴리율을 계산해서 표와 차트로 보여줘.',
    presetId: 'rsi_scanner'
  }
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedModel,
  e2bApiKey,
  modelKeys,
  indices,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // 세션 전체 누적 토큰 사용량
  const [sessionTokens, setSessionTokens] = useState<TokenUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentModelInfo = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];
  const currentModelKey = modelKeys[currentModelInfo.provider.toLowerCase()] || '';

  // Gemini 모델은 서버 환경변수에 기본 내장되어 있으므로 항상 사용 가능
  const isDefaultGemini = currentModelInfo.provider === 'Google';
  const hasAllKeys = isDefaultGemini || Boolean(e2bApiKey && e2bApiKey.trim() !== '' && currentModelKey && currentModelKey.trim() !== '');

  // 새 메시지 추가 시 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 실행 정지 (Stop / Abort) 처리
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    const stopMessage: ChatMessage = {
      id: `stopped-${Date.now()}`,
      role: 'assistant',
      content: '🛑 **사용자 요청으로 실행이 중단되었습니다.** (E2B 샌드박스 및 AI 생성 취소)',
      model: currentModelInfo.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, stopMessage]);
  };

  // 전송 처리
  const handleSend = async (overridePrompt?: string, presetId?: string) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || loading) return;

    // 만약 기본 내장 모델(Gemini)이 아니고 다른 모델(OpenAI/Claude)인데 키가 없다면 설정창 열기
    if (!isDefaultGemini && (!currentModelKey || currentModelKey.trim() === '')) {
      onOpenSettings();
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: textToSend,
          model: currentModelInfo.id,
          modelApiKey: currentModelKey,
          e2bApiKey: e2bApiKey || undefined,
        }),
      });

      const data = await res.json();

      // 토큰 사용량 누적 갱신
      if (data.tokenUsage) {
        setSessionTokens((prev) => ({
          promptTokens: prev.promptTokens + (data.tokenUsage.promptTokens || 0),
          completionTokens: prev.completionTokens + (data.tokenUsage.completionTokens || 0),
          totalTokens: prev.totalTokens + (data.tokenUsage.totalTokens || 0),
        }));
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.agentInsight,
        charts: data.charts,
        generatedCode: data.generatedCode,
        sandboxId: data.sandboxId,
        logs: data.logs,
        executionTimeMs: data.executionTimeMs,
        tokenUsage: data.tokenUsage,
        model: currentModelInfo.name,
        isMock: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // handleStop()에서 중단 메시지를 생성했으므로 여기서는 무시
        return;
      }
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `오류가 발생했습니다: ${err.message || '서버와의 통신에 실패했습니다.'}`,
        model: currentModelInfo.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  // 엔터키 및 Escape키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && loading) {
      e.preventDefault();
      handleStop();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 코드 복사
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 84px)',
      width: '100%',
      maxWidth: 1040,
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Top Status & Token Usage Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        borderBottom: '1px solid rgba(55, 65, 81, 0.4)',
        background: 'rgba(15, 23, 42, 0.45)',
        fontSize: '0.78rem',
        color: '#94a3b8',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: loading ? '#f59e0b' : '#10b981',
            boxShadow: loading ? '0 0 8px #f59e0b' : '0 0 6px #10b981',
            transition: 'all 0.2s ease'
          }} />
          <span>
            {loading ? (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>E2B 연산 및 코드 실행 진행 중...</span>
            ) : (
              <span>엔진 준비 완료: <strong style={{ color: '#f1f5f9' }}>{currentModelInfo.name}</strong></span>
            )}
          </span>
        </div>

        {/* Real-time Session Token Usage Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(30, 41, 59, 0.7)',
          padding: '3px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
          <Coins size={13} color="#38bdf8" />
          <span style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>
            세션 누적 토큰:
          </span>
          <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            {sessionTokens.totalTokens.toLocaleString()}
          </strong>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            (입력 {sessionTokens.promptTokens.toLocaleString()} · 출력 {sessionTokens.completionTokens.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 16px 140px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: 680,
            padding: '40px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.35)',
              marginBottom: 4
            }}>
              <Bot size={28} color="#ffffff" />
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
              무엇을 분석해 드릴까요?
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: 540 }}>
              선택하신 <strong>{currentModelInfo.name}</strong> 모델이 질문을 바탕으로 Python 데이터 분석 코드를 작성하고, <strong>E2B 클라우드 리눅스 MicroVM</strong>에서 5대 주가지수를 직접 연산합니다.
            </p>

            {/* Key Missing Banner */}
            {!hasAllKeys && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: 620,
                marginTop: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ fontSize: '0.82rem', color: '#fcd34d', fontWeight: 600 }}>
                    실제 AI 에이전트와 E2B MicroVM을 실행하려면 API Key 등록이 필요합니다.
                  </span>
                </div>
                <button
                  onClick={onOpenSettings}
                  className="btn-primary"
                  style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#d97706' }}
                >
                  키 입력하기
                </button>
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 10,
              width: '100%',
              marginTop: 16
            }}>
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt, item.presetId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(31, 41, 55, 0.45)',
                    border: '1px solid var(--border-color)',
                    color: '#f3f4f6',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                    e.currentTarget.style.background = 'rgba(31, 41, 55, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(31, 41, 55, 0.45)';
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  <Bot size={17} color="#ffffff" />
                </div>
              )}

              {/* Message Bubble Container */}
              <div style={{
                maxWidth: isUser ? '75%' : '88%',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                {/* Header info for assistant */}
                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem', color: '#9ca3af' }}>
                    <span style={{ fontWeight: 700, color: '#e5e7eb' }}>{msg.model || 'E2B Stock Agent'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                    {msg.executionTimeMs && (
                      <>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} color="#38bdf8" />
                          {msg.executionTimeMs}ms
                        </span>
                      </>
                    )}
                    {msg.sandboxId && (
                      <>
                        <span>·</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(16, 185, 129, 0.25)'
                        }}>
                          E2B: {msg.sandboxId}
                        </span>
                      </>
                    )}
                    {msg.tokenUsage && (
                      <>
                        <span>·</span>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem'
                        }}>
                          <Coins size={11} color="#38bdf8" />
                          <span>{msg.tokenUsage.totalTokens.toLocaleString()} 토큰</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.67rem' }}>
                            (입 {msg.tokenUsage.promptTokens} / 출 {msg.tokenUsage.completionTokens})
                          </span>
                        </span>
                      </>
                    )}
                    {msg.isMock && (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>[Demo VM]</span>
                    )}
                  </div>
                )}

                {/* Main Content Bubble */}
                <div style={{
                  padding: isUser ? '12px 18px' : '18px 20px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: isUser ? 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)' : 'rgba(17, 24, 39, 0.75)',
                  border: isUser ? 'none' : '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  backdropFilter: 'blur(10px)',
                  color: '#f9fafb'
                }}>
                  {/* Assistant: Accordion for E2B Python Code & Sandbox Logs */}
                  {!isUser && msg.generatedCode && (
                    <details style={{ marginBottom: 14 }}>
                      <summary>
                        <Terminal size={14} color="#38bdf8" />
                        <span>⚡ E2B Sandbox ({msg.sandboxId ? `MicroVM: ${msg.sandboxId}` : 'Cloud VM'}) 코드 및 실행 로그 보기</span>
                      </summary>
                      <div style={{ padding: '12px 14px', background: '#090d16', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>Python 3.11</span>
                          <button
                            onClick={() => handleCopyCode(msg.generatedCode!, msg.id)}
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            {copiedCodeId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            <span>{copiedCodeId === msg.id ? '복사됨' : '복사'}</span>
                          </button>
                        </div>
                        <pre style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          color: '#38bdf8',
                          overflowX: 'auto',
                          lineHeight: 1.45,
                          maxHeight: 250,
                          margin: 0
                        }}>
                          <code>{msg.generatedCode}</code>
                        </pre>

                        {/* Logs stdout */}
                        {msg.logs?.stdout && msg.logs.stdout.length > 0 && (
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(55, 65, 81, 0.5)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                              $ Sandbox stdout:
                            </div>
                            <pre style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.74rem',
                              color: '#d1d5db',
                              overflowX: 'auto',
                              maxHeight: 160,
                              margin: 0,
                              whiteSpace: 'pre-wrap'
                            }}>
                              {msg.logs.stdout.join('\n')}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Message Content: ReactMarkdown with GFM */}
                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="table-responsive-wrapper">
                            <table {...props} />
                          </div>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Assistant: Generated Chart Image */}
                  {!isUser && msg.charts && msg.charts.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      {msg.charts.map((chartSrc, i) => (
                        <div
                          key={i}
                          style={{
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            background: '#090d16',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={() => setModalImage(chartSrc)}
                        >
                          <img
                            src={chartSrc}
                            alt="E2B Generated Visual Plot"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(15, 23, 42, 0.75)',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: '0.7rem',
                            color: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Maximize2 size={11} />
                            <span>클릭하여 확대</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(55, 65, 81, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  <User size={17} color="#e5e7eb" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Spinner Indicator with Stop Button */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={17} color="#ffffff" />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '4px 18px 18px 18px',
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              fontSize: '0.85rem',
              color: '#38bdf8',
              maxWidth: '85%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="pulse-dot" style={{ backgroundColor: '#38bdf8' }} />
                <span>
                  <strong>{currentModelInfo.name}</strong>가 E2B 샌드박스에서 파이썬 코드를 실행 중입니다...
                </span>
              </div>
              <button
                onClick={handleStop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.15)';
                }}
                title="분석 실행 중단"
              >
                <Square size={11} fill="#f87171" />
                <span>정지</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px 20px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(11, 15, 25, 0.95) 30%, #0b0f19 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: 'rgba(31, 41, 55, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(55, 65, 81, 0.9)',
          borderRadius: 'var(--radius-xl)',
          padding: '8px 12px 8px 18px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s'
        }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? "분석이 진행 중입니다... (Esc 또는 정지 버튼으로 중단 가능)" : `${currentModelInfo.name}에게 5대 지수 분석 요청 (예: 최근 3달 코스피와 나스닥 상관계수 구해줘)...`}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f9fafb',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none',
              maxHeight: 120,
              fontFamily: 'inherit',
              padding: '4px 0'
            }}
          />

          {loading ? (
            <button
              onClick={handleStop}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.6)',
                transition: 'all 0.15s ease'
              }}
              title="분석 실행 정지 (Stop)"
            >
              <Square size={14} fill="#ffffff" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="btn-primary"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: !input.trim() ? 'not-allowed' : 'pointer',
                opacity: !input.trim() ? 0.4 : 1,
              }}
              title="메시지 전송"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#6b7280',
          marginTop: 8
        }}>
          E2B Cloud Code Interpreter MicroVM · Python 3.11 · yfinance · S&amp;P 500, Russell 2000, KOSPI, KOSDAQ, NASDAQ
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setModalImage(null)}
              style={{
                position: 'absolute',
                top: -36,
                right: 0,
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>
            <img
              src={modalImage}
              alt="Expanded Chart"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
