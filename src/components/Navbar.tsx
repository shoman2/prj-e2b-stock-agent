'use client';

import React from 'react';
import { Cpu, Key, Activity, Sparkles, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  isMock: boolean;
  hasCustomKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  isMock,
  hasCustomKey,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '14px 24px'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                E2B Index<span style={{ color: '#38bdf8' }}>Quant</span>
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '2px 7px',
                borderRadius: 9999,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                v2.8 E2B Cloud
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 1 }}>
              5대 주요 주가지수(S&P 500 · Russell 2000 · KOSPI · KOSDAQ · NASDAQ) AI 분석 샌드박스
            </p>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* E2B Connection Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: hasCustomKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${hasCustomKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: hasCustomKey ? '#10b981' : '#f59e0b'
          }}>
            <span
              className="pulse-dot"
              style={{ backgroundColor: hasCustomKey ? '#10b981' : '#f59e0b' }}
            />
            <span>{hasCustomKey ? 'E2B Sandbox Live' : 'Demo Simulation Mode'}</span>
          </div>

          {/* Quick Docs Link */}
          <a
            href="https://docs.e2b.dev"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: 'none',
              color: '#94a3b8',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s'
            }}
          >
            <span>E2B Docs</span>
            <ExternalLink size={13} />
          </a>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <Key size={14} color="#38bdf8" />
            <span>API 키 설정</span>
          </button>
        </div>
      </div>
    </header>
  );
};
