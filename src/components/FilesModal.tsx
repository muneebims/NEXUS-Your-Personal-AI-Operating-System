import React, { useState } from 'react';
import {
  FolderArchive,
  FileText,
  X,
  Download,
  Trash2,
  Code2,
  FileSpreadsheet,
  MessageSquare,
  Search,
  ExternalLink,
} from 'lucide-react';
import { FileAttachment } from '../types/nexus.js';

interface FilesModalProps {
  files: FileAttachment[];
  onDeleteFile: (id: string) => void;
  onAskAboutFile: (file: FileAttachment) => void;
  onClose: () => void;
}

export const FilesModal: React.FC<FilesModalProps> = ({
  files,
  onDeleteFile,
  onAskAboutFile,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(
    files[0] || null
  );
  const [search, setSearch] = useState('');

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (file: FileAttachment) => {
    const blob = new Blob([file.content], { type: file.type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide">
                NEXUS File Workspace
              </h2>
              <p className="text-xs text-slate-400">
                Uploaded code, documents, spreadsheets, and vision assets
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

        {/* Modal Body: Left Files List, Right Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* File List Pane */}
          <div className="w-72 border-r border-slate-800/80 flex flex-col bg-slate-950">
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No files uploaded.
                </div>
              ) : (
                filtered.map((f) => {
                  const isSelected = selectedFile?.id === f.id;
                  const isImg = f.type.startsWith('image/');

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFile(f)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isImg ? (
                          <span className="w-4 h-4 rounded bg-cyan-900/50 text-cyan-400 flex items-center justify-center text-[10px] font-mono">
                            IMG
                          </span>
                        ) : (
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate font-mono text-[11px]">
                          {f.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">
                        {Math.round(f.size / 1024)}KB
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* File Inspector Preview Pane */}
          <div className="flex-1 flex flex-col bg-slate-900/40 overflow-hidden">
            {selectedFile ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File Header */}
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="space-y-0.5">
                    <h3 className="font-mono text-xs font-semibold text-slate-200">
                      {selectedFile.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>Type: {selectedFile.type || 'plain text'}</span>
                      <span>•</span>
                      <span>Size: {Math.round(selectedFile.size / 1024)} KB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onAskAboutFile(selectedFile);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask NEXUS</span>
                    </button>

                    <button
                      onClick={() => handleDownload(selectedFile)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onDeleteFile(selectedFile.id);
                        setSelectedFile(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* File Content Preview */}
                <div className="flex-1 overflow-auto p-4 font-mono-code text-xs">
                  {selectedFile.type.startsWith('image/') && selectedFile.base64 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <img
                        src={selectedFile.base64}
                        alt={selectedFile.name}
                        className="max-h-96 max-w-full rounded-xl border border-slate-800 shadow-2xl object-contain"
                      />
                    </div>
                  ) : (
                    <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedFile.content || '(File is empty)'}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                Select a file to inspect its content and metadata.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
