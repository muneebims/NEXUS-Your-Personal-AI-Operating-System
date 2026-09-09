import { SystemStatus, ToolCall, AgentStep, NexusToolDefinition } from '../types/nexus.js';

export interface ChatStreamOptions {
  messages: any[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  memoryItems?: any[];
  uploadedFiles?: any[];
  agentMode?: boolean;
  toolPermissions?: Record<string, boolean>;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onToolResult?: (toolCall: ToolCall) => void;
  onAgentStep?: (step: AgentStep) => void;
  onError: (error: string) => void;
  onDone: (fullText: string) => void;
}

export const apiClient = {
  async getStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/status');
    if (!res.ok) {
      throw new Error(`Failed to fetch system status: ${res.statusText}`);
    }
    return res.json();
  },

  async getTools(): Promise<{ tools: NexusToolDefinition[] }> {
    const res = await fetch('/api/tools');
    if (!res.ok) {
      throw new Error(`Failed to fetch tools: ${res.statusText}`);
    }
    return res.json();
  },

  async executeTool(toolName: string, args: Record<string, any>, context?: any): Promise<any> {
    const res = await fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, args, context }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Tool execution failed');
    }
    return res.json();
  },

  async streamChat(options: ChatStreamOptions): Promise<void> {
    const {
      messages,
      provider,
      model,
      temperature,
      maxTokens,
      systemPrompt,
      memoryItems,
      uploadedFiles,
      agentMode,
      toolPermissions,
      signal,
      onChunk,
      onToolCall,
      onToolResult,
      onAgentStep,
      onError,
      onDone,
    } = options;

    let response: Response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          provider,
          model,
          temperature,
          maxTokens,
          systemPrompt,
          memoryItems,
          uploadedFiles,
          agentMode,
          toolPermissions,
        }),
        signal,
      });
    } catch (networkErr: any) {
      if (networkErr.name === 'AbortError') {
        onDone('');
        return;
      }
      onError(`Network error: ${networkErr.message}`);
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      onError(`Server error (${response.status}): ${errorText}`);
      return;
    }

    if (!response.body) {
      onError('Response stream body is unavailable.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';
    let fullAccumulated = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'chunk') {
                fullAccumulated += data.text || '';
                onChunk(data.text || '');
              } else if (currentEvent === 'agent_step') {
                onAgentStep?.(data);
              } else if (currentEvent === 'tool_call') {
                onToolCall?.(data);
              } else if (currentEvent === 'tool_result') {
                onToolResult?.(data);
              } else if (currentEvent === 'error') {
                onError(data.error || 'Unknown error occurred');
              } else if (currentEvent === 'done') {
                onDone(data.fullText || fullAccumulated);
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      onDone(fullAccumulated);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onDone(fullAccumulated);
      } else {
        onError(`Streaming error: ${err.message}`);
      }
    }
  },
};
