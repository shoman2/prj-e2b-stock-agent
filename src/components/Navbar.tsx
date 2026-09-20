'use client';

import React from 'react';
import { Cpu, Key, ExternalLink, Bot, ChevronDown } from 'lucide-react';
import { IndexInfo, AI_MODELS, AIModelOption } from '@/lib/types';

interface NavbarProps {
  indices: IndexInfo[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenSettings: () => void;
  isMock: boolean;
  hasCustomKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  indices,
  selectedModel,
  onSelectModel,
  onOpenSettings,
  isMock,
  hasCustomKey,
}) => {
  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '8px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      {/* Top Bar: Brand, Model Selector, Status & Settings */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)'
          }}>
            <Cpu size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
                E2B Stock <span style={{ color: '#38bdf8' }}>Agent</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '1px 6px',
                borderRadius: 4,
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}>
                E2B Sandbox
              </span>
            </div>
          </div>
        </div>

        {/* Center: AI Model Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(31, 41, 55, 0.7)',
            border: '1px solid rgba(55, 65, 81, 0.8)',
            borderRadius: 'var(--radius-md)',
            padding: '2px 8px',
            fontSize: '0.8rem',
            color: '#f3f4f6'
          }}>
            <Bot size={15} color="#38bdf8" style={{ marginRight: 6 }} />
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginRight: 6 }}>모델:</span>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f9fafb',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                padding: '4px 20px 4px 2px',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id} style={{ background: '#111827', color: '#f9fafb' }}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
            <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Right: Status & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* E2B State Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 9px',
            borderRadius: 6,
            background: hasCustomKey ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${hasCustomKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: hasCustomKey ? '#10b981' : '#f59e0b'
          }}>
            <span className="pulse-dot" style={{ backgroundColor: hasCustomKey ? '#10b981' : '#f59e0b' }} />
            <span>{hasCustomKey ? 'E2B Live VM' : 'Demo Sandbox'}</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
          >
            <Key size={13} color="#38bdf8" />
            <span>모델 &amp; API 설정</span>
          </button>
        </div>
      </div>

      {/* Sub Bar: 1-Line Compact Index Ticker Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        overflowX: 'auto',
        padding: '3px 0',
        borderTop: '1px solid rgba(55, 65, 81, 0.3)',
        fontSize: '0.74rem',
        whiteSpace: 'nowrap'
      }}>
        <span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600 }}>주요 지수:</span>
        {indices.map((idx) => {
          const isPos = idx.change >= 0;
          return (
            <div
              key={idx.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(31, 41, 55, 0.4)'
              }}
            >
              <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{idx.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#9ca3af' }}>
                {idx.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: isPos ? '#10b981' : '#f43f5e'
              }}>
                {isPos ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
};
