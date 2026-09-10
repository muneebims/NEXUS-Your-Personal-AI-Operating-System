import React, { useEffect } from 'react';
import {
  BrainCircuit,
  Wrench,
  FolderArchive,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Sparkles,
  X,
  Bot,
} from 'lucide-react';
import { AgentStep, FileAttachment, MemoryItem, NexusToolDefinition } from '../types/nexus.js';

interface AgentPanelProps {
  currentTask: string;
  recentSteps: AgentStep[];
  tools: NexusToolDefinition[];
  toolPermissions: Record<string, boolean>;
  sessionFiles: FileAttachment[];
  activeMemories: MemoryItem[];
  agentMode: boolean;
  onToggleToolPermission: (toolName: string) => void;
  onSelectFile: (file: FileAttachment) => void;
  onClose: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  currentTask,
  recentSteps,
  tools,
  toolPermissions,
  sessionFiles,
  activeMemories,
  agentMode,
  onToggleToolPermission,
  onSelectFile,
  onClose,
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const pipelineStages = [
    { key: 'PLAN', label: 'Plan' },
    { key: 'SELECT_TOOL', label: 'Select Tool' },
    { key: 'EXECUTE_TOOL', label: 'Execute Tool' },
    { key: 'OBSERVE', label: 'Observe' },
    { key: 'DECIDE', label: 'Decide Action' },
    { key: 'COMPLETE', label: 'Complete Task' },
  ];

  const currentStage = recentSteps.length > 0
    ? recentSteps[recentSteps.length - 1].stage
    : 'READY';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Agent Inspector Drawer"
      className="fixed inset-0 z-40 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fadeIn transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <aside
        id="nexus-agent-panel"
        className="relative z-50 w-full max-w-sm sm:max-w-md border-l flex flex-col h-full shadow-2xl overflow-y-auto select-none transition-colors animate-fadeIn"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="p-4 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg border"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--accent-color)',
                color: 'var(--accent-color)',
              }}
            >
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm tracking-wide">
                Agent Inspector
              </h2>
              <span
                className="text-[11px] font-medium"
                style={{ color: agentMode ? 'var(--accent-color)' : 'var(--text-muted)' }}
              >
                {agentMode ? 'Autonomous Workflow Active' : 'Standby / Direct Mode'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close Agent Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 space-y-5 flex-1">
          {/* Section 1: Active Task Objective */}
          <div className="space-y-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              Current Objective
            </span>
            <div
              className="p-3 rounded-xl border text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p className="line-clamp-4">
                {currentTask || 'Awaiting task or user prompt...'}
              </p>
            </div>
          </div>

          {/* Section 2: Step Sequence Visualizer */}
          <div className="space-y-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              Execution Pipeline
            </span>

            <div className="space-y-1.5">
              {pipelineStages.map((stage, idx) => {
                const isCurrent = currentStage === stage.key;
                const hasRun = recentSteps.some((s) => s.stage === stage.key);

                return (
                  <div
                    key={stage.key}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-all"
                    style={{
                      backgroundColor: isCurrent
                        ? 'var(--accent-subtle)'
                        : 'var(--bg-surface-elevated)',
                      borderColor: isCurrent
                        ? 'var(--accent-color)'
                        : 'var(--border-color)',
                      color: isCurrent
                        ? 'var(--accent-color)'
                        : hasRun
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
                      <span className="font-medium">{stage.label}</span>
                    </div>

                    {isCurrent ? (
                      <span
                        className="w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: 'var(--accent-color)' }}
                      />
                    ) : hasRun ? (
                      <CheckCircle2
                        className="w-4 h-4"
                        style={{ color: 'var(--color-success)' }}
                      />
                    ) : (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'var(--text-muted)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Execution Logs / Thoughts */}
          {recentSteps.length > 0 && (
            <div className="space-y-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--text-muted)' }}
              >
                Agent Thoughts & Trace ({recentSteps.length})
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentSteps.map((step, sidx) => (
                  <div
                    key={sidx}
                    className="p-2.5 rounded-lg border text-xs space-y-1"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>
                        Step {step.stepNumber}: {step.stage}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    {step.thought && (
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {step.thought}
                      </p>
                    )}
                    {step.toolCall && (
                      <div className="mt-1 p-1.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        Tool: {step.toolCall.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Tools Safeguards Summary */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Wrench className="w-3 h-3" />
                Registered Tools ({tools.length})
              </span>
              <span
                className="text-[10px] font-medium flex items-center gap-1"
                style={{ color: 'var(--color-success)' }}
              >
                <Shield className="w-3 h-3" /> Safeguarded
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {tools.map((t) => {
                const allowed = toolPermissions[t.name] !== false;

                return (
                  <div
                    key={t.name}
                    className="p-2 rounded-lg border flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <span className="text-[11px] truncate font-medium">{t.displayName}</span>
                    <button
                      type="button"
                      onClick={() => onToggleToolPermission(t.name)}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: allowed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: allowed ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      {allowed ? 'ON' : 'OFF'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          className="p-4 border-t flex justify-end"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Close Inspector
          </button>
        </div>
      </aside>
    </div>
  );
};
