'use client';

import React, { useState, useEffect } from 'react';
import { IndexInfo, HistoricalDataPoint, IndexId } from '@/lib/types';
import { INDICES_METADATA, generateHistoricalData } from '@/lib/mock-data';
import { Navbar } from '@/components/Navbar';
import { IndexTickerCards } from '@/components/IndexTickerCards';
import { InteractiveChart } from '@/components/InteractiveChart';
import { AgentWorkspace } from '@/components/AgentWorkspace';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { Info, Sparkles, Terminal, Activity, Layers } from 'lucide-react';

export default function HomePage() {
  const [indices, setIndices] = useState<IndexInfo[]>(INDICES_METADATA);
  const [historical, setHistorical] = useState<HistoricalDataPoint[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<IndexId | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [e2bKey, setE2bKey] = useState<string>('');

  // 클라이언트 로컬스토리지에서 E2B Key 복원
  useEffect(() => {
    const storedKey = localStorage.getItem('e2b_api_key') || '';
    setE2bKey(storedKey);

    // API에서 지수 데이터 로드
    fetch('/api/indices/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIndices(data.indices);
          setHistorical(data.historical);
        }
      })
      .catch((err) => {
        console.error('Failed to load indices summary:', err);
        // Fallback to local mock data
        setHistorical(generateHistoricalData());
      });
  }, []);

  const handleSaveKeys = (newKey: string) => {
    setE2bKey(newKey);
    localStorage.setItem('e2b_api_key', newKey);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMock={!e2bKey}
        hasCustomKey={Boolean(e2bKey)}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '24px 20px 48px',
        width: '100%',
        flex: 1
      }}>
        {/* Intro Header Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                글로벌 5대 주가지수 통합 모니터링 &amp; AI 샌드박스
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                S&amp;P 500, Russell 2000, KOSPI, KOSDAQ, NASDAQ 지수 간 동조화 및 기술적/통계적 리스크를 E2B Code Interpreter로 검증합니다.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>런타임 스택:</span>
            <span style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              color: '#38bdf8'
            }}>
              yfinance + pandas + seaborn
            </span>
          </div>
        </div>

        {/* 1. Top Ticker Cards (5 Indices) */}
        <IndexTickerCards
          indices={indices}
          selectedIndex={selectedIndex}
          onSelectIndex={(id) => setSelectedIndex(selectedIndex === id ? null : id)}
        />

        {/* 2. Interactive Return Comparison Chart */}
        <InteractiveChart
          historicalData={historical}
          indices={indices}
        />

        {/* 3. E2B AI Agent Workspace */}
        <AgentWorkspace
          e2bApiKey={e2bKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(9, 13, 22, 0.95)',
        padding: '24px 20px',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            Powered by <strong>E2B Code Interpreter Sandbox</strong> &amp; Next.js 14 · 지원 지수: ^GSPC, ^IXIC, ^RUT, ^KS11, ^KQ11
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>실시간 클라우드 샌드박스 격리 보안 실행 환경</span>
            <span>데이터 출처: Yahoo Finance Index Feeds</span>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveKeys={handleSaveKeys}
        currentE2bKey={e2bKey}
      />
    </div>
  );
}
