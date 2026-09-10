import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  BrainCircuit,
  FolderArchive,
  Wrench,
  Settings,
  Trash2,
  Pin,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Conversation } from '../types/nexus.js';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onOpenMemory: () => void;
  onOpenFiles: () => void;
  onOpenTools: () => void;
  onOpenSettings: () => void;
  memoriesCount: number;
  filesCount: number;
  activeToolsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onOpenMemory,
  onOpenFiles,
  onOpenTools,
  onOpenSettings,
  memoriesCount,
  filesCount,
  activeToolsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredConversations = conversations
    .filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const content = (
    <aside
      id="nexus-sidebar"
      className="w-72 border-r flex flex-col h-full shrink-0 select-none transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Action: New Conversation */}
      <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
        <button
          id="sidebar-new-session-btn"
          onClick={() => {
            onNewConversation();
            onCloseMobile();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-[0.99] text-white shadow-sm"
          style={{
            backgroundColor: 'var(--accent-color)',
          }}
          aria-label="Start new conversation"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Close button for mobile drawer */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800/30 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs transition-all border outline-none"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            aria-label="Search conversation history"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Clear search query"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Feature Links: Memory, Files, Tools */}
      <div className="p-2 border-b space-y-1 text-xs" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => {
            onOpenMemory();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:opacity-90 text-left"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
          aria-label="Open Memory Manager"
        >
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <span className="font-medium">Memory</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-color)',
            }}
          >
            {memoriesCount} saved
          </span>
        </button>

        <button
          onClick={() => {
            onOpenFiles();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:opacity-90 text-left"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
          aria-label="Open Files Manager"
        >
          <div className="flex items-center gap-2">
            <FolderArchive className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <span className="font-medium">Files</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-color)',
            }}
          >
            {filesCount} files
          </span>
        </button>

        <button
          onClick={() => {
            onOpenTools();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:opacity-90 text-left"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
          aria-label="Open Tools Directory"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <span className="font-medium">Tools</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-color)',
            }}
          >
            {activeToolsCount} active
          </span>
        </button>
      </div>

      {/* Recent Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div
          className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>Recent Conversations</span>
          <span className="text-[10px]">{filteredConversations.length}</span>
        </div>

        {filteredConversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id;

            return (
              <div
                key={conv.id}
                id={`conv-item-${conv.id}`}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onCloseMobile();
                }}
                className="group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all border"
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  borderColor: isActive ? 'var(--accent-color)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {editingId === conv.id ? (
                  <form
                    onSubmit={(e) => handleSaveRename(conv.id, e)}
                    className="flex items-center gap-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-1.5 py-0.5 rounded text-xs outline-none border"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--accent-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="submit"
                      className="p-1 hover:opacity-80"
                      style={{ color: 'var(--color-success)' }}
                      title="Save title"
                      aria-label="Save title"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                      title="Cancel"
                      aria-label="Cancel editing"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {conv.pinned ? (
                        <Pin
                          className="w-3 h-3 shrink-0"
                          style={{ color: 'var(--accent-color)' }}
                        />
                      ) : (
                        <MessageSquare
                          className="w-3 h-3 shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      )}
                      <span className="truncate">{conv.title}</span>
                    </div>

                    {/* Quick actions on hover */}
                    <div className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinConversation(conv.id);
                        }}
                        className="p-1 rounded hover:bg-slate-800/30 transition-colors"
                        style={{ color: conv.pinned ? 'var(--accent-color)' : 'var(--text-muted)' }}
                        title={conv.pinned ? 'Unpin' : 'Pin to top'}
                        aria-label={conv.pinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 rounded hover:bg-slate-800/30 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Rename conversation"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deleteConfirmId === conv.id) {
                            onDeleteConversation(conv.id);
                            setDeleteConfirmId(null);
                          } else {
                            setDeleteConfirmId(conv.id);
                            setTimeout(() => setDeleteConfirmId(null), 3000);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-800/30 transition-colors"
                        style={{ color: deleteConfirmId === conv.id ? 'var(--color-error)' : 'var(--text-muted)' }}
                        title={deleteConfirmId === conv.id ? 'Click again to confirm delete' : 'Delete conversation'}
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Settings Button */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          id="sidebar-nav-settings"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings & Preferences</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">{content}</div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 md:hidden flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative z-50 h-full w-72 shadow-2xl animate-fadeIn">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
