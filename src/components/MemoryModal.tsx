import React, { useState } from 'react';
import {
  BrainCircuit,
  Plus,
  Trash2,
  X,
  Search,
  Check,
  Sparkles,
} from 'lucide-react';
import { MemoryItem } from '../types/nexus.js';

interface MemoryModalProps {
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onClearMemories: () => void;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCat, setNewCat] = useState<MemoryItem['category']>('fact');

  const categories = ['all', 'fact', 'preference', 'project', 'general'];

  const filtered = memories.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.value.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onAddMemory(newKey.trim(), newValue.trim(), newCat);
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Memory Subsystem"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors"
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
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">
                NEXUS Memory
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {memories.length} saved facts, preferences, and project guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close Memory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div
          className="p-4 border-b flex flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search remembered facts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-[11px] capitalize transition-colors"
                  style={{
                    backgroundColor: selectedCategory === cat ? 'var(--accent-subtle)' : 'transparent',
                    color: selectedCategory === cat ? 'var(--accent-color)' : 'var(--text-secondary)',
                    border: selectedCategory === cat ? '1px solid var(--accent-color)' : '1px solid transparent',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Add Memory Form if open */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="p-4 border-b space-y-3 animate-fadeIn"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--accent-color)' }}>
                <Sparkles className="w-3.5 h-3.5" /> Store New Memory
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Topic or Key Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Favorite Language, Project Tech Stack"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none capitalize"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="fact">Fact</option>
                  <option value="preference">Preference</option>
                  <option value="project">Project</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Fact or Guideline Description
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Always generate responses using modern TypeScript and responsive layout"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg border text-xs hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-color)' }}
              >
                Save Fact
              </button>
            </div>
          </form>
        )}

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {search ? 'No matching memories' : 'No memories saved yet. Click "Add Memory" to create one.'}
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs truncate">{m.key}</span>
                    <span
                      className="px-2 py-0.2 rounded-full text-[10px] uppercase font-mono"
                      style={{
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-color)',
                      }}
                    >
                      {m.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {m.value}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteMemory(m.id)}
                  className="p-1.5 rounded-lg hover:opacity-80 transition-colors shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Delete memory"
                  aria-label={`Delete memory ${m.key}`}
                >
                  <Trash2 className="w-3.5 h-3.5 hover:text-rose-400" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3.5 border-t flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all stored memories?')) {
                onClearMemories();
              }
            }}
            className="text-xs text-rose-400 hover:underline"
          >
            Clear All Memories
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
