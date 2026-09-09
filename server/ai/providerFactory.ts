import { AIProvider } from './types.js';
import { GroqProvider } from './groqProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { openAIService } from './openai.js';

export class ProviderFactory {
  private static providers: Map<string, AIProvider> = new Map<string, AIProvider>([
    ['groq', new GroqProvider()],
    ['openai', new OpenAIProvider()],
    ['gemini', new GeminiProvider()],
  ]);

  static getProvider(providerId?: string): AIProvider {
    // If specifically requested 'groq'
    if (providerId === 'groq') {
      return this.providers.get('groq')!;
    }

    // If 'openai' was requested but key/config is Groq, route to GroqProvider
    if (providerId === 'openai') {
      if (openAIService.isGroq()) {
        return this.providers.get('groq')!;
      }
      return this.providers.get('openai')!;
    }

    if (providerId && this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }

    // Default to Groq as primary provider for NEXUS
    const groq = this.providers.get('groq')!;
    if (groq.isConfigured()) {
      return groq;
    }

    const gemini = this.providers.get('gemini')!;
    if (gemini.isConfigured()) {
      return gemini;
    }

    return groq;
  }

  static getStatus() {
    const groq = this.providers.get('groq')!;
    const openai = this.providers.get('openai')!;
    const gemini = this.providers.get('gemini')!;

    const groqConfigured = groq.isConfigured();
    const openaiConfigured = openai.isConfigured();
    const geminiConfigured = gemini.isConfigured();

    // Default provider for NEXUS is Groq
    const defaultProvider = 'groq';

    return {
      groqConfigured,
      openaiConfigured,
      geminiConfigured,
      defaultProvider,
      activeProvider: 'groq',
      activeModel: groq.getDefaultModel(),
      providerName: 'Groq',
      providers: [
        {
          id: groq.id,
          name: groq.name,
          configured: groqConfigured,
          defaultModel: groq.getDefaultModel(),
          models: groq.listModels(),
        },
        {
          id: openai.id,
          name: openai.name,
          configured: openaiConfigured,
          defaultModel: openai.getDefaultModel(),
          models: openai.listModels(),
        },
        {
          id: gemini.id,
          name: gemini.name,
          configured: geminiConfigured,
          defaultModel: gemini.getDefaultModel(),
          models: gemini.listModels(),
        },
      ],
    };
  }
}
