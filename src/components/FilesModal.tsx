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

  const getFileIcon = (file: FileAttachment) => {
    if (file.type.includes('csv') || file.type.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
    }
    if (file.type.includes('javascript') || file.type.includes('typescript') || file.type.includes('python')) {
      return <Code2 className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
    }
    return <FileText className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Files Workspace"
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
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">
                NEXUS Files
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {files.length} uploaded files available for document inspection and summary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close Files"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* File list column */}
          <div
            className="w-72 sm:w-80 border-r flex flex-col p-3 space-y-2 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex-1 space-y-1 pt-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'No matching files' : 'No uploaded files in this session.'}
                </div>
              ) : (
                filtered.map((file) => {
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className="p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between"
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--accent-subtle)'
                          : 'var(--bg-surface-elevated)',
                        borderColor: isSelected
                          ? 'var(--accent-color)'
                          : 'var(--border-color)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(file)}
                        <div className="min-w-0 flex-1">
                          <span className="font-medium block truncate">{file.name}</span>
                          <span className="text-[10px] block truncate" style={{ color: 'var(--text-muted)' }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                          if (selectedFile?.id === file.id) {
                            setSelectedFile(files.filter((f) => f.id !== file.id)[0] || null);
                          }
                        }}
                        className="p-1 hover:opacity-80 transition-colors ml-1"
                        style={{ color: 'var(--text-muted)' }}
                        title="Delete file"
                        aria-label={`Delete ${file.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 hover:text-rose-400" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* File Content Preview Column */}
          <div
            className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {selectedFile ? (
              <>
                <div
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-sm">{selectedFile.name}</h3>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Format: {selectedFile.type || 'text/plain'} &bull; {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(selectedFile)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:opacity-80 transition-colors"
                      style={{
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAskAboutFile(selectedFile);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask About This File</span>
                    </button>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl border flex-1 overflow-auto font-mono text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                Select a file to preview its content
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
            Close Files
          </button>
        </div>
      </div>
    </div>
  );
};
