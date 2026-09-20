'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  IndexInfo,
  AIModelOption,
  AI_MODELS,
  ExecutionResult
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
  Gauge
} from 'lucide-react';

interface ChatInterfaceProps {
  selectedModel: string;
  e2bApiKey?: string;
  indices: IndexInfo[];
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
  indices,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModelInfo = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  // 새 메시지 추가 시 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 전송 처리
  const handleSend = async (overridePrompt?: string, presetId?: string) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          presetId,
          e2bApiKey: e2bApiKey || undefined,
        }),
      });

      const data: ExecutionResult = await res.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.agentInsight,
        charts: data.charts,
        generatedCode: data.generatedCode,
        logs: data.logs,
        executionTimeMs: data.executionTimeMs,
        model: currentModelInfo.name,
        isMock: data.isMock,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `오류가 발생했습니다: ${err.message || '서버와의 통신에 실패했습니다.'}`,
        model: currentModelInfo.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 엔터키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
              선택하신 <strong>{currentModelInfo.name}</strong> 모델이 자연어 질문을 해석하여 Python 데이터 분석 코드를 작성하고, <strong>E2B 격리 샌드박스</strong>에서 5대 주가지수를 실시간 연산합니다.
            </p>

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
                        <span>⚡ E2B Sandbox 실행 파이썬 코드 및 콘솔 로그 보기</span>
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

                  {/* Assistant: Report Content */}
                  <div className="markdown-body" style={{ whiteSpace: 'pre-line' }}>
                    {msg.content}
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

        {/* Loading Spinner Indicator */}
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
              padding: '14px 18px',
              borderRadius: '4px 18px 18px 18px',
              background: 'rgba(17, 24, 39, 0.75)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.85rem',
              color: '#38bdf8'
            }}>
              <span className="pulse-dot" style={{ backgroundColor: '#38bdf8' }} />
              <span>
                <strong>{currentModelInfo.name}</strong>가 E2B 클라우드 샌드박스에서 파이썬 코드를 실행 중입니다...
              </span>
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
            placeholder={`${currentModelInfo.name}에게 5대 지수 분석 요청 (예: 최근 3달 코스피와 나스닥 상관계수 구해줘)...`}
            disabled={loading}
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

          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              padding: 0,
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Send size={16} />
          </button>
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
