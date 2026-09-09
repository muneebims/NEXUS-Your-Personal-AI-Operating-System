import React from 'react';
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
  Info,
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
}) => {
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
    <aside
      id="nexus-agent-panel"
      className="w-80 bg-slate-950/95 border-l border-slate-800/80 flex flex-col h-full shrink-0 overflow-y-auto select-none"
    >
      {/* Panel Title */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-display font-semibold text-sm text-white tracking-wide">
            Agent Inspector
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            agentMode
              ? 'bg-cyan-950 text-cyan-300 border-cyan-800/60'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          {agentMode ? 'ACTIVE' : 'IDLE'}
        </span>
      </div>

      <div className="p-4 space-y-6">
        {/* Section 1: Current Task & Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Agent Workflow Pipeline
            </span>
          </div>

          {/* Current Task Description */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
              Active Objective:
            </span>
            <p className="text-slate-200 line-clamp-3 leading-relaxed">
              {currentTask || 'Awaiting user prompt or query...'}
            </p>
          </div>

          {/* Step Sequence Visualizer */}
          <div className="space-y-1.5 pt-1">
            {pipelineStages.map((stage, idx) => {
              const isCurrent = currentStage === stage.key;
              const hasRun = recentSteps.some((s) => s.stage === stage.key);

              return (
                <div
                  key={stage.key}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_-3px_rgba(6,182,212,0.3)]'
                      : hasRun
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                      : 'bg-transparent border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
                    <span className="font-medium">{stage.label}</span>
                  </div>
                  {isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  ) : hasRun ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Active Tools & Safeguards */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              Active Tools ({tools.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Safeguarded
            </span>
          </div>

          <div className="space-y-1.5">
            {tools.map((t) => {
              const isEnabled = toolPermissions[t.name] !== false;

              return (
                <div
                  key={t.name}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-mono text-[11px] text-slate-200 font-medium truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {t.description}
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleToolPermission(t.name)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      isEnabled ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Attached Session Files */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              Session Files ({sessionFiles.length})
            </span>
          </div>

          {sessionFiles.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">
              No files uploaded to current session.
            </p>
          ) : (
            <div className="space-y-1.5">
              {sessionFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-xs cursor-pointer group transition-colors"
                >
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[160px]">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round(file.size / 1024)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Memories Injected in Context */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              Context Memories ({activeMemories.length})
            </span>
          </div>

          {activeMemories.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">
              No long-term memories active.
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeMemories.slice(0, 4).map((mem) => (
                <div
                  key={mem.id}
                  className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-indigo-300 text-[11px]">
                      {mem.key}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-indigo-950 text-indigo-400 uppercase">
                      {mem.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] truncate">{mem.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
