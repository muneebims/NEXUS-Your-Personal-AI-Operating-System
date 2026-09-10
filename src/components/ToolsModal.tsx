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
        return <Calculator className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
      case 'date_time':
        return <Clock className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
      case 'file_reader':
      case 'file_writer':
        return <FileText className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
      case 'code_execution':
        return <Code2 className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
      case 'web_search':
        return <Search className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
      default:
        return <Wrench className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tools Directory"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col h-[85vh] transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--accent-color)',
                color: 'var(--accent-color)',
              }}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">
                NEXUS Tools Directory
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Integrated function execution with safety controls and test runner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close Tools Directory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tools List Column */}
          <div
            className="w-72 sm:w-80 border-r flex flex-col p-3 space-y-2 overflow-y-auto"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span
              className="text-[11px] font-semibold uppercase px-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Available Tools ({tools.length})
            </span>

            {tools.map((t) => {
              const isSelected = selectedTool?.name === t.name;
              const isEnabled = toolPermissions[t.name] !== false;

              return (
                <div
                  key={t.name}
                  onClick={() => handleSelectTool(t)}
                  className="p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--accent-subtle)'
                      : 'var(--bg-surface-elevated)',
                    borderColor: isSelected
                      ? 'var(--accent-color)'
                      : 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getToolIcon(t.name)}
                      <span className="font-medium">{t.displayName}</span>
                    </div>

                    {/* Enable / Disable toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleToolPermission(t.name);
                      }}
                      className="w-8 h-4 rounded-full p-0.5 transition-colors"
                      style={{
                        backgroundColor: isEnabled ? 'var(--accent-color)' : 'var(--border-color)',
                      }}
                      title={isEnabled ? 'Tool enabled' : 'Tool disabled'}
                      aria-label={`Toggle ${t.displayName}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p
                    className="text-[11px] line-clamp-2 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.description}
                  </p>

                  <div
                    className="flex items-center justify-between text-[10px] font-mono pt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span style={{ color: 'var(--accent-color)' }}>{t.name}()</span>
                    <span className="uppercase">{t.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tool Details & Test Runner Column */}
          <div
            className="flex-1 flex flex-col overflow-y-auto p-5 space-y-5"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {selectedTool ? (
              <>
                {/* Tool Meta Card */}
                <div
                  className="p-4 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getToolIcon(selectedTool.name)}
                      <h3 className="font-semibold text-sm">
                        {selectedTool.displayName}
                      </h3>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: 'var(--accent-subtle)',
                          borderColor: 'var(--accent-color)',
                          color: 'var(--accent-color)',
                        }}
                      >
                        {selectedTool.name}
                      </span>
                    </div>
                    <span
                      className="text-xs font-medium flex items-center gap-1"
                      style={{ color: 'var(--color-success)' }}
                    >
                      <Shield className="w-3.5 h-3.5" /> Safeguarded
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {selectedTool.description}
                  </p>
                </div>

                {/* Live Test Interactive Panel */}
                <div
                  className="p-4 rounded-xl border space-y-3 flex-1 flex flex-col"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                      Interactive Tool Tester
                    </span>
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={executing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{executing ? 'Executing...' : 'Run Test'}</span>
                    </button>
                  </div>

                  {/* Input JSON args */}
                  <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      JSON Parameters:
                    </label>
                    <textarea
                      rows={4}
                      value={testArgs}
                      onChange={(e) => setTestArgs(e.target.value)}
                      className="w-full p-2.5 rounded-lg border font-mono text-xs outline-none flex-1"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Output Preview */}
                  {(execResult || execError) && (
                    <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-[11px] font-medium block" style={{ color: 'var(--text-secondary)' }}>
                        Execution Result:
                      </span>
                      {execError && (
                        <div
                          className="p-2.5 rounded-lg border text-xs flex items-center gap-2"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'var(--color-error)',
                            color: 'var(--color-error)',
                          }}
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{execError}</span>
                        </div>
                      )}
                      {execResult && (
                        <pre
                          className="p-3 rounded-lg border font-mono text-xs overflow-x-auto text-emerald-400"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                        >
                          {JSON.stringify(execResult, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                Select a tool to inspect and test
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3 border-t flex justify-end"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
