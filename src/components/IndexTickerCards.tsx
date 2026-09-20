'use client';

import React from 'react';
import { IndexInfo, IndexId } from '@/lib/types';
import { TrendingUp, TrendingDown, Globe, Sparkle } from 'lucide-react';

interface IndexTickerCardsProps {
  indices: IndexInfo[];
  selectedIndex: IndexId | null;
  onSelectIndex: (id: IndexId) => void;
}

export const IndexTickerCards: React.FC<IndexTickerCardsProps> = ({
  indices,
  selectedIndex,
  onSelectIndex,
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: 14,
      marginBottom: 24,
    }}>
      {indices.map((idx) => {
        const isPositive = idx.change >= 0;
        const isSelected = selectedIndex === idx.id;

        // 52주 범위 위치 계산
        const range = idx.high52w - idx.low52w;
        const currentPos = Math.min(100, Math.max(0, ((idx.currentPrice - idx.low52w) / range) * 100));

        // 스파크라인 SVG 포인트 생성
        const minSpark = Math.min(...idx.sparkline);
        const maxSpark = Math.max(...idx.sparkline);
        const sparkRange = maxSpark - minSpark || 1;
        const svgPoints = idx.sparkline
          .map((val, i) => {
            const x = (i / (idx.sparkline.length - 1)) * 100;
            const y = 30 - ((val - minSpark) / sparkRange) * 25;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <div
            key={idx.id}
            onClick={() => onSelectIndex(idx.id)}
            className="glass-panel"
            style={{
              padding: '16px 18px',
              cursor: 'pointer',
              borderColor: isSelected ? idx.color : undefined,
              boxShadow: isSelected ? `0 0 20px -3px ${idx.color}40` : undefined,
              transform: isSelected ? 'translateY(-2px)' : undefined,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Accent Line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: idx.color,
              opacity: isSelected ? 1 : 0.4
            }} />

            {/* Header: Name & Market Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {idx.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  {idx.symbol}
                </span>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
                background: idx.market === 'US' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                color: idx.market === 'US' ? '#38bdf8' : '#f43f5e',
                border: `1px solid ${idx.market === 'US' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
              }}>
                {idx.market === 'US' ? '🇺🇸 미국' : '🇰🇷 한국'}
              </span>
            </div>

            {/* Price and Change Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
                  {idx.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {idx.currency} · 거래량 {idx.volume}
                </div>
              </div>

              <div className={`badge ${isPositive ? 'badge-positive' : 'badge-negative'}`} style={{ padding: '4px 8px' }}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>
                  {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Sparkline & 52-Week Range */}
            <div style={{ borderTop: '1px solid rgba(51, 65, 85, 0.4)', paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>최근 7일 추이</span>
                <span style={{ fontSize: '0.68rem', color: isPositive ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                  {isPositive ? '+' : ''}{idx.change.toFixed(2)} pt
                </span>
              </div>

              {/* Sparkline SVG */}
              <div style={{ width: '100%', height: 26, marginBottom: 8 }}>
                <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <polyline
                    fill="none"
                    stroke={idx.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                  />
                </svg>
              </div>

              {/* 52-Week Range Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginBottom: 3 }}>
                  <span>52주 최저 {idx.low52w.toLocaleString()}</span>
                  <span>52주 최고 {idx.high52w.toLocaleString()}</span>
                </div>
                <div style={{
                  width: '100%',
                  height: 4,
                  background: 'rgba(51, 65, 85, 0.6)',
                  borderRadius: 9999,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${currentPos}%`,
                    background: idx.color,
                    borderRadius: 9999,
                  }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
