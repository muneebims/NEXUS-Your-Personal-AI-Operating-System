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
  Sparkles,
  Terminal,
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
  activeTab: 'chat' | 'memory' | 'files' | 'tools' | 'settings';
  onChangeTab: (tab: 'chat' | 'memory' | 'files' | 'tools' | 'settings') => void;
  memoriesCount: number;
  filesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  activeTab,
  onChangeTab,
  memoriesCount,
  filesCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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

  return (
    <aside
      id="nexus-sidebar"
      className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col h-full shrink-0 select-none"
    >
      {/* Primary Action: New Session */}
      <div className="p-3 border-b border-slate-800/60">
        <button
          id="sidebar-new-session-btn"
          onClick={() => {
            onChangeTab('chat');
            onNewConversation();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 font-medium text-sm border border-cyan-500/40 hover:border-cyan-400/60 shadow-[0_0_15px_-4px_rgba(6,182,212,0.2)] transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 text-cyan-400" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Navigation Modules (Memory, Files, Tools, Settings) */}
      <div className="p-2.5 border-b border-slate-800/60 grid grid-cols-4 gap-1">
        <button
          id="sidebar-nav-chat"
          onClick={() => onChangeTab('chat')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-all ${
            activeTab === 'chat'
              ? 'bg-slate-800 text-cyan-300 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="Active Chat View"
        >
          <MessageSquare className="w-4 h-4 mb-1" />
          <span className="text-[11px]">Chat</span>
        </button>

        <button
          id="sidebar-nav-memory"
          onClick={() => onChangeTab('memory')}
          className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-all ${
            activeTab === 'memory'
              ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="Memory System"
        >
          <BrainCircuit className="w-4 h-4 mb-1 text-indigo-400" />
          <span className="text-[11px]">Memory</span>
          {memoriesCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-400" />
          )}
        </button>

        <button
          id="sidebar-nav-files"
          onClick={() => onChangeTab('files')}
          className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-all ${
            activeTab === 'files'
              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="Uploaded Files"
        >
          <FolderArchive className="w-4 h-4 mb-1 text-cyan-400" />
          <span className="text-[11px]">Files</span>
          {filesCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
          )}
        </button>

        <button
          id="sidebar-nav-tools"
          onClick={() => onChangeTab('tools')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-all ${
            activeTab === 'tools'
              ? 'bg-sky-950/60 text-sky-300 border border-sky-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
          title="Modular Tools"
        >
          <Wrench className="w-4 h-4 mb-1 text-sky-400" />
          <span className="text-[11px]">Tools</span>
        </button>
      </div>

      {/* Conversation Search */}
      <div className="p-3 border-b border-slate-800/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          <span>History</span>
          <span className="text-[10px] font-mono text-slate-400">
            {filteredConversations.length}
          </span>
        </div>

        {filteredConversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-400">
            {searchQuery ? 'No matching conversations' : 'No conversation history'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id && activeTab === 'chat';

            return (
              <div
                key={conv.id}
                id={`conv-item-${conv.id}`}
                onClick={() => {
                  onChangeTab('chat');
                  onSelectConversation(conv.id);
                }}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-900 border-cyan-500/40 text-slate-100 shadow-[inset_0_0_12px_-4px_rgba(6,182,212,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
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
                      className="flex-1 px-1.5 py-0.5 bg-slate-950 border border-cyan-500/50 rounded text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 hover:text-emerald-400 text-slate-400"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 hover:text-rose-400 text-slate-400"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {conv.pinned ? (
                        <Pin className="w-3 h-3 text-cyan-400 shrink-0 fill-cyan-400/20" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{conv.title}</span>
                    </div>

                    {/* Quick action buttons on hover */}
                    <div className="hidden group-hover:flex items-center gap-1 ml-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinConversation(conv.id);
                        }}
                        className={`p-1 rounded hover:bg-slate-800 ${
                          conv.pinned ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={conv.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete"
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

      {/* Footer Settings Item & Diagnostic Badge */}
      <div className="p-3 border-t border-slate-800/60 flex items-center justify-between">
        <button
          id="sidebar-nav-settings"
          onClick={() => onChangeTab('settings')}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-900/60 border border-slate-800/80">
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>READY</span>
        </div>
      </div>
    </aside>
  );
};
