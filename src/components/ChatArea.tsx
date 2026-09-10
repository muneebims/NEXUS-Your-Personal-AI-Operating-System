import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileText,
  BookmarkPlus,
  HelpCircle,
  Image as ImageIcon,
  FolderArchive,
  Search,
  Clock,
  Calculator,
  Code2,
  Send,
} from 'lucide-react';
import { Message, ToolCall, AgentStep } from '../types/nexus.js';
import { marked } from 'marked';

interface ChatAreaProps {
  messages: Message[];
  conversationTitle: string;
  isStreaming: boolean;
  onRegenerate: () => void;
  onStopGeneration: () => void;
  onRememberMessage: (content: string) => void;
  onPromptPreset: (prompt: string) => void;
  onOpenFiles: () => void;
  onOpenTools: () => void;
  activeModelName: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  conversationTitle,
  isStreaming,
  onRegenerate,
  onStopGeneration,
  onRememberMessage,
  onPromptPreset,
  onOpenFiles,
  onOpenTools,
  activeModelName,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleToolCall = (id: string) => {
    setExpandedToolCalls((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatToolFriendlyName = (name: string) => {
    switch (name) {
      case 'calculator':
        return 'Smart Calculator';
      case 'date_time':
        return 'World Clock & Time';
      case 'file_reader':
        return 'Document Inspector';
      case 'file_writer':
        return 'Document Creator';
      case 'code_execution':
        return 'Code Interpreter';
      case 'web_search':
        return 'Live Web Search';
      default:
        return name;
    }
  };

  const formatToolIcon = (name: string) => {
    switch (name) {
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5" />;
      case 'date_time':
        return <Clock className="w-3.5 h-3.5" />;
      case 'file_reader':
      case 'file_writer':
        return <FileText className="w-3.5 h-3.5" />;
      case 'code_execution':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'web_search':
        return <Search className="w-3.5 h-3.5" />;
      default:
        return <Wrench className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      id="nexus-chat-area"
      className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 space-y-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Empty State / Welcome Screen */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center py-10 px-4 space-y-7 animate-fadeIn">
          {/* Logo Badge */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--accent-color)',
              color: 'var(--accent-color)',
            }}
          >
            <Bot className="w-8 h-8" />
          </div>

          {/* Clean Title & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              NEXUS
            </h1>
            <p className="text-base font-normal" style={{ color: 'var(--text-secondary)' }}>
              Your personal AI assistant
            </p>
          </div>

          {/* 4 Simple Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
            {/* Quick Action 1: Ask anything */}
            <button
              onClick={() => onPromptPreset('Explain the concept of quantum computing in simple terms that anyone can understand.')}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
              aria-label="Ask anything starter prompt"
            >
              <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                <span className="text-base">💬</span>
                <span>Ask anything</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                "Explain quantum computing in simple terms"
              </p>
            </button>

            {/* Quick Action 2: Analyze a file */}
            <button
              onClick={onOpenFiles}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
              aria-label="Analyze a file quick action"
            >
              <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                <span className="text-base">📄</span>
                <span>Analyze a file</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Upload PDF, CSV, code, or documents to summarize
              </p>
            </button>

            {/* Quick Action 3: Analyze an image */}
            <button
              onClick={() => onPromptPreset('What are the best practices for user interface design and accessibility?')}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
              aria-label="Analyze an image quick action"
            >
              <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                <span className="text-base">🖼️</span>
                <span>Analyze an image</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Attach an image or photo to inspect details
              </p>
            </button>

            {/* Quick Action 4: Use a tool */}
            <button
              onClick={() => onPromptPreset('Calculate compound interest on $10,000 at 7% annual rate compounded monthly for 5 years.')}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col gap-1.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
              aria-label="Use a tool starter prompt"
            >
              <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                <span className="text-base">⚡</span>
                <span>Use a tool</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                "Calculate compound interest on $10,000 at 7% over 5 years"
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto space-y-6">
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      borderColor: 'var(--accent-color)',
                      color: 'var(--accent-color)',
                    }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col space-y-2 max-w-[88%] sm:max-w-[80%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Attached Files Chips */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {message.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border"
                          style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Bubble Content */}
                  <div
                    className="p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border shadow-sm transition-colors"
                    style={{
                      backgroundColor: isUser
                        ? 'var(--accent-color)'
                        : 'var(--bg-surface)',
                      borderColor: isUser
                        ? 'var(--accent-color)'
                        : 'var(--border-color)',
                      color: isUser
                        ? '#ffffff'
                        : 'var(--text-primary)',
                    }}
                  >
                    {/* Tool Call Badges (if any) */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {message.toolCalls.map((tc) => {
                          const isExpanded = Boolean(expandedToolCalls[tc.id]);

                          return (
                            <div
                              key={tc.id}
                              className="rounded-xl border p-2.5 text-xs"
                              style={{
                                backgroundColor: 'var(--bg-surface-elevated)',
                                borderColor: 'var(--border-color)',
                              }}
                            >
                              <div
                                onClick={() => toggleToolCall(tc.id)}
                                className="flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <span style={{ color: 'var(--accent-color)' }}>
                                    {formatToolIcon(tc.name)}
                                  </span>
                                  <span className="font-semibold">
                                    {formatToolFriendlyName(tc.name)}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono"
                                    style={{
                                      backgroundColor: tc.status === 'completed'
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                      color: tc.status === 'completed'
                                        ? 'var(--color-success)'
                                        : 'var(--color-warning)',
                                    }}
                                  >
                                    {tc.status}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="p-1 rounded hover:opacity-80"
                                  style={{ color: 'var(--text-muted)' }}
                                  aria-label={isExpanded ? 'Collapse tool output' : 'Expand tool output'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* Collapsible output */}
                              {isExpanded && (
                                <div className="mt-2 pt-2 border-t space-y-1 font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                                  <div style={{ color: 'var(--text-muted)' }}>Arguments:</div>
                                  <pre className="p-2 rounded overflow-x-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                    {JSON.stringify(tc.arguments, null, 2)}
                                  </pre>
                                  {tc.result && (
                                    <>
                                      <div style={{ color: 'var(--text-muted)' }} className="pt-1">Result:</div>
                                      <pre className="p-2 rounded overflow-x-auto text-emerald-400" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                        {typeof tc.result === 'object'
                                          ? JSON.stringify(tc.result, null, 2)
                                          : String(tc.result)}
                                      </pre>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Markdown / Plain Text */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans">{message.content}</div>
                    ) : (
                      <div
                        className="prose max-w-none prose-sm dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(message.content || ''),
                        }}
                      />
                    )}

                    {/* Streaming typing indicator */}
                    {message.isStreaming && !message.content && (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-color)' }} />
                        <span className="w-2 h-2 rounded-full animate-pulse delay-100" style={{ backgroundColor: 'var(--accent-color)' }} />
                        <span className="w-2 h-2 rounded-full animate-pulse delay-200" style={{ backgroundColor: 'var(--accent-color)' }} />
                      </div>
                    )}
                  </div>

                  {/* Actions under Assistant response */}
                  {!isUser && !message.isStreaming && message.content && (
                    <div className="flex items-center gap-1 text-xs pt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800/20 transition-colors"
                        aria-label="Copy assistant response"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                            <span style={{ color: 'var(--color-success)' }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onRememberMessage(message.content)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800/20 transition-colors"
                        aria-label="Save key insight to Memory"
                        title="Save to Memory"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save to Memory</span>
                      </button>

                      {message.id === messages[messages.length - 1]?.id && (
                        <button
                          onClick={onRegenerate}
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800/20 transition-colors"
                          aria-label="Regenerate response"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Regenerate</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
