'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Shield, ExternalLink, Check, Bot, Settings2 } from 'lucide-react';
import { AI_MODELS } from '@/lib/types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKeys: (config: { e2bKey: string; modelKeys: Record<string, string> }) => void;
  currentE2bKey?: string;
  selectedModel: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKeys,
  currentE2bKey = '',
  selectedModel,
}) => {
  const [e2bKey, setE2bKey] = useState(currentE2bKey);
  const [modelKeys, setModelKeys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setE2bKey(currentE2bKey);
    const storedModelKeys = localStorage.getItem('model_api_keys');
    if (storedModelKeys) {
      try {
        setModelKeys(JSON.parse(storedModelKeys));
      } catch (e) {}
    }
  }, [currentE2bKey, isOpen]);

  if (!isOpen) return null;

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  const handleSave = () => {
    onSaveKeys({ e2bKey: e2bKey.trim(), modelKeys });
    localStorage.setItem('model_api_keys', JSON.stringify(modelKeys));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 16
    }}>
      <div className="glass-panel" style={{
        maxWidth: 540,
        width: '100%',
        padding: '24px 28px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Settings2 size={20} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb' }}>
              모델 및 E2B 환경 설정
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
              현재 선택된 모델: <strong>{currentModel.name} ({currentModel.provider})</strong>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: '0.76rem',
          color: '#cbd5e1',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 600, marginBottom: 3 }}>
            <Shield size={13} />
            <span>로컬 브라우저 보안 저장 안내</span>
          </div>
          API 키는 브라우저 로컬 저장소에만 보관됩니다. 키를 입력하지 않아도 <strong>데모 샌드박스 모드</strong>로 모든 분석 기능을 즉시 이용하실 수 있습니다.
        </div>

        {/* E2B API Key Input */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f9fafb' }}>
              E2B API Key (클라우드 MicroVM 샌드박스)
            </label>
            <a
              href="https://console.e2b.dev/?tab=keys"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
            >
              <span>E2B 키 발급</span>
              <ExternalLink size={11} />
            </a>
          </div>
          <input
            type="password"
            value={e2bKey}
            onChange={(e) => setE2bKey(e.target.value)}
            placeholder="e2b_******************************"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-color)',
              color: '#f9fafb',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Selected Model API Key Input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f9fafb' }}>
              {currentModel.provider} API Key (선택사항)
            </label>
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
              미입력 시 기본 내장 에이전트로 자동 연동
            </span>
          </div>
          <input
            type="password"
            value={modelKeys[currentModel.provider.toLowerCase()] || ''}
            onChange={(e) => setModelKeys({ ...modelKeys, [currentModel.provider.toLowerCase()]: e.target.value })}
            placeholder={`sk-... (${currentModel.provider} Key)`}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-color)',
              color: '#f9fafb',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            {saved ? (
              <>
                <Check size={14} />
                <span>저장 완료</span>
              </>
            ) : (
              <span>설정 저장하기</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
