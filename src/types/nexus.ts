export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  content: string; // extracted text or data
  base64?: string; // for images or binary
  uploadedAt: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  executedAt?: number;
}

export interface AgentStep {
  stepNumber: number;
  stage: 'PLAN' | 'SELECT_TOOL' | 'EXECUTE_TOOL' | 'OBSERVE' | 'DECIDE' | 'COMPLETE';
  thought: string;
  toolCall?: ToolCall;
  timestamp: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
  toolCalls?: ToolCall[];
  agentSteps?: AgentStep[];
  isStreaming?: boolean;
  error?: string;
  memoryReferenced?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  activeModel?: string;
  pinned?: boolean;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'fact' | 'preference' | 'project' | 'general';
  confidence: number;
  createdAt: number;
  updatedAt: number;
  sourceMessageId?: string;
}

export interface NexusToolDefinition {
  name: string;
  displayName: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  enabled: boolean;
  category: 'utility' | 'system' | 'computation' | 'data';
}

export type ThemeMode = 'midnight' | 'light' | 'cyber' | 'nebula' | 'matrix' | 'ember';
export type AccentColor = 'cyan' | 'blue' | 'purple' | 'green' | 'orange' | 'pink';

export interface AppSettings {
  provider: 'groq' | 'openai' | 'gemini' | 'custom';
  groqModel: string;
  openaiModel: string;
  geminiModel: string;
  temperature: number;
  maxTokens: number;
  memoryEnabled: boolean;
  agentMode: boolean;
  maxIterations: number;
  systemPrompt: string;
  theme: ThemeMode;
  accent: AccentColor;
  toolPermissions: Record<string, boolean>;
}

export interface SystemStatus {
  groqConfigured?: boolean;
  openaiConfigured: boolean;
  geminiConfigured: boolean;
  defaultProvider: 'groq' | 'openai' | 'gemini' | 'none';
  activeProvider?: string;
  activeModel?: string;
  providerName?: string;
  serverTime: string;
  environment?: string;
  providers?: Array<{
    id: string;
    name: string;
    configured: boolean;
    defaultModel: string;
    models: string[];
  }>;
}
