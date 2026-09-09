import React from 'react';
import {
  Settings as SettingsIcon,
  X,
  ShieldCheck,
  Cpu,
  Sliders,
  BrainCircuit,
  Wrench,
  Trash2,
  RefreshCw,
  KeyRound,
  Info,
  Layers,
} from 'lucide-react';
import { AppSettings, SystemStatus, NexusToolDefinition } from '../types/nexus.js';

interface SettingsModalProps {
  settings: AppSettings;
  systemStatus: SystemStatus | null;
  tools: NexusToolDefinition[];
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearConversations: () => void;
  onClearMemories: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  systemStatus,
  tools,
  onSaveSettings,
  onClearConversations,
  onClearMemories,
  onClose,
}) => {
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSaveSettings({
      ...settings,
      [key]: value,
    });
  };

  const toggleTool = (toolName: string) => {
    const updated = {
      ...settings.toolPermissions,
      [toolName]: settings.toolPermissions[toolName] === false ? true : false,
    };
    updateSetting('toolPermissions', updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide">
                NEXUS System Configuration
              </h2>
              <p className="text-xs text-slate-400">
                AI providers, agent inference parameters, tool safety, and storage controls
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Security Architecture Banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Server-Side Secure Architecture</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Secret API keys (<code className="text-cyan-300 font-mono">OPENAI_API_KEY</code>, <code className="text-cyan-300 font-mono">GEMINI_API_KEY</code>) are managed exclusively server-side via environment variables. Groq inference runs via <code className="text-cyan-300 font-mono">https://api.groq.com/openai/v1</code> with the Responses API.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${systemStatus?.groqConfigured || systemStatus?.openaiConfigured ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-slate-300">Groq Provider: {systemStatus?.groqConfigured || systemStatus?.openaiConfigured ? 'Configured (Connected)' : 'Not Set in .env'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${systemStatus?.geminiConfigured ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-slate-300">Gemini Provider: {systemStatus?.geminiConfigured ? 'Configured' : 'Not Set in .env'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: AI Provider & Model */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Provider & Core Engine
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Active Provider
                </label>
                <select
                  value={settings.provider}
                  onChange={(e) => updateSetting('provider', e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="groq">Groq (High-Speed Inference)</option>
                  <option value="openai">OpenAI Compatible Provider</option>
                  <option value="gemini">Google Gemini Provider</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Model Selection
                </label>
                {settings.provider === 'groq' ? (
                  <select
                    value={settings.groqModel || 'openai/gpt-oss-20b'}
                    onChange={(e) => updateSetting('groqModel', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Primary Recommended)</option>
                    <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                    <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b</option>
                    <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
                    <option value="groq/compound">groq/compound</option>
                    <option value="groq/compound-mini">groq/compound-mini</option>
                    <option value="whisper-large-v3-turbo">whisper-large-v3-turbo</option>
                  </select>
                ) : settings.provider === 'openai' ? (
                  <select
                    value={settings.openaiModel}
                    onChange={(e) => updateSetting('openaiModel', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
                    <option value="gpt-4o">gpt-4o (Omni multimodal)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </select>
                ) : (
                  <select
                    value={settings.geminiModel}
                    onChange={(e) => updateSetting('geminiModel', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="gemini-3.6-flash">gemini-3.6-flash (Latest recommended)</option>
                    <option value="gemini-3.8-flash">gemini-3.8-flash (High speed)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Model Parameters */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Inference Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Temperature</span>
                  <span className="font-mono text-cyan-400">{settings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Lower = deterministic, Higher = creative</span>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-slate-400">
                  <span>Max Tokens</span>
                  <span className="font-mono text-cyan-400">{settings.maxTokens}</span>
                </div>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Memory System Toggle */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Persistent Memory Subsystem
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Inject saved user facts & preferences into system context
                  </span>
                </div>
              </div>
              <button
                onClick={() => updateSetting('memoryEnabled', !settings.memoryEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  settings.memoryEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.memoryEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 5: Tool Permissions */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Tool Permissions Safeguard
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tools.map((t) => {
                const allowed = settings.toolPermissions[t.name] !== false;

                return (
                  <div
                    key={t.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <div>
                      <span className="font-mono text-[11px] text-slate-200 font-medium block">
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[170px]">
                        {t.displayName}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleTool(t.name)}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        allowed ? 'bg-cyan-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          allowed ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: System Prompt */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-slate-300 font-medium">
              System Instruction Prompt
            </label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => updateSetting('systemPrompt', e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500 leading-relaxed font-mono"
            />
          </div>

          {/* Section 7: Data Maintenance Actions */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="font-semibold text-rose-400 uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Storage Maintenance
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (confirm('Clear all conversation history?')) {
                    onClearConversations();
                  }
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-300 transition-colors"
              >
                Clear Conversations
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all stored memories?')) {
                    onClearMemories();
                  }
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-300 transition-colors"
              >
                Clear Memories
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
