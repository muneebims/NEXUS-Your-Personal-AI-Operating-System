import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Palette,
  Cpu,
  BrainCircuit,
  Wrench,
  Sliders,
  Info,
  ShieldCheck,
  Trash2,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  AppSettings,
  SystemStatus,
  NexusToolDefinition,
  ThemeMode,
  AccentColor,
} from '../types/nexus.js';

interface SettingsModalProps {
  settings: AppSettings;
  systemStatus: SystemStatus | null;
  tools: NexusToolDefinition[];
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearConversations: () => void;
  onClearMemories: () => void;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'ai' | 'memory' | 'tools' | 'advanced' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  systemStatus,
  tools,
  onSaveSettings,
  onClearConversations,
  onClearMemories,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

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

  const themes: Array<{
    id: ThemeMode;
    name: string;
    description: string;
    bg: string;
    surface: string;
    border: string;
    text: string;
    isLight?: boolean;
  }> = [
    {
      id: 'midnight',
      name: 'Midnight',
      description: 'Deep navy dark mode with refined contrast',
      bg: '#070a13',
      surface: '#0e1424',
      border: '#1e293b',
      text: '#f8fafc',
    },
    {
      id: 'light',
      name: 'Light',
      description: 'Crisp, modern light aesthetic with soft borders',
      bg: '#f8fafc',
      surface: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
      isLight: true,
    },
    {
      id: 'cyber',
      name: 'Cyber',
      description: 'High-contrast cyberpunk darkness with glowing neon',
      bg: '#04060c',
      surface: '#090e1b',
      border: '#1a2744',
      text: '#f0fdf4',
    },
    {
      id: 'nebula',
      name: 'Nebula',
      description: 'Cosmic deep violet and starlight tones',
      bg: '#0a0614',
      surface: '#130d24',
      border: '#2e1d52',
      text: '#faf5ff',
    },
    {
      id: 'matrix',
      name: 'Matrix',
      description: 'Obsidian terminal aesthetic with phosphorescent green',
      bg: '#030a04',
      surface: '#071509',
      border: '#143819',
      text: '#ecfdf5',
    },
    {
      id: 'ember',
      name: 'Ember',
      description: 'Warm dark charcoal with rich fiery accents',
      bg: '#0f0a07',
      surface: '#1a120c',
      border: '#382518',
      text: '#fff7ed',
    },
  ];

  const accentColors: Array<{
    id: AccentColor;
    name: string;
    hex: string;
  }> = [
    { id: 'cyan', name: 'Cyan', hex: '#06b6d4' },
    { id: 'blue', name: 'Blue', hex: '#3b82f6' },
    { id: 'purple', name: 'Purple', hex: '#a855f7' },
    { id: 'green', name: 'Green', hex: '#10b981' },
    { id: 'orange', name: 'Orange', hex: '#f97316' },
    { id: 'pink', name: 'Pink', hex: '#ec4899' },
  ];

