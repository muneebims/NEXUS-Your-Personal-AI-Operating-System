export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  images?: Array<{
    mimeType: string;
    data: string; // base64
  }>;
  toolCallId?: string;
  toolName?: string;
}

export interface ToolDefinition {
  name: string;
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
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; arguments: any }) => void;
  onReasoning?: (thought: string) => void;
  onError: (error: Error) => void;
  onComplete: (fullText: string) => void;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  tools?: ToolDefinition[];
}

export interface AIProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  getDefaultModel(): string;
  listModels(): string[];
  streamChat(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    callbacks: StreamCallbacks
  ): Promise<void>;
  generateResponse(
    messages: ChatMessageParam[],
    options: GenerateOptions
  ): Promise<{
    text: string;
    toolCalls?: Array<{ id: string; name: string; arguments: any }>;
  }>;
}
