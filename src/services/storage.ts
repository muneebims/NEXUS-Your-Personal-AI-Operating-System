import { Conversation, MemoryItem, AppSettings, FileAttachment } from '../types/nexus.js';

const CONVERSATIONS_KEY = 'nexus_conversations_v1';
const MEMORIES_KEY = 'nexus_memories_v1';
const SETTINGS_KEY = 'nexus_settings_v1';
const ACTIVE_CONV_KEY = 'nexus_active_conv_id';
const FILES_KEY = 'nexus_saved_files_v1';

export const defaultSettings: AppSettings = {
  provider: 'groq',
  groqModel: 'openai/gpt-oss-20b',
  openaiModel: 'gpt-4o',
  geminiModel: 'gemini-3.6-flash',
  temperature: 0.7,
  maxTokens: 2048,
  memoryEnabled: true,
  agentMode: false,
  maxIterations: 5,
  systemPrompt: 'You are NEXUS, an advanced modular personal AI operating system. Provide clear, precise, and well-structured answers. When tools are enabled, use them to calculate, inspect files, or verify facts.',
  theme: 'midnight',
  accent: 'cyan',
  toolPermissions: {
    calculator: true,
    date_time: true,
    file_reader: true,
    file_writer: true,
    code_execution: true,
    web_search: true,
  },
};

const initialMemories: MemoryItem[] = [
  {
    id: 'mem_init_1',
    key: 'Preferred Tech Stack',
    value: 'Modern TypeScript, React, modular clean architecture',
    category: 'preference',
    confidence: 1.0,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'mem_init_2',
    key: 'Communication Style',
    value: 'Concise, direct, high signal-to-noise ratio with clear technical precision',
    category: 'preference',
    confidence: 0.95,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
  },
];

export const storage = {
  // Conversations
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(CONVERSATIONS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveConversations(convs: Conversation[]): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
    } catch (e) {
      console.error('Failed to save conversations to storage:', e);
    }
  },

  getActiveConversationId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_CONV_KEY);
    } catch {
      return null;
    }
  },

  setActiveConversationId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_CONV_KEY, id);
    } catch {
      // ignore
    }
  },

  clearConversations(): void {
    try {
      localStorage.removeItem(CONVERSATIONS_KEY);
      localStorage.removeItem(ACTIVE_CONV_KEY);
    } catch {
      // ignore
    }
  },

  // Memories
  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(MEMORIES_KEY);
      if (!data) {
        this.saveMemories(initialMemories);
        return initialMemories;
      }
      return JSON.parse(data);
    } catch {
      return initialMemories;
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save memories:', e);
    }
  },

  addMemory(key: string, value: string, category: MemoryItem['category'] = 'fact', sourceMsgId?: string): MemoryItem {
    const memories = this.getMemories();
    const newMemory: MemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: key.trim(),
      value: value.trim(),
      category,
      confidence: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceMessageId: sourceMsgId,
    };
    memories.unshift(newMemory);
    this.saveMemories(memories);
    return newMemory;
  },

  deleteMemory(id: string): void {
    const memories = this.getMemories().filter((m) => m.id !== id);
    this.saveMemories(memories);
  },

  clearMemories(): void {
    try {
      localStorage.removeItem(MEMORIES_KEY);
    } catch {
      // ignore
    }
  },

  // Settings
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return defaultSettings;
      const parsed = JSON.parse(data);
      const theme = parsed.theme === 'dark' ? 'midnight' : (parsed.theme || 'midnight');
      const accent = parsed.accent || 'cyan';
      return { ...defaultSettings, ...parsed, theme, accent };
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  // Files
  getFiles(): FileAttachment[] {
    try {
      const data = localStorage.getItem(FILES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveFiles(files: FileAttachment[]): void {
    try {
      localStorage.setItem(FILES_KEY, JSON.stringify(files));
    } catch {
      // ignore
    }
  },

  deleteFile(id: string): void {
    const files = this.getFiles().filter((f) => f.id !== id);
    this.saveFiles(files);
  },
};
