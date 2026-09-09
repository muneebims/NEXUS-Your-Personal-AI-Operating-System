import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Square,
  Sparkles,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Terminal,
  BookmarkPlus,
  ArrowRight,
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
  activeModelName,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      id="nexus-chat-area"
      className="flex-1 overflow-y-auto flex flex-col p-4 md:p-6 space-y-6"
    >
      {/* Empty State / Welcome Screen */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-12 px-4 space-y-6 animate-fadeIn">
          {/* Futuristic Hexagonal Logo */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-indigo-500/20 border border-cyan-500/40 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]">
            <Bot className="w-10 h-10 text-cyan-400" />
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-300 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEXUS PERSONAL AI OPERATING SYSTEM</span>
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">
              System Online & Ready
            </h1>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
              Modular architecture ready for tool execution, persistent memory recall, multi-format file analysis, and autonomous agent loops.
            </p>
          </div>

          {/* Quick Starter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4 text-left">
            <button
              onClick={() => onPromptPreset('Calculate compound interest on $10,000 at 7% annual rate compounded monthly for 5 years using the calculator tool.')}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs transition-all group"
            >
              <div className="flex items-center justify-between text-cyan-400 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Tool Execution
                </span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                "Calculate compound interest on $10,000 at 7% over 5 years."
              </p>
            </button>

            <button
              onClick={() => onPromptPreset('What is the current time and date in UTC, Tokyo, and New York? Please compare their time offsets.')}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs transition-all group"
            >
              <div className="flex items-center justify-between text-indigo-400 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Clock & Timezones
                </span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                "What is the current time in UTC, Tokyo, and New York?"
              </p>
            </button>

            <button
              onClick={() => onPromptPreset('Remember this: I am building a modular AI operating system with OpenAI and Gemini support.')}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs transition-all group"
            >
              <div className="flex items-center justify-between text-sky-400 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Memory System
                </span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                "Remember this: I am building a modular AI operating system."
              </p>
            </button>

            <button
              onClick={() => onPromptPreset('Write a high-performance Python script to parse a large JSON dataset, calculate statistics, and save the result to a report.')}
              className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-xs transition-all group"
            >
              <div className="flex items-center justify-between text-violet-400 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Code & Artifacts
                </span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                "Write a Python script to parse JSON and calculate statistics."
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl w-full mx-auto space-y-6">
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex gap-3.5 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[80%] ${
                    isUser ? 'items-end' : 'items-start w-full'
                  }`}
                >
                  {/* Attachments (Images/Files) */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {message.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          {att.base64 && att.type.startsWith('image/') ? (
                            <img
                              src={att.base64}
                              alt={att.name}
                              className="w-16 h-16 rounded object-cover border border-cyan-500/30"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1">
                              <FileText className="w-4 h-4 text-cyan-400" />
                              <span className="font-mono text-[11px] text-slate-300">
                                {att.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agent Step Loop Card (if present) */}
                  {message.agentSteps && message.agentSteps.length > 0 && (
                    <AgentStepsTimeline steps={message.agentSteps} />
                  )}

                  {/* Tool Calls Execution Display */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="w-full space-y-2">
                      {message.toolCalls.map((tool) => (
                        <ToolExecutionCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  )}

                  {/* Message Content Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/40 rounded-tr-sm'
                        : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-sm w-full'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <MarkdownMessageRenderer content={message.content} />
                    )}

                    {/* Streaming Cursor */}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                  </div>

                  {/* Assistant Footer Actions */}
                  {!isUser && !message.isStreaming && (
                    <div className="flex items-center gap-2 pt-1 text-slate-500 text-xs">
                      {/* Copy Message */}
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        title="Copy message text"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* "Remember this" Action Button */}
                      <button
                        onClick={() => onRememberMessage(message.content)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors"
                        title="Save key insight or instruction from this response into permanent memory"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Remember this</span>
                      </button>

                      {/* Regenerate button (on last assistant message) */}
                      {message.id === messages[messages.length - 1]?.id && (
                        <button
                          onClick={onRegenerate}
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                          title="Regenerate this response"
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
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

// Markdown Renderer with code block syntax highlighting & copy code
const MarkdownMessageRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  if (!content) return null;

  // Split content by code blocks ```...``` to render custom code containers
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```(\w+)?\s*([\s\S]*?)```$/);
          const lang = match?.[1] || 'code';
          const codeText = match?.[2] || '';

          return (
            <div
              key={index}
              className="my-3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 font-mono-code text-xs"
            >
              {/* Code block header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium uppercase text-slate-300">
                    {lang}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeText.trim());
                    setCopiedCodeIndex(index);
                    setTimeout(() => setCopiedCodeIndex(null), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                >
                  {copiedCodeIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed font-mono text-[12px]">
                <code>{codeText.trim()}</code>
              </pre>
            </div>
          );
        }

        // Render standard markdown for non-code parts
        try {
          const parsedHtml = marked.parse(part);
          return (
            <div
              key={index}
              className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-cyan-300"
              dangerouslySetInnerHTML={{ __html: parsedHtml as string }}
            />
          );
        } catch {
          return (
            <p key={index} className="whitespace-pre-wrap">
              {part}
            </p>
          );
        }
      })}
    </div>
  );
};

// Tool Execution Card matching prompt format:
// NEXUS > I need to calculate this. [Calculator tool] > Result: 847
const ToolExecutionCard: React.FC<{ tool: ToolCall }> = ({ tool }) => {
  const [expanded, setExpanded] = useState(false);

  const isCompleted = tool.status === 'completed';
  const isFailed = tool.status === 'failed';
  const isRunning = tool.status === 'running' || tool.status === 'pending';

  // Format result display
  let resultSummary = '';
  if (tool.result) {
    if (typeof tool.result === 'object') {
      if (tool.result.result !== undefined) {
        resultSummary = String(tool.result.result);
      } else if (tool.result.status === 'success' && tool.result.formatted) {
        resultSummary = tool.result.formatted;
      } else {
        resultSummary = JSON.stringify(tool.result);
      }
    } else {
      resultSummary = String(tool.result);
    }
  }

  return (
    <div className="w-full rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-medium text-cyan-300">
            [{tool.name} tool]
          </span>

          {isRunning && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 animate-pulse">
              Executing...
            </span>
          )}
          {isCompleted && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Result Ready
            </span>
          )}
          {isFailed && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
        >
          <span>{expanded ? 'Hide Details' : 'Details'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Result preview line */}
      {isCompleted && resultSummary && (
        <div className="pl-7 font-mono text-emerald-400 text-xs flex items-center gap-1">
          <span className="text-slate-500">&gt;</span>
          <span className="font-semibold">Result:</span>
          <span className="text-slate-200 truncate">{resultSummary}</span>
        </div>
      )}

      {isFailed && tool.error && (
        <div className="pl-7 font-mono text-rose-400 text-xs">
          &gt; Error: {tool.error}
        </div>
      )}

      {/* Expandable Arguments & Complete Output */}
      {expanded && (
        <div className="pt-2 border-t border-slate-800/60 space-y-2 pl-7 font-mono text-[11px]">
          <div>
            <span className="text-slate-500">Arguments:</span>
            <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 mt-1 overflow-x-auto">
              {JSON.stringify(tool.arguments, null, 2)}
            </pre>
          </div>
          {tool.result && (
            <div>
              <span className="text-slate-500">Full Output:</span>
              <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 mt-1 overflow-x-auto max-h-48">
                {JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Agent Planning Steps Timeline
const AgentStepsTimeline: React.FC<{ steps: AgentStep[] }> = ({ steps }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full rounded-xl bg-slate-950/70 border border-indigo-900/40 p-3 text-xs mb-1">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer text-indigo-300 hover:text-indigo-200"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span className="font-medium">NEXUS Agent Reasoning Loop</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            {steps.length} Steps
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-l-2 border-indigo-800/50 pl-3 ml-1.5">
          {steps.map((st, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                  {st.stage}
                </span>
                <span className="text-[11px] text-slate-400">Step {st.stepNumber}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{st.thought}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
