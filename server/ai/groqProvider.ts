import { AIProvider, ChatMessageParam, GenerateOptions, StreamCallbacks } from './types.js';
import { openAIService, OpenAIService } from './openai.js';

export class GroqProvider implements AIProvider {
  id = 'groq';
  name = 'Groq';
  private service: OpenAIService;

  constructor(service: OpenAIService = openAIService) {
    this.service = service;
  }

  isConfigured(): boolean {
    return this.service.isConfigured();
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

  async streamChat(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    callbacks: StreamCallbacks
  ): Promise<void> {
    return this.service.streamChat(
      messages,
      {
        ...options,
        model: options.model || this.getDefaultModel(),
      },
      callbacks,
      true
    );
  }

  async generateResponse(
    messages: ChatMessageParam[],
    options: GenerateOptions
  ): Promise<{ text: string; toolCalls?: Array<{ id: string; name: string; arguments: any }> }> {
    return this.service.generateResponse(
      messages,
      {
        ...options,
        model: options.model || this.getDefaultModel(),
      },
      true
    );
  }
}
