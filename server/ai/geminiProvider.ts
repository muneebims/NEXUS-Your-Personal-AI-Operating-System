import { GoogleGenAI } from '@google/genai';
import { AIProvider, ChatMessageParam, GenerateOptions, StreamCallbacks } from './types.js';

export class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini';

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0;
  }

  getDefaultModel(): string {
    return 'gemini-3.6-flash';
  }

  listModels(): string[] {
    return ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-2.5-flash'];
  }

  private formatContents(messages: ChatMessageParam[]): any[] {
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue; // handled via systemInstruction

      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (msg.images && msg.images.length > 0) {
        for (const img of msg.images) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          });
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    return contents;
  }

  private formatFunctionDeclarations(tools?: GenerateOptions['tools']) {
    if (!tools || tools.length === 0) return undefined;

    return [
      {
        functionDeclarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      },
    ];
  }

  async streamChat(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      callbacks.onError(
        new Error(
          'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your environment or switch provider.'
        )
      );
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = options.model || this.getDefaultModel();
      const contents = this.formatContents(messages);

      const config: any = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.temperature !== undefined) {
        config.temperature = options.temperature;
      }
      if (options.maxTokens !== undefined) {
        config.maxOutputTokens = options.maxTokens;
      }

      const formattedTools = this.formatFunctionDeclarations(options.tools);
      if (formattedTools) {
        config.tools = formattedTools;
      }

      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config,
      });

      let accumulatedText = '';

      for await (const chunk of responseStream) {
        if (chunk.text) {
          accumulatedText += chunk.text;
          callbacks.onChunk(chunk.text);
        }

        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          for (const fc of chunk.functionCalls) {
            if (callbacks.onToolCall) {
              callbacks.onToolCall({
                id: fc.id || `call_${Date.now()}`,
                name: fc.name,
                arguments: fc.args,
              });
            }
          }
        }
      }

      callbacks.onComplete(accumulatedText);
    } catch (err: any) {
      callbacks.onError(new Error(`Gemini Error: ${err.message || String(err)}`));
    }
  }

  async generateResponse(
    messages: ChatMessageParam[],
    options: GenerateOptions
  ): Promise<{ text: string; toolCalls?: Array<{ id: string; name: string; arguments: any }> }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = options.model || this.getDefaultModel();
    const contents = this.formatContents(messages);

    const config: any = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      config.maxOutputTokens = options.maxTokens;
    }

    const formattedTools = this.formatFunctionDeclarations(options.tools);
    if (formattedTools) {
      config.tools = formattedTools;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const text = response.text || '';
    const toolCalls = response.functionCalls?.map((fc) => ({
      id: fc.id || `call_${Date.now()}`,
      name: fc.name,
      arguments: fc.args,
    }));

    return { text, toolCalls };
  }
}
