'use client';

import React, { useState, useMemo } from 'react';
import { HistoricalDataPoint, IndexInfo, IndexId } from '@/lib/types';
import { Calendar, BarChart3, Check } from 'lucide-react';

interface InteractiveChartProps {
  historicalData: HistoricalDataPoint[];
  indices: IndexInfo[];
}

type Timeframe = '1M' | '3M' | '6M';

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  historicalData,
  indices,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [activeIndices, setActiveIndices] = useState<Record<IndexId, boolean>>({
    SP500: true,
    NASDAQ: true,
    RUSSELL2000: true,
    KOSPI: true,
    KOSDAQ: true,
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 기간 필터링
  const filteredData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];
    const count = timeframe === '1M' ? 22 : timeframe === '3M' ? 66 : 130;
    return historicalData.slice(-count);
  }, [historicalData, timeframe]);

  // 각 지수의 기준일 대비 정규화 수익률(%) 계산
  const normalizedSeries = useMemo(() => {
    if (filteredData.length === 0) return [];
    const base = filteredData[0];

    return filteredData.map((d) => ({
      date: d.date,
      SP500: ((d.SP500 - base.SP500) / base.SP500) * 100,
      NASDAQ: ((d.NASDAQ - base.NASDAQ) / base.NASDAQ) * 100,
      RUSSELL2000: ((d.RUSSELL2000 - base.RUSSELL2000) / base.RUSSELL2000) * 100,
      KOSPI: ((d.KOSPI - base.KOSPI) / base.KOSPI) * 100,
      KOSDAQ: ((d.KOSDAQ - base.KOSDAQ) / base.KOSDAQ) * 100,
    }));
  }, [filteredData]);

  // 차트 최소/최대 Y 범위 계산
  const { minY, maxY } = useMemo(() => {
    if (normalizedSeries.length === 0) return { minY: -10, maxY: 10 };
    let min = 0;
    let max = 0;
    normalizedSeries.forEach((d) => {
      (Object.keys(activeIndices) as IndexId[]).forEach((id) => {
        if (activeIndices[id]) {
          const val = d[id];
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });
    // 여유 마진 20%
    const padding = Math.max(Math.abs(max - min) * 0.15, 2);
    return { minY: min - padding, maxY: max + padding };
  }, [normalizedSeries, activeIndices]);

  // SVG 차트 좌표 계산
  const chartWidth = 900;
  const chartHeight = 320;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerW = chartWidth - paddingLeft - paddingRight;
  const innerH = chartHeight - paddingTop - paddingBottom;
  const yRange = maxY - minY || 1;

  const getY = (val: number) => {
    return paddingTop + innerH - ((val - minY) / yRange) * innerH;
  };

  const getX = (idx: number, total: number) => {
    if (total <= 1) return paddingLeft;
    return paddingLeft + (idx / (total - 1)) * innerW;
  };

  const zeroY = getY(0);

  // 지수 토글 핸들러
  const toggleIndex = (id: IndexId) => {
    setActiveIndices((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hoverItem = hoverIndex !== null && normalizedSeries[hoverIndex] ? normalizedSeries[hoverIndex] : null;

  return (
    <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: 24 }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              5대 주요 지수 정규화 수익률 비교 (Normalized Return %)
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
            시작일(=0%)을 기준으로 각 지수의 상대적 수익률 추이를 한눈에 대조합니다.
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div style={{
          display: 'flex',
          background: 'rgba(30, 41, 59, 0.7)',
          padding: 3,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          {(['1M', '3M', '6M'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? '#0284c7' : 'transparent',
                color: timeframe === tf ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Index Toggle Checkboxes */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 14,
        borderBottom: '1px solid rgba(51, 65, 85, 0.4)'
      }}>
        {indices.map((idx) => {
          const active = activeIndices[idx.id];
          const latestReturn = normalizedSeries.length > 0 ? normalizedSeries[normalizedSeries.length - 1][idx.id] : 0;
          return (
            <button
              key={idx.id}
              onClick={() => toggleIndex(idx.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                background: active ? `${idx.color}15` : 'rgba(30, 41, 59, 0.4)',
                border: `1px solid ${active ? idx.color : 'rgba(51, 65, 85, 0.5)'}`,
                color: active ? '#f8fafc' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.15s'
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: active ? idx.color : '#475569'
              }} />
              <span>{idx.name}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: latestReturn >= 0 ? '#10b981' : '#f43f5e',
                fontSize: '0.72rem'
              }}>
                {latestReturn >= 0 ? '+' : ''}{latestReturn.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div
        style={{ position: 'relative', width: '100%', overflowX: 'auto' }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: 'auto', minWidth: 600, display: 'block' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const svgX = (mouseX / rect.width) * chartWidth;
            if (svgX >= paddingLeft && svgX <= chartWidth - paddingRight) {
              const ratio = (svgX - paddingLeft) / innerW;
              const idx = Math.round(ratio * (normalizedSeries.length - 1));
              setHoverIndex(Math.max(0, Math.min(normalizedSeries.length - 1, idx)));
            }
          }}
        >
          {/* Grid lines */}
          {[-20, -10, 0, 10, 20, 30].map((tick) => {
            if (tick < minY || tick > maxY) return null;
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={tick === 0 ? 'rgba(148, 163, 184, 0.4)' : 'rgba(51, 65, 85, 0.3)'}
                  strokeDasharray={tick === 0 ? undefined : '3,3'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {tick > 0 ? `+${tick}%` : `${tick}%`}
                </text>
              </g>
            );
          })}

          {/* Lines for each active index */}
          {indices.map((idx) => {
            if (!activeIndices[idx.id] || normalizedSeries.length === 0) return null;

            const pathD = normalizedSeries
              .map((d, i) => {
                const x = getX(i, normalizedSeries.length);
                const y = getY(d[idx.id]);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');

            return (
              <g key={idx.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={idx.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Hover Crosshair & Dots */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex, normalizedSeries.length)}
                y1={paddingTop}
                x2={getX(hoverIndex, normalizedSeries.length)}
                y2={chartHeight - paddingBottom}
                stroke="rgba(148, 163, 184, 0.6)"
                strokeDasharray="2,2"
                strokeWidth="1"
              />
              {indices.map((idx) => {
                if (!activeIndices[idx.id]) return null;
                const val = normalizedSeries[hoverIndex][idx.id];
                const cx = getX(hoverIndex, normalizedSeries.length);
                const cy = getY(val);
                return (
                  <circle
                    key={idx.id}
                    cx={cx}
                    cy={cy}
                    r="4.5"
                    fill={idx.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* X Axis Dates */}
          {normalizedSeries.length > 0 && (
            <g>
              <text
                x={paddingLeft}
                y={chartHeight - 8}
                fill="#64748b"
                fontSize="10"
                textAnchor="start"
              >
                {normalizedSeries[0].date} (기준점 0%)
              </text>
              <text
                x={chartWidth - paddingRight}
                y={chartHeight - 8}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
              >
                {normalizedSeries[normalizedSeries.length - 1].date}
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoverItem && (
          <div style={{
            position: 'absolute',
            top: 15,
            right: 25,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '0.75rem',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
              📅 일자: {hoverItem.date}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {indices.map((idx) => {
                if (!activeIndices[idx.id]) return null;
                const val = hoverItem[idx.id];
                return (
                  <div key={idx.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: idx.color }} />
                    <span style={{ color: '#cbd5e1' }}>{idx.name}:</span>
                    <span style={{
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: val >= 0 ? '#10b981' : '#f43f5e'
                    }}>
                      {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
