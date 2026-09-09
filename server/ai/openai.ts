import { ChatMessageParam, GenerateOptions, StreamCallbacks } from './types.js';

export interface OpenAIConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class OpenAIService {
  private static instance: OpenAIService;

  static getInstance(): OpenAIService {
    if (!this.instance) {
      this.instance = new OpenAIService();
    }
    return this.instance;
  }

  getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  isGroq(requestedProvider?: string): boolean {
    if (requestedProvider === 'groq') return true;
    const apiKey = this.getApiKey() || '';
    if (apiKey.startsWith('gsk_')) return true;
    const rawUrl = process.env.OPENAI_BASE_URL?.trim() || '';
    if (rawUrl.includes('groq.com')) return true;
    // Default to Groq provider context
    return true;
  }

  getBaseUrl(isGroqContext: boolean = true): string {
    const rawUrl = process.env.OPENAI_BASE_URL?.trim();
    if (rawUrl) {
      return rawUrl.replace(/\/+$/, '');
    }
    // When Groq is selected or detected, NEVER send requests to api.openai.com
    if (isGroqContext || this.isGroq()) {
      return 'https://api.groq.com/openai/v1';
    }
    return 'https://api.openai.com/v1';
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  getDefaultModel(): string {
    return 'openai/gpt-oss-20b';
  }

  listModels(): string[] {
    return [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'qwen/qwen3.6-27b',
      'groq/compound',
      'groq/compound-mini',
      'whisper-large-v3-turbo',
    ];
  }

  /**
   * Format messages for the OpenAI Responses API (`input` parameter)
   */
  private formatResponsesInput(messages: ChatMessageParam[]): any[] {
    const inputItems: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // System instructions are passed separately in `instructions`
        continue;
      }

      if (msg.role === 'tool') {
        inputItems.push({
          type: 'function_call_output',
          call_id: msg.toolCallId || 'call_default',
          output: msg.content,
        });
        continue;
      }

      if (msg.images && msg.images.length > 0) {
        const contentParts: any[] = [{ type: 'input_text', text: msg.content || '' }];
        for (const img of msg.images) {
          contentParts.push({
            type: 'input_image',
            image_url: `data:${img.mimeType};base64,${img.data}`,
          });
        }
        inputItems.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: contentParts,
        });
      } else {
        inputItems.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return inputItems;
  }

  /**
   * Format messages for standard chat/completions fallback
   */
  private formatChatMessages(messages: ChatMessageParam[], systemInstruction?: string): any[] {
    const formatted: any[] = [];

    if (systemInstruction) {
      formatted.push({
        role: 'system',
        content: systemInstruction,
      });
    }

    for (const msg of messages) {
      if (msg.role === 'tool') {
        formatted.push({
          role: 'tool',
          tool_call_id: msg.toolCallId,
          name: msg.toolName,
          content: msg.content,
        });
        continue;
      }

      if (msg.images && msg.images.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: msg.content || '' }];
        for (const img of msg.images) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mimeType};base64,${img.data}`,
            },
          });
        }
        formatted.push({
          role: msg.role,
          content: contentParts,
        });
      } else {
        formatted.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return formatted;
  }

  /**
   * Format tools for Responses API and Chat Completions
   */
  private formatTools(tools?: GenerateOptions['tools']) {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      type: 'function',
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  /**
   * Primary method: Stream using OpenAI Responses API (`/v1/responses`)
   * with automatic fallback to `/v1/chat/completions` if the endpoint is not yet supported
   */
  async streamChat(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      const err = new Error(
        'OPENAI_API_KEY is not configured on the server. Please add your OpenAI API key to your environment variables.'
      );
      callbacks.onError(err);
      return;
    }

    const baseUrl = this.getBaseUrl();
    const model = options.model || this.getDefaultModel();
    const responsesUrl = baseUrl.endsWith('/v1')
      ? `${baseUrl}/responses`
      : `${baseUrl}/v1/responses`;

    const responsesPayload: any = {
      model,
      instructions: options.systemInstruction || 'You are NEXUS, a modular personal AI operating system.',
      input: this.formatResponsesInput(messages),
      stream: true,
      temperature: options.temperature ?? 0.7,
    };

    if (options.maxTokens) {
      responsesPayload.max_output_tokens = options.maxTokens;
    }

    const formattedTools = this.formatTools(options.tools);
    if (formattedTools && formattedTools.length > 0) {
      responsesPayload.tools = formattedTools;
    }

    let response: Response;
    try {
      response = await fetch(responsesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(responsesPayload),
      });
    } catch (networkErr: any) {
      callbacks.onError(
        new Error(`Failed to connect to OpenAI endpoint at ${responsesUrl}: ${networkErr.message}`)
      );
      return;
    }

    // If /v1/responses returns 404 (e.g. proxy or provider only supporting chat/completions), fallback
    if (response.status === 404) {
      console.log(`[OpenAI Service] /v1/responses returned 404, falling back to /v1/chat/completions`);
      return this.streamChatCompletionsFallback(messages, options, callbacks, apiKey, baseUrl, model);
    }

    const isGroqProvider = this.isGroq();
    const providerLabel = isGroqProvider ? 'Groq' : 'OpenAI';

    if (!response.ok) {
      let errorBody = '';
      try {
        const errorJson = await response.json();
        errorBody = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {
        errorBody = await response.text();
      }

      const status = response.status;
      let userMsg = `${providerLabel} API error (${status}): ${errorBody || response.statusText}`;
      if (status === 401) {
        userMsg = `Authentication error (401): The provided ${providerLabel} API key is invalid or expired.`;
      } else if (status === 429) {
        userMsg = `Rate limit exceeded (429): Too many requests or rate limit reached on ${providerLabel}. Please retry in a moment.`;
      }
      callbacks.onError(new Error(userMsg));
      return;
    }

    if (!response.body) {
      callbacks.onError(new Error(`${providerLabel} response body is empty.`));
      return;
    }

    // Parse SSE stream from Responses API
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    const toolCallsAccumulator: Record<string, { id: string; name: string; argsText: string }> = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);

              // 1. Separate reasoning text deltas (Groq / Responses API)
              if (parsed.type === 'response.reasoning_text.delta') {
                if (callbacks.onReasoning && typeof parsed.delta === 'string') {
                  callbacks.onReasoning(parsed.delta);
                }
              }
              // 2. Text deltas for assistant message
              else if (
                parsed.type === 'response.output_text.delta' ||
                parsed.type === 'response.text.delta'
              ) {
                const deltaStr =
                  typeof parsed.delta === 'string'
                    ? parsed.delta
                    : parsed.delta?.text || '';
                if (deltaStr) {
                  accumulatedText += deltaStr;
                  callbacks.onChunk(deltaStr);
                }
              } else if (!parsed.type && parsed.delta && typeof parsed.delta === 'string') {
                accumulatedText += parsed.delta;
                callbacks.onChunk(parsed.delta);
              }

              // 3. Chat completions compatibility delta check
              if (parsed.choices?.[0]?.delta?.content) {
                const c = parsed.choices[0].delta.content;
                accumulatedText += c;
                callbacks.onChunk(c);
              }

              // 3. Tool call / function call deltas
              if (parsed.type === 'response.function_call_arguments.delta' || parsed.type === 'response.function_call.delta') {
                const callId = parsed.call_id || parsed.id || 'call_resp';
                if (!toolCallsAccumulator[callId]) {
                  toolCallsAccumulator[callId] = {
                    id: callId,
                    name: parsed.name || '',
                    argsText: '',
                  };
                }
                if (parsed.name) toolCallsAccumulator[callId].name = parsed.name;
                if (parsed.delta) toolCallsAccumulator[callId].argsText += parsed.delta;
              } else if (parsed.type === 'response.output_item.done' && parsed.item?.type === 'function_call') {
                const item = parsed.item;
                const callId = item.call_id || item.id || `call_${Date.now()}`;
                toolCallsAccumulator[callId] = {
                  id: callId,
                  name: item.name,
                  argsText: typeof item.arguments === 'string' ? item.arguments : JSON.stringify(item.arguments || {}),
                };
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Dispatch tool calls if any
      for (const callId in toolCallsAccumulator) {
        const item = toolCallsAccumulator[callId];
        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(item.argsText || '{}');
        } catch {
          parsedArgs = { raw: item.argsText };
        }
        if (callbacks.onToolCall && item.name) {
          callbacks.onToolCall({
            id: item.id,
            name: item.name,
            arguments: parsedArgs,
          });
        }
      }

      callbacks.onComplete(accumulatedText);
    } catch (streamErr: any) {
      callbacks.onError(new Error(`Stream error: ${streamErr.message}`));
    }
  }

  /**
   * Fallback for OpenAI chat completions (`/v1/chat/completions`)
   */
  private async streamChatCompletionsFallback(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    callbacks: StreamCallbacks,
    apiKey: string,
    baseUrl: string,
    model: string
  ): Promise<void> {
    const chatUrl = baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

    const chatMessages = this.formatChatMessages(messages, options.systemInstruction);
    const tools = options.tools && options.tools.length > 0
      ? options.tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      : undefined;

    const payload: any = {
      model,
      messages: chatMessages,
      stream: true,
      temperature: options.temperature ?? 0.7,
    };

    if (options.maxTokens) payload.max_tokens = options.maxTokens;
    if (tools) payload.tools = tools;

    let response: Response;
    try {
      response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      callbacks.onError(new Error(`Chat completions fallback failed: ${err.message}`));
      return;
    }

    if (!response.ok) {
      const errText = await response.text();
      callbacks.onError(new Error(`OpenAI API error (${response.status}): ${errText}`));
      return;
    }

    if (!response.body) {
      callbacks.onError(new Error('OpenAI response body is empty.'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    const toolCallsAccumulator: Record<number, { id: string; name: string; argsText: string }> = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta;
              if (delta) {
                if (delta.content) {
                  accumulatedText += delta.content;
                  callbacks.onChunk(delta.content);
                }
                if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!toolCallsAccumulator[idx]) {
                      toolCallsAccumulator[idx] = {
                        id: tc.id || `call_${Date.now()}_${idx}`,
                        name: tc.function?.name || '',
                        argsText: '',
                      };
                    }
                    if (tc.id) toolCallsAccumulator[idx].id = tc.id;
                    if (tc.function?.name) toolCallsAccumulator[idx].name = tc.function.name;
                    if (tc.function?.arguments) {
                      toolCallsAccumulator[idx].argsText += tc.function.arguments;
                    }
                  }
                }
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      for (const idx in toolCallsAccumulator) {
        const item = toolCallsAccumulator[idx];
        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(item.argsText || '{}');
        } catch {
          parsedArgs = { raw: item.argsText };
        }
        if (callbacks.onToolCall && item.name) {
          callbacks.onToolCall({
            id: item.id,
            name: item.name,
            arguments: parsedArgs,
          });
        }
      }

      callbacks.onComplete(accumulatedText);
    } catch (err: any) {
      callbacks.onError(new Error(`Stream error: ${err.message}`));
    }
  }

  /**
   * Non-streaming request using OpenAI Responses API
   */
  async generateResponse(
    messages: ChatMessageParam[],
    options: GenerateOptions
  ): Promise<{ text: string; toolCalls?: Array<{ id: string; name: string; arguments: any }> }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured on the server.');
    }

    const baseUrl = this.getBaseUrl();
    const model = options.model || this.getDefaultModel();
    const responsesUrl = baseUrl.endsWith('/v1')
      ? `${baseUrl}/responses`
      : `${baseUrl}/v1/responses`;

    const responsesPayload: any = {
      model,
      instructions: options.systemInstruction || 'You are NEXUS, a modular personal AI operating system.',
      input: this.formatResponsesInput(messages),
      temperature: options.temperature ?? 0.7,
    };

    if (options.maxTokens) responsesPayload.max_output_tokens = options.maxTokens;
    const formattedTools = this.formatTools(options.tools);
    if (formattedTools && formattedTools.length > 0) responsesPayload.tools = formattedTools;

    const res = await fetch(responsesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(responsesPayload),
    });

    if (res.status === 404) {
      // Fallback to chat completions
      return this.generateChatCompletionsFallback(messages, options, apiKey, baseUrl, model);
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    let text = '';
    const toolCalls: Array<{ id: string; name: string; arguments: any }> = [];

    if (typeof data.output_text === 'string') {
      text = data.output_text;
    } else if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === 'message' && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === 'text') text += part.text || '';
          }
        } else if (item.type === 'function_call') {
          let args = {};
          try {
            args = typeof item.arguments === 'string' ? JSON.parse(item.arguments) : item.arguments;
          } catch {
            args = { raw: item.arguments };
          }
          toolCalls.push({
            id: item.call_id || item.id || `call_${Date.now()}`,
            name: item.name,
            arguments: args,
          });
        }
      }
    }

    return { text, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
  }

  private async generateChatCompletionsFallback(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    apiKey: string,
    baseUrl: string,
    model: string
  ): Promise<{ text: string; toolCalls?: Array<{ id: string; name: string; arguments: any }> }> {
    const chatUrl = baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

    const chatMessages = this.formatChatMessages(messages, options.systemInstruction);
    const tools = options.tools?.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const payload: any = {
      model,
      messages: chatMessages,
      temperature: options.temperature ?? 0.7,
    };
    if (options.maxTokens) payload.max_tokens = options.maxTokens;
    if (tools && tools.length > 0) payload.tools = tools;

    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || '';
    const toolCalls = choice?.message?.tool_calls?.map((tc: any) => {
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = { raw: tc.function.arguments };
      }
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: args,
      };
    });

    return { text, toolCalls };
  }
}

export const openAIService = OpenAIService.getInstance();
