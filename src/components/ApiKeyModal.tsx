'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Shield, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKeys: (e2bKey: string) => void;
  currentE2bKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKeys,
  currentE2bKey = '',
}) => {
  const [e2bKey, setE2bKey] = useState(currentE2bKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setE2bKey(currentE2bKey);
  }, [currentE2bKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKeys(e2bKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 16
    }}>
      <div className="glass-panel" style={{
        maxWidth: 520,
        width: '100%',
        padding: '24px 26px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
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
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Key size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              E2B 환경설정 및 API 키
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              E2B 클라우드 샌드박스에서 파이썬 코드를 실행하기 위한 API 키를 설정합니다.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: 18,
          fontSize: '0.78rem',
          color: '#cbd5e1',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 600, marginBottom: 4 }}>
            <Shield size={14} />
            <span>로컬 보안 브라우저 저장소 안내</span>
          </div>
          입력하신 키는 서버에 영구 보관되지 않고 브라우저의 로컬 세션에만 임시 저장됩니다. 키를 입력하지 않으셔도 <strong>데모 시뮬레이션 모드</strong>로 모든 기능을 체험하실 수 있습니다.
        </div>

        {/* E2B API Key Input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
              E2B API Key (E2B_API_KEY)
            </label>
            <a
              href="https://console.e2b.dev/?tab=keys"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.72rem',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none'
              }}
            >
              <span>E2B 콘솔에서 키 발급</span>
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
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-color)',
              color: '#f8fafc',
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
