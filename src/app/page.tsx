'use client';

import React, { useState, useEffect } from 'react';
import { IndexInfo } from '@/lib/types';
import { INDICES_METADATA } from '@/lib/mock-data';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function HomePage() {
  const [indices, setIndices] = useState<IndexInfo[]>(INDICES_METADATA);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-latest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [e2bKey, setE2bKey] = useState<string>('');
  const [modelKeys, setModelKeys] = useState<Record<string, string>>({});

  // 클라이언트 저장소에서 이전 설정 불러오기
  useEffect(() => {
    const storedE2bKey = localStorage.getItem('e2b_api_key') || '';
    const storedModel = localStorage.getItem('selected_model') || 'gemini-flash-latest';
    const storedModelKeys = localStorage.getItem('model_api_keys');

    setE2bKey(storedE2bKey);
    setSelectedModel(storedModel);
    if (storedModelKeys) {
      try {
        setModelKeys(JSON.parse(storedModelKeys));
      } catch (e) {}
    }

    // 지수 요약 데이터 로드
    fetch('/api/indices/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.indices) {
          setIndices(data.indices);
        }
      })
      .catch((err) => {
        console.error('Failed to load indices summary:', err);
      });
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selected_model', modelId);
  };

  const handleSaveKeys = ({ e2bKey: newKey, modelKeys: newModelKeys }: { e2bKey: string; modelKeys: Record<string, string> }) => {
    setE2bKey(newKey);
    setModelKeys(newModelKeys);
    localStorage.setItem('e2b_api_key', newKey);
    localStorage.setItem('model_api_keys', JSON.stringify(newModelKeys));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 1. Slim Top Bar with 1-Line Ticker & Model Selector */}
      <Navbar
        indices={indices}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMock={false}
        hasCustomKey={true}
      />

      {/* 2. Main Fullscreen Chat Area */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ChatInterface
          selectedModel={selectedModel}
          e2bApiKey={e2bKey}
          modelKeys={modelKeys}
          indices={indices}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      {/* 3. Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveKeys={handleSaveKeys}
        currentE2bKey={e2bKey}
        selectedModel={selectedModel}
      />
    </div>
  );
}
