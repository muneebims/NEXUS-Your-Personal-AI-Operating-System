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
  AlertCircle,
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
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

  return (
    <div
      id="nexus-message-input-container"
      className="p-3 sm:p-4 border-t backdrop-blur-lg shrink-0 transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Error message if upload failed */}
        {uploadError && (
          <div
            className="flex items-center justify-between p-2 rounded-lg text-xs"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-error)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="p-1 hover:opacity-80"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                <span className="max-w-[160px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={`Remove attachment ${att.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box Card */}
        <div
          className="rounded-2xl border transition-all shadow-sm focus-within:ring-1"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Expanding Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'NEXUS is generating an answer...'
                : 'Ask NEXUS anything, upload files, or request tasks...'
            }
            className="w-full px-4 pt-3.5 pb-2 rounded-t-2xl resize-none text-xs sm:text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
            }}
            aria-label="Message input field"
          />

          {/* Action Row */}
          <div className="px-3 pb-2.5 flex items-center justify-between">
            {/* Left Controls: Attachments + Voice */}
            <div className="flex items-center gap-1">
              {/* File Attachment */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css,.xml,.yaml,.yml,.pdf"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg transition-colors hover:bg-slate-800/20"
                style={{ color: 'var(--text-secondary)' }}
                title="Attach document or file"
                aria-label="Attach document or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Image Attachment */}
              <input
                ref={imageInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-lg transition-colors hover:bg-slate-800/20"
                style={{ color: 'var(--text-secondary)' }}
                title="Attach image"
                aria-label="Attach image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Voice Speech to Text */}
              <button
                type="button"
                onClick={toggleVoice}
                className="p-2 rounded-lg transition-colors hover:bg-slate-800/20"
                style={{
                  color: isListening ? 'var(--color-error)' : 'var(--text-secondary)',
                }}
                title={isListening ? 'Stop voice recording' : 'Dictate with voice'}
                aria-label={isListening ? 'Stop recording voice' : 'Start voice input'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Active Tools shortcut */}
              <button
                type="button"
                onClick={onOpenTools}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                }}
                title="View enabled tools"
                aria-label="View enabled tools"
              >
                <span>Tools:</span>
                <span style={{ color: 'var(--accent-color)' }}>{activeToolsCount} active</span>
              </button>
            </div>

            {/* Right: Send or Stop Button */}
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs text-white shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--color-error)' }}
                  aria-label="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() && attachments.length === 0}
                  className="p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium text-xs text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  style={{ backgroundColor: 'var(--accent-color)' }}
                  aria-label="Send message"
                >
                  <span className="hidden sm:inline mr-1">Send</span>
                  <Send className="w-3.5 h-3.5 inline" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="hidden sm:flex items-center justify-center text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>Press Enter to send &bull; Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
