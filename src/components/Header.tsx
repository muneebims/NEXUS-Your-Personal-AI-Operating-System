import React from 'react';
import {
  Menu,
  Bot,
  Zap,
  Settings,
  Plus,
  PanelRight,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AppSettings, SystemStatus, AgentStep } from '../types/nexus.js';

interface HeaderProps {
  settings: AppSettings;
  systemStatus: SystemStatus | null;
  agentMode: boolean;
  onToggleAgentMode: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  onOpenSettings: () => void;
  onOpenStatus: () => void;
  onNewChat: () => void;
  onToggleMobileSidebar: () => void;
  isStreaming: boolean;
  recentSteps?: AgentStep[];
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  systemStatus,
  agentMode,
  onToggleAgentMode,
  showRightPanel,
  onToggleRightPanel,
  onOpenSettings,
  onOpenStatus,
  onNewChat,
  onToggleMobileSidebar,
  isStreaming,
  recentSteps = [],
}) => {
  const isOnline =
    settings.provider === 'groq'
      ? Boolean(systemStatus?.groqConfigured || systemStatus?.openaiConfigured)
      : settings.provider === 'gemini'
      ? Boolean(systemStatus?.geminiConfigured)
      : Boolean(systemStatus?.openaiConfigured);

  const currentStage = recentSteps.length > 0
    ? recentSteps[recentSteps.length - 1].stage
    : null;

  return (
    <header
      id="nexus-header"
      className="h-14 border-b px-3 sm:px-4 flex items-center justify-between select-none z-20 shrink-0 transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Left: Mobile Menu + Compact NEXUS Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800/30 transition-colors"
          aria-label="Open navigation sidebar"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Compact System Status Indicator */}
        <button
          id="nexus-status-pill"
          onClick={onOpenStatus}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition-all hover:scale-105 cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
          title="Click to view detailed system health and connection"
          aria-label="System status: Online. Click for details."
        >
          <span className="font-semibold text-xs tracking-wide">NEXUS</span>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: isOnline ? 'var(--color-success)' : 'var(--color-warning)',
              boxShadow: isOnline ? '0 0 8px var(--color-success)' : 'none',
            }}
          />
          <span
            className="text-[11px] font-medium"
            style={{
              color: isOnline ? 'var(--color-success)' : 'var(--color-warning)',
            }}
          >
            {isOnline ? 'Online' : 'Standby'}
          </span>
        </button>
      </div>

      {/* Center: Compact Agent Mode Indicator (Only when Agent Mode is ON) */}
      {agentMode && (
        <div
          onClick={onToggleRightPanel}
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer transition-all hover:opacity-90 shadow-sm"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            borderColor: 'var(--accent-color)',
            color: 'var(--accent-color)',
          }}
          title="Agent Mode is active. Click to view Inspector drawer."
          role="button"
          aria-label="Agent working. Click to open Agent Inspector"
        >
          <Bot className="w-3.5 h-3.5 animate-bounce" />
          <span className="text-xs font-semibold">
            {isStreaming ? '🤖 Agent working:' : '🤖 Agent ready:'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-90">
            <span className={currentStage === 'PLAN' ? 'font-bold underline' : ''}>Plan</span>
            <span>&rarr;</span>
            <span className={currentStage === 'SELECT_TOOL' || currentStage === 'EXECUTE_TOOL' ? 'font-bold underline' : ''}>Tool</span>
            <span>&rarr;</span>
            <span className={currentStage === 'OBSERVE' ? 'font-bold underline' : ''}>Observe</span>
            <span>&rarr;</span>
            <span className={currentStage === 'COMPLETE' ? 'font-bold text-emerald-400' : ''}>Complete</span>
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-90"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          aria-label="Start new conversation"
          title="New conversation"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Agent Mode Toggle Switch */}
        <button
          onClick={onToggleAgentMode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
          style={{
            backgroundColor: agentMode ? 'var(--accent-subtle)' : 'var(--bg-surface-elevated)',
            borderColor: agentMode ? 'var(--accent-color)' : 'var(--border-color)',
            color: agentMode ? 'var(--accent-color)' : 'var(--text-secondary)',
          }}
          aria-label={`Toggle Agent Mode. Currently ${agentMode ? 'ON' : 'OFF'}`}
          title={agentMode ? 'Agent Mode is ON (Autonomous multi-step)' : 'Agent Mode is OFF (Direct chat)'}
        >
          <Zap className={`w-3.5 h-3.5 ${agentMode ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">Agent:</span>
          <span className="font-semibold">{agentMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Agent Inspector Drawer Toggle Button */}
        <button
          onClick={onToggleRightPanel}
          className={`p-2 rounded-lg border transition-all relative ${
            showRightPanel ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: showRightPanel ? 'var(--accent-subtle)' : 'var(--bg-surface-elevated)',
            borderColor: showRightPanel ? 'var(--accent-color)' : 'var(--border-color)',
            color: showRightPanel ? 'var(--accent-color)' : 'var(--text-secondary)',
          }}
          aria-label={showRightPanel ? 'Close Agent Inspector' : 'Open Agent Inspector'}
          title="Agent Inspector Drawer"
        >
          <PanelRight className="w-4 h-4" />
          {isStreaming && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: 'var(--accent-color)' }}
            />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg border transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Open Settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
