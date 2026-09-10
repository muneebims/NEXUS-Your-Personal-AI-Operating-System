import React from 'react';
import { X, CheckCircle2, AlertCircle, Cpu, Zap, Server, ShieldCheck } from 'lucide-react';
import { SystemStatus, AppSettings } from '../types/nexus.js';

interface StatusModalProps {
  systemStatus: SystemStatus | null;
  settings: AppSettings;
  onOpenSettings: () => void;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  systemStatus,
  settings,
  onOpenSettings,
  onClose,
}) => {
  const isGroq = settings.provider === 'groq';
  const isConnected = isGroq
    ? Boolean(systemStatus?.groqConfigured || systemStatus?.openaiConfigured)
    : settings.provider === 'gemini'
    ? Boolean(systemStatus?.geminiConfigured)
    : Boolean(systemStatus?.openaiConfigured);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--accent-color)',
                color: 'var(--accent-color)',
              }}
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 id="status-modal-title" className="text-base font-semibold">
                System Status
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                NEXUS Personal AI Operating System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close status dialog"
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-800/40"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Health Card */}
        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-warning)',
                boxShadow: isConnected ? '0 0 10px var(--color-success)' : 'none',
              }}
            />
            <div>
              <div className="text-sm font-medium">
                {isConnected ? 'All Systems Operational' : 'Provider Needs Setup'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Active Provider: <span className="font-semibold capitalize">{settings.provider}</span>
              </div>
            </div>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isConnected ? 'var(--color-success)' : 'var(--color-warning)',
            }}
          >
            {isConnected ? 'Online' : 'Standby'}
          </span>
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 text-xs">
          <div
            className="flex items-center justify-between p-2.5 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              Active AI Model
            </span>
            <span className="font-mono font-medium">
              {settings.provider === 'groq'
                ? settings.groqModel || 'openai/gpt-oss-20b'
                : settings.provider === 'gemini'
                ? settings.geminiModel
                : settings.openaiModel}
            </span>
          </div>

          <div
            className="flex items-center justify-between p-2.5 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Server className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              Backend Architecture
            </span>
            <span className="font-medium">Express + Secure Proxy</span>
          </div>

          <div
            className="flex items-center justify-between p-2.5 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
              API Key Protection
            </span>
            <span style={{ color: 'var(--color-success)' }} className="font-medium">
              Isolated Server-Side
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--accent-color)' }}
          >
            Configure in Settings &rarr;
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
