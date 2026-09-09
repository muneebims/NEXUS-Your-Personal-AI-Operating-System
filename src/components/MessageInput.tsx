import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Square,
  X,
  FileText,
  Wrench,
  Sparkles,
  Search,
  CheckCircle,
} from 'lucide-react';
import { FileAttachment } from '../types/nexus.js';
import { processUploadedFile, isSupportedFile } from '../services/fileProcessor.js';
import { speechService } from '../services/audioSpeech.js';

interface MessageInputProps {
  onSendMessage: (text: string, attachments: FileAttachment[]) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  activeToolsCount: number;
  onOpenTools: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  activeToolsCount,
  onOpenTools,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (isStreaming) {
      onStopGeneration();
      return;
    }
    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!isSupportedFile(file)) {
        setUploadError(`File "${file.name}" format is not supported.`);
        continue;
      }
      try {
        const processed = await processUploadedFile(file);
        newAttachments.push(processed);
      } catch (err: any) {
        setUploadError(`Failed to process ${file.name}: ${err.message}`);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (e.target) e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleApplyPromptPreset = (prompt: string) => {
    setText((prev) => (prev ? `${prev} ${prompt}` : prompt));
    textareaRef.current?.focus();
  };

  const toggleVoice = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      const started = speechService.startListening(
        (transcript, isFinal) => {
          setText((prev) => (isFinal ? `${prev} ${transcript}`.trim() : transcript));
        },
        (err) => {
          setUploadError(`Voice error: ${err}`);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      if (started) setIsListening(true);
    }
  };

  const hasImages = attachments.some((a) => a.type.startsWith('image/'));

  return (
    <div
      id="nexus-message-input-container"
      className="p-4 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-lg shrink-0 relative"
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Upload error banner if any */}
        {uploadError && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 animate-fadeIn">
            <span>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="text-rose-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Image Understanding Quick Prompt Chips */}
        {hasImages && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3" /> Vision Actions:
            </span>
            <button
              onClick={() => handleApplyPromptPreset('Analyze this image in detail and describe its key elements.')}
              className="px-2.5 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-cyan-100 text-[11px] whitespace-nowrap transition-colors"
            >
              Analyze image
            </button>
            <button
              onClick={() => handleApplyPromptPreset("Explain what's in this image and its significance.")}
              className="px-2.5 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-cyan-100 text-[11px] whitespace-nowrap transition-colors"
            >
              Explain what's in this image
            </button>
            <button
              onClick={() => handleApplyPromptPreset('Inspect this image carefully and find any potential problems, anomalies, or errors.')}
              className="px-2.5 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-cyan-100 text-[11px] whitespace-nowrap transition-colors"
            >
              Find problems
            </button>
            <button
              onClick={() => handleApplyPromptPreset('Extract and transcribe all visible text from this image.')}
              className="px-2.5 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 hover:text-cyan-100 text-[11px] whitespace-nowrap transition-colors"
            >
              Read text
            </button>
          </div>
        )}

        {/* Attached Files / Images Preview Strip */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pb-1">
            {attachments.map((att) => {
              const isImg = att.type.startsWith('image/');
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 group"
                >
                  {isImg && att.base64 ? (
                    <img
                      src={att.base64}
                      alt={att.name}
                      className="w-6 h-6 rounded object-cover border border-cyan-500/30"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="font-mono text-[11px] max-w-[140px] truncate">
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({Math.round(att.size / 1024)}KB)
                  </span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Input Box Card */}
        <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30 shadow-2xl transition-all">
          <textarea
            id="nexus-prompt-textarea"
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to voice command... (speak now)'
                : 'Message NEXUS OS... Ask a question, run a tool, or attach files/images...'
            }
            className="w-full px-4 pt-3 pb-12 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Bottom Toolbar inside card */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.docx,.csv,.json,.py,.java,.js,.jsx,.ts,.tsx,.html,.css,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                id="input-attach-file-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title="Attach supported files (TXT, PDF, DOCX, CSV, JSON, Python, Java, JS, TS, HTML, CSS)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Image Upload Button */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                id="input-upload-image-btn"
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title="Upload image for multimodal vision understanding"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Voice Placeholder / Speech Recognition Button */}
              <button
                id="input-voice-btn"
                type="button"
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-rose-950/80 text-rose-400 animate-pulse border border-rose-600/50'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                }`}
                title={
                  isListening
                    ? 'Click to stop listening'
                    : 'Voice input (Speech recognition & voice control)'
                }
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Tool status indicator */}
              <button
                id="input-tool-status-btn"
                type="button"
                onClick={onOpenTools}
                className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-slate-700 transition-colors"
                title="Click to view & configure active tools"
              >
                <Wrench className="w-3 h-3 text-cyan-400" />
                <span>{activeToolsCount} Tools Active</span>
              </button>
            </div>

            {/* Right Action: Send or Stop */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="hidden md:inline text-[10px] font-mono text-slate-400">
                Press Enter ↵
              </span>

              {isStreaming ? (
                <button
                  id="input-stop-btn"
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-[0_0_12px_-2px_rgba(225,29,72,0.4)] transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  id="input-send-btn"
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() && attachments.length === 0}
                  className={`flex items-center justify-center p-2 rounded-xl text-xs font-medium transition-all ${
                    text.trim() || attachments.length > 0
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] cursor-pointer'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Send message to NEXUS"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