  const friendlyToolNames: Record<string, { title: string; desc: string }> = {
    calculator: {
      title: 'Smart Calculator',
      desc: 'Evaluate mathematical formulas, percentages, and financial equations',
    },
    date_time: {
      title: 'World Clock & Time',
      desc: 'Query timezones, offsets, calendar dates, and calculate durations',
    },
    file_reader: {
      title: 'Document Inspector',
      desc: 'Read uploaded text, CSV, markdown, code, and documents safely',
    },
    file_writer: {
      title: 'Document Creator',
      desc: 'Export structured summaries, reports, and code to downloadable files',
    },
    code_execution: {
      title: 'Code Interpreter',
      desc: 'Execute safe sandboxed computations to verify analytical answers',
    },
    web_search: {
      title: 'Live Web Search',
      desc: 'Retrieve current facts, references, and documentation from the web',
    },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
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
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-base font-bold tracking-wide">
                NEXUS Settings
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Customize appearance, AI providers, tools, and system preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          className="flex border-b overflow-x-auto px-4 gap-1 text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'ai', label: 'AI Models', icon: Cpu },
            { id: 'memory', label: 'Memory', icon: BrainCircuit },
            { id: 'tools', label: 'Tools', icon: Wrench },
            { id: 'advanced', label: 'Advanced', icon: Sliders },
            { id: 'about', label: 'About', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className="flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap transition-all"
                style={{
                  borderColor: isActive ? 'var(--accent-color)' : 'transparent',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                }}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Theme Cards Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Theme Selection</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Choose your favorite visual theme. Click a card to preview instantly.
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full font-medium text-[11px] capitalize"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    Active: {settings.theme}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {themes.map((theme) => {
                    const isSelected = settings.theme === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => updateSetting('theme', theme.id)}
                        className="p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-32 relative shadow-sm"
                        style={{
                          backgroundColor: theme.bg,
                          borderColor: isSelected ? 'var(--accent-color)' : theme.border,
                          boxShadow: isSelected ? '0 0 0 2px var(--accent-color)' : 'none',
                        }}
                      >
                        {/* Mockup Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: 'var(--accent-color)' }}
                            />
                            <span
                              className="font-bold text-xs"
                              style={{ color: theme.text }}
                            >
                              {theme.name}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: 'var(--accent-color)' }}
                            />
                          )}
                        </div>

                        {/* Mini UI Mockup inside card */}
                        <div
                          className="p-2 rounded-lg border text-[10px] space-y-1"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="opacity-80">Preview Card</span>
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-mono"
                              style={{
                                backgroundColor: 'var(--accent-subtle)',
                                color: 'var(--accent-color)',
                              }}
                            >
                              Tag
                            </span>
                          </div>
                          <div
                            className="h-1.5 w-3/4 rounded-full opacity-60"
                            style={{ backgroundColor: theme.text }}
                          />
                        </div>

                        {/* Description */}
                        <p
                          className="text-[10px] truncate opacity-70"
                          style={{ color: theme.text }}
                        >
                          {theme.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Swatches */}
              <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <h3 className="text-sm font-semibold">Accent Color</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Pick an accent color for buttons, active tabs, links, and highlights.
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {accentColors.map((acc) => {
                    const isSelected = settings.accent === acc.id;

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => updateSetting('accent', acc.id)}
                        className="p-3 rounded-xl border flex flex-col items-center gap-2 transition-all hover:scale-105"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: isSelected ? acc.hex : 'var(--border-color)',
                          boxShadow: isSelected ? `0 0 0 2px ${acc.hex}` : 'none',
                        }}
                        aria-label={`Select accent color ${acc.name}`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform"
                          style={{ backgroundColor: acc.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium text-[11px] capitalize">
                          {acc.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PROVIDER & MODEL */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-fadeIn">
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  <span className="font-semibold">Server-Side Key Isolation</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  All API keys remain strictly server-side in your environment and are never sent to browser JavaScript.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Primary AI Provider
                  </label>
                  <select
                    value={settings.provider}
                    onChange={(e) => updateSetting('provider', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border outline-none font-medium text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="groq">Groq (High-Speed Inference)</option>
                    <option value="openai">OpenAI Compatible Provider</option>
                    <option value="gemini">Google Gemini Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Active Model
                  </label>
                  {settings.provider === 'groq' ? (
                    <select
                      value={settings.groqModel || 'openai/gpt-oss-20b'}
                      onChange={(e) => updateSetting('groqModel', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border outline-none font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Recommended)</option>
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
                      className="w-full px-3 py-2 rounded-lg border outline-none font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
                      <option value="gpt-4o">gpt-4o (Omni multimodal)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    </select>
                  ) : (
                    <select
                      value={settings.geminiModel}
                      onChange={(e) => updateSetting('geminiModel', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border outline-none font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMORY */}
          {activeTab === 'memory' && (
            <div className="space-y-5 animate-fadeIn">
              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="space-y-1">
                  <div className="font-semibold text-sm">Persistent Memory</div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Allow NEXUS to remember user facts and preferences across sessions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => updateSetting('memoryEnabled', !settings.memoryEnabled)}
                  className="w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: settings.memoryEnabled ? 'var(--accent-color)' : 'var(--border-color)',
                  }}
                  aria-label="Toggle persistent memory"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.memoryEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="font-semibold text-xs">Memory Maintenance</div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Clear all stored memories to start with a blank memory bank.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all stored memories?')) {
                      onClearMemories();
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg border font-medium transition-colors hover:opacity-80 flex items-center gap-2"
                  style={{
                    borderColor: 'var(--color-error)',
                    color: 'var(--color-error)',
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Stored Memories</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TOOLS */}
          {activeTab === 'tools' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-semibold">Enabled Tools</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Toggle which capabilities NEXUS can invoke during conversations.
                </p>
              </div>

              <div className="space-y-2.5">
                {tools.map((t) => {
                  const allowed = settings.toolPermissions[t.name] !== false;
                  const info = friendlyToolNames[t.name] || {
                    title: t.displayName,
                    desc: t.description,
                  };

                  return (
                    <div
                      key={t.name}
                      className="p-3.5 rounded-xl border flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs">{info.title}</div>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {info.desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleTool(t.name)}
                        className="w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-3"
                        style={{
                          backgroundColor: allowed ? 'var(--accent-color)' : 'var(--border-color)',
                        }}
                        aria-label={`Toggle ${info.title}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            allowed ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: ADVANCED */}
          {activeTab === 'advanced' && (
            <div className="space-y-5 animate-fadeIn">
              {/* System Instruction Prompt */}
              <div className="space-y-2">
                <label className="block font-medium" style={{ color: 'var(--text-secondary)' }}>
                  System Prompt Instruction
                </label>
                <textarea
                  rows={3}
                  value={settings.systemPrompt}
                  onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                  className="w-full p-3 rounded-lg border text-xs outline-none font-mono leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Temperature and Max Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Temperature</span>
                    <span className="font-mono" style={{ color: 'var(--accent-color)' }}>{settings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    0 = Deterministic/Focused, 1 = Creative
                  </span>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Max Tokens</span>
                    <span className="font-mono" style={{ color: 'var(--accent-color)' }}>{settings.maxTokens}</span>
                  </div>
                  <input
                    type="number"
                    min="256"
                    max="8192"
                    step="256"
                    value={settings.maxTokens}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Max Agent Iterations */}
              <div className="space-y-2">
                <div className="flex justify-between font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <span>Max Agent Iterations</span>
                  <span className="font-mono" style={{ color: 'var(--accent-color)' }}>{settings.maxIterations}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={settings.maxIterations}
                  onChange={(e) => updateSetting('maxIterations', parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer"
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Maximum planning/tool execution loops per autonomous request
                </span>
              </div>

              {/* Server Diagnostics */}
              <div
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                  <span>Developer Diagnostics</span>
                </div>
                <div className="font-mono text-[11px] space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <div>Server Time: {systemStatus?.serverTime || 'Connected'}</div>
                  <div>Groq Configured: {String(systemStatus?.groqConfigured ?? false)}</div>
                  <div>Gemini Configured: {String(systemStatus?.geminiConfigured ?? false)}</div>
                  <div>OpenAI Configured: {String(systemStatus?.openaiConfigured ?? false)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-fadeIn">
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>NEXUS Personal AI OS</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  NEXUS is a personal AI assistant built with modular tool execution, persistent memory recall, file inspection, and autonomous agent loops.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="font-semibold text-xs text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Conversation Data</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Clear all conversation histories from local storage.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all conversations?')) {
                      onClearConversations();
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg border font-medium text-rose-400 border-rose-500/40 hover:bg-rose-500/10 transition-colors"
                >
                  Clear All Conversations
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-5 py-3.5 border-t flex justify-end"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
