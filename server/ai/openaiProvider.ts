import { AIProvider, ChatMessageParam, GenerateOptions, StreamCallbacks } from './types.js';
import { openAIService, OpenAIService } from './openai.js';

export class OpenAIProvider implements AIProvider {
  id = 'openai';
  name = 'OpenAI';
  private service: OpenAIService;

  constructor(service: OpenAIService = openAIService) {
    this.service = service;
  }

  isConfigured(): boolean {
    return this.service.isConfigured();
  }

  getDefaultModel(): string {
    return this.service.getDefaultModel();
  }

  listModels(): string[] {
    return this.service.listModels();
  }

  async streamChat(
    messages: ChatMessageParam[],
    options: GenerateOptions,
    callbacks: StreamCallbacks
  ): Promise<void> {
    return this.service.streamChat(messages, options, callbacks);
  }

  async generateResponse(
    messages: ChatMessageParam[],
    options: GenerateOptions
  ): Promise<{ text: string; toolCalls?: Array<{ id: string; name: string; arguments: any }> }> {
    return this.service.generateResponse(messages, options);
  }
}
