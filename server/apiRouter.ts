import express, { Request, Response } from 'express';
import { ProviderFactory } from './ai/providerFactory.js';
import { toolsRegistry, getToolByName, getAllToolDefinitions } from './tools/index.js';
import { AgentOrchestrator } from './agent/agentLoop.js';
import { ChatMessageParam } from './ai/types.js';

export const apiRouter = express.Router();

// Parse JSON bodies
apiRouter.use(express.json({ limit: '25mb' }));

// System status and configuration check
apiRouter.get('/status', (req: Request, res: Response) => {
  const status = ProviderFactory.getStatus();
  res.json({
    status: 'online',
    systemName: 'NEXUS Personal AI OS',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    ...status,
  });
});

// Tools listing
apiRouter.get('/tools', (req: Request, res: Response) => {
  res.json({
    tools: getAllToolDefinitions(),
  });
});

// Direct Tool Execution
apiRouter.post('/tools/execute', async (req: Request, res: Response) => {
  try {
    const { toolName, args, context } = req.body;
    if (!toolName) {
      res.status(400).json({ error: 'toolName is required' });
      return;
    }

    const tool = getToolByName(toolName);
    if (!tool) {
      res.status(404).json({ error: `Tool "${toolName}" not found` });
      return;
    }

    const result = await tool.execute(args || {}, context);
    res.json({ success: true, toolName, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Tool execution failed' });
  }
});

// Chat & Agent streaming endpoint
apiRouter.post('/chat', async (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      messages = [],
      provider: requestedProvider,
      model,
      temperature = 0.7,
      maxTokens,
      systemPrompt,
      memoryItems = [],
      uploadedFiles = [],
      agentMode = false,
      toolPermissions = {},
    } = req.body;

    const provider = ProviderFactory.getProvider(requestedProvider);

    if (!provider.isConfigured()) {
      const isOaiOrGroq = provider.id === 'groq' || provider.id === 'openai';
      const keyName = isOaiOrGroq ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
      sendEvent('error', {
        error: `Provider "${provider.name}" is not configured. Please set ${keyName} in your environment variables, or configure Settings to switch to an active provider.`,
      });
      res.end();
      return;
    }

    // Build enhanced system instructions with Memory injection
    let effectiveSystemInstruction = systemPrompt || 'You are NEXUS, an advanced modular personal AI operating system.';
    
    if (memoryItems && memoryItems.length > 0) {
      const factsText = memoryItems.map((m: any) => `- [${m.category?.toUpperCase() || 'FACT'}] ${m.key}: ${m.value}`).join('\n');
      effectiveSystemInstruction += `\n\n--- USER LONG-TERM MEMORY (PERSISTENT FACTS & PREFERENCES) ---\n${factsText}\nAdopt these preferences and refer to these facts naturally when relevant.`;
    }

    if (uploadedFiles && uploadedFiles.length > 0) {
      const filesOverview = uploadedFiles.map((f: any) => `- ${f.name} (${f.type}, ${f.size} bytes)`).join('\n');
      effectiveSystemInstruction += `\n\n--- ATTACHED SESSION FILES ---\n${filesOverview}\nYou have access to the file_reader tool to inspect details from these files when asked.`;
    }

    // Convert client messages to server format
    const serverMessages: ChatMessageParam[] = messages.map((m: any) => {
      const images: Array<{ mimeType: string; data: string }> = [];

      if (m.attachments) {
        for (const att of m.attachments) {
          if (att.base64 && att.type.startsWith('image/')) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            images.push({
              mimeType: att.type,
              data: cleanBase64,
            });
          }
        }
      }

      return {
        role: m.role,
        content: m.content,
        images: images.length > 0 ? images : undefined,
      };
    });

    const context = {
      uploadedFiles,
      sessionMemories: memoryItems,
    };

    // If agent mode is toggled, use Agent Orchestrator with planning loop
    if (agentMode) {
      const orchestrator = new AgentOrchestrator(provider);
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';

      await orchestrator.run(
        lastUserMsg,
        serverMessages,
        {
          model: model || provider.getDefaultModel(),
          temperature,
          maxTokens,
          systemInstruction: effectiveSystemInstruction,
        },
        {
          maxIterations: 5,
          timeoutMs: 45000,
          toolPermissions,
          context,
        },
        {
          onStep: (step) => sendEvent('agent_step', step),
          onChunk: (chunk) => sendEvent('chunk', { text: chunk }),
          onError: (err) => sendEvent('error', { error: err.message }),
          onComplete: (finalMessage, steps) => {
            sendEvent('done', { fullText: finalMessage, steps });
            res.end();
          },
        }
      );
    } else {
      // Direct streaming mode with tool calling
      const allowedTools = toolsRegistry.filter((t) => toolPermissions[t.name] !== false);
      const toolDefs = allowedTools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

      sendEvent('status', { message: `Connected to ${provider.name} (${model || provider.getDefaultModel()})` });

      await provider.streamChat(
        serverMessages,
        {
          model: model || provider.getDefaultModel(),
          temperature,
          maxTokens,
          systemInstruction: effectiveSystemInstruction,
          tools: toolDefs.length > 0 ? toolDefs : undefined,
        },
        {
          onChunk: (chunk) => {
            sendEvent('chunk', { text: chunk });
          },
          onToolCall: async (toolCall) => {
            sendEvent('tool_call', {
              id: toolCall.id,
              name: toolCall.name,
              arguments: toolCall.arguments,
              status: 'running',
            });

            const tool = getToolByName(toolCall.name);
            let result: any;
            if (!tool) {
              result = { error: `Tool ${toolCall.name} not found` };
            } else {
              try {
                result = await tool.execute(toolCall.arguments, context);
              } catch (toolErr: any) {
                result = { error: toolErr.message };
              }
            }

            sendEvent('tool_result', {
              id: toolCall.id,
              name: toolCall.name,
              result,
              status: result?.error ? 'failed' : 'completed',
            });
          },
          onError: (err) => {
            sendEvent('error', { error: err.message });
            res.end();
          },
          onComplete: (fullText) => {
            sendEvent('done', { fullText });
            res.end();
          },
        }
      );
    }
  } catch (err: any) {
    sendEvent('error', { error: err.message || 'Internal server error occurred' });
    res.end();
  }
});
