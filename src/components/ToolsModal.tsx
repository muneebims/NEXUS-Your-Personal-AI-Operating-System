import React, { useState } from 'react';
import {
  Wrench,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Shield,
  Clock,
  Terminal,
  Calculator,
  Search,
  FileText,
  Code2,
} from 'lucide-react';
import { NexusToolDefinition } from '../types/nexus.js';
import { apiClient } from '../services/apiClient.js';

interface ToolsModalProps {
  tools: NexusToolDefinition[];
  toolPermissions: Record<string, boolean>;
  onToggleToolPermission: (toolName: string) => void;
  onClose: () => void;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({
  tools,
  toolPermissions,
  onToggleToolPermission,
  onClose,
}) => {
  const [selectedTool, setSelectedTool] = useState<NexusToolDefinition>(
    tools[0] || null
  );
  const [testArgs, setTestArgs] = useState<string>('{\n  "expression": "Math.sqrt(256) + 42 * 2"\n}');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [execError, setExecError] = useState<string | null>(null);

  // Set default sample arguments when switching tools
  const handleSelectTool = (tool: NexusToolDefinition) => {
    setSelectedTool(tool);
    setExecResult(null);
    setExecError(null);

    if (tool.name === 'calculator') {
      setTestArgs('{\n  "expression": "Math.sqrt(256) + 42 * 2"\n}');
    } else if (tool.name === 'date_time') {
      setTestArgs('{\n  "action": "current_time",\n  "timezone": "America/New_York"\n}');
    } else if (tool.name === 'file_reader') {
      setTestArgs('{\n  "fileName": "data.csv",\n  "maxLines": "20"\n}');
    } else if (tool.name === 'file_writer') {
      setTestArgs('{\n  "filename": "summary.md",\n  "content": "# NEXUS Report\\nStatus: Operational",\n  "fileType": "text/markdown"\n}');
    } else if (tool.name === 'code_execution') {
      setTestArgs('{\n  "code": "const nums = [1, 2, 3, 4, 5];\\nconsole.log(\'Summing array:\', nums);\\nreturn nums.reduce((a, b) => a + b, 0);"\n}');
    } else if (tool.name === 'web_search') {
      setTestArgs('{\n  "query": "Quantum computing advances 2026"\n}');
    } else {
      setTestArgs('{}');
    }
  };

  const handleRunTest = async () => {
    if (!selectedTool) return;
    setExecuting(true);
    setExecResult(null);
    setExecError(null);

    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(testArgs);
    } catch (err: any) {
      setExecError(`Invalid JSON arguments: ${err.message}`);
      setExecuting(false);
      return;
    }

    try {
      const response = await apiClient.executeTool(selectedTool.name, parsedArgs);
      setExecResult(response);
    } catch (err: any) {
      setExecError(err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'calculator':
        return <Calculator className="w-4 h-4 text-cyan-400" />;
      case 'date_time':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      case 'file_reader':
      case 'file_writer':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'code_execution':
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case 'web_search':
        return <Search className="w-4 h-4 text-emerald-400" />;
      default:
        return <Wrench className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide">
                NEXUS Modular Tool Registry
              </h2>
              <p className="text-xs text-slate-400">
                Extensible function calling system with security safeguards and live verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tools List Column */}
          <div className="w-80 border-r border-slate-800/80 flex flex-col bg-slate-950 p-3 space-y-2 overflow-y-auto">
            <span className="text-[11px] font-mono text-slate-500 uppercase px-1">
              Registered Tools ({tools.length})
            </span>

            {tools.map((t) => {
              const isSelected = selectedTool?.name === t.name;
              const isEnabled = toolPermissions[t.name] !== false;

              return (
                <div
                  key={t.name}
                  onClick={() => handleSelectTool(t)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_12px_-4px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getToolIcon(t.name)}
                      <span className="font-medium text-slate-200">{t.displayName}</span>
                    </div>

                    {/* Enable / Disable toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleToolPermission(t.name);
                      }}
                      className={`w-7 h-3.5 rounded-full p-0.5 transition-colors ${
                        isEnabled ? 'bg-cyan-600' : 'bg-slate-700'
                      }`}
                      title={isEnabled ? 'Tool enabled' : 'Tool disabled'}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    <span className="text-cyan-400">fn: {t.name}()</span>
                    <span className="text-slate-500 uppercase">{t.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tool Details & Test Runner Column */}
          <div className="flex-1 flex flex-col bg-slate-900/30 overflow-y-auto p-5 space-y-5">
            {selectedTool ? (
              <>
                {/* Tool Meta Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getToolIcon(selectedTool.name)}
                      <h3 className="font-display font-semibold text-sm text-white">
                        {selectedTool.displayName}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        {selectedTool.name}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Safeguarded Sandbox
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedTool.description}
                  </p>
                </div>

                {/* Parameter Schema */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Parameters Schema (JSON Schema)
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                    {JSON.stringify(selectedTool.parameters, null, 2)}
                  </pre>
                </div>

                {/* Interactive Tool Test Runner */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Live Tool Tester
                    </span>
                    <button
                      onClick={handleRunTest}
                      disabled={executing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{executing ? 'Executing...' : 'Run Tool Test'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={testArgs}
                    onChange={(e) => setTestArgs(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="JSON test arguments..."
                  />

                  {/* Test Error */}
                  {execError && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-mono">{execError}</span>
                    </div>
                  )}

                  {/* Test Result */}
                  {execResult && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Execution Output
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                        {JSON.stringify(execResult.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a tool to inspect and test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
