import React from 'react';
import {
  Cpu,
  BrainCircuit,
  Wrench,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  ShieldCheck,
  Zap,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { AppSettings, SystemStatus } from '../types/nexus.js';

interface HeaderProps {
  settings: AppSettings;
  systemStatus: SystemStatus | null;
  agentMode: boolean;
  onToggleAgentMode: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  onOpenSettings: () => void;
  onOpenMemories: () => void;
  onOpenTools: () => void;
  onNewChat: () => void;
  memoriesCount: number;
  activeToolsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  systemStatus,
  agentMode,
  onToggleAgentMode,
  showRightPanel,
  onToggleRightPanel,
  onOpenSettings,
  onOpenMemories,
  onOpenTools,
  onNewChat,
  memoriesCount,
  activeToolsCount,
}) => {
  const providerDisplayName =
    settings.provider === 'groq'
      ? 'Groq'
      : settings.provider === 'openai'
      ? 'OpenAI'
      : 'Gemini';

  const activeModel =
    settings.provider === 'groq'
      ? settings.groqModel || 'openai/gpt-oss-20b'
      : settings.provider === 'openai'
      ? settings.openaiModel
      : settings.geminiModel;

  const isConfigured =
    settings.provider === 'groq'
      ? Boolean(systemStatus?.groqConfigured ?? systemStatus?.openaiConfigured)
      : settings.provider === 'openai'
      ? Boolean(systemStatus?.openaiConfigured)
      : Boolean(systemStatus?.geminiConfigured);

  return (
    <header
      id="nexus-header"
      className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between select-none z-20 shrink-0"
    >
      {/* Brand & System Pulse */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-violet-500/20 border border-cyan-500/30">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-wider text-base bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                NEXUS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                OS v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Provider & Status Badge */}
        <div
          id="header-provider-status-badge"
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 hover:border-cyan-800/80 cursor-pointer text-xs transition-colors shadow-inner"
          title="Click to configure AI Provider & Model in Settings"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Provider:</span>
            <span className="text-cyan-300 font-semibold">{providerDisplayName}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Model:</span>
            <span className="text-slate-200 font-mono text-[11px] font-medium">{activeModel}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400 font-medium">Status:</span>
            <span className={isConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'}>
              {isConfigured ? 'Connected' : 'Not Configured'}
            </span>
          </div>
        </div>

        {/* Mobile Compact Indicator */}
        <div
          onClick={onOpenSettings}
          className="flex md:hidden items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] cursor-pointer"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConfigured ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
            }`}
          />
          <span className="text-cyan-300 font-medium">{providerDisplayName}</span>
          <span className="text-slate-500">•</span>
          <span className={isConfigured ? 'text-emerald-400 text-[10px] font-semibold' : 'text-amber-400 text-[10px]'}>
            {isConfigured ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2">
        {/* New Session Quick Button */}
        <button
          id="header-new-chat-btn"
          onClick={onNewChat}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-lg transition-all"
          title="Start fresh conversation"
        >
          <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>New Session</span>
        </button>

        {/* Agent Mode Toggle */}
        <button
          id="header-agent-toggle-btn"
          onClick={onToggleAgentMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            agentMode
              ? 'bg-gradient-to-r from-cyan-950/70 to-indigo-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_-3px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
          title={
            agentMode
              ? 'Agent Mode: Autonomous multi-step planning & tool execution loop active'
              : 'Direct Mode: Standard fast chat with on-demand tools'
          }
        >
          <Zap
            className={`w-3.5 h-3.5 ${
              agentMode ? 'text-cyan-400 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className="hidden sm:inline">Agent Mode:</span>
          <span className={agentMode ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
            {agentMode ? 'AUTONOMOUS' : 'DIRECT'}
          </span>
        </button>

        {/* Memory Badge */}
        <button
          id="header-memory-btn"
          onClick={onOpenMemories}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition-all"
          title="Inspect & manage persistent memories"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
          <span>Memory</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[10px] font-mono border border-indigo-800/60">
            {memoriesCount}
          </span>
        </button>

        {/* Tools Badge */}
        <button
          id="header-tools-btn"
          onClick={onOpenTools}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition-all"
          title="Inspect registered tools & permissions"
        >
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tools</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800/60">
            {activeToolsCount}
          </span>
        </button>

        {/* Settings Button */}
        <button
          id="header-settings-btn"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title="NEXUS Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Toggle Right Inspector Panel */}
        <button
          id="header-right-panel-btn"
          onClick={onToggleRightPanel}
          className={`p-1.5 rounded-lg border transition-all ${
            showRightPanel
              ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300'
              : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title={showRightPanel ? 'Hide Agent Inspector' : 'Show Agent Inspector'}
        >
          {showRightPanel ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
