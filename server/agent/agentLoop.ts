import { AIProvider, ChatMessageParam, GenerateOptions } from '../ai/types.js';
import { getToolByName, toolsRegistry, ToolExecutionContext } from '../tools/index.js';

export interface AgentStepOutput {
  stepNumber: number;
  stage: 'PLAN' | 'SELECT_TOOL' | 'EXECUTE_TOOL' | 'OBSERVE' | 'DECIDE' | 'COMPLETE';
  thought: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: any;
    result?: any;
    error?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  };
}

export interface AgentRunCallbacks {
  onStep: (step: AgentStepOutput) => void;
  onChunk: (text: string) => void;
  onError: (error: Error) => void;
  onComplete: (finalMessage: string, steps: AgentStepOutput[]) => void;
}

export interface AgentRunConfig {
  maxIterations?: number;
  timeoutMs?: number;
  toolPermissions?: Record<string, boolean>;
  context?: ToolExecutionContext;
  systemPrompt?: string;
}

export class AgentOrchestrator {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  async run(
    userPrompt: string,
    history: ChatMessageParam[],
    options: GenerateOptions,
    config: AgentRunConfig,
    callbacks: AgentRunCallbacks
  ): Promise<void> {
    const maxIterations = Math.min(config.maxIterations || 5, 8);
    const timeoutMs = config.timeoutMs || 30000;
    const permissions = config.toolPermissions || {};
    const steps: AgentStepOutput[] = [];

    // Filter tools enabled by permissions
    const allowedTools = toolsRegistry.filter((t) => permissions[t.name] !== false);
    const toolDefinitions = allowedTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));

    // Step 1: Initial Planning step
    const planStep: AgentStepOutput = {
      stepNumber: 1,
      stage: 'PLAN',
      thought: `Analyzing user intent: "${userPrompt.slice(0, 80)}${userPrompt.length > 80 ? '...' : ''}". Assessing available tools [${allowedTools.map((t) => t.name).join(', ')}] and execution path.`,
    };
    steps.push(planStep);
    callbacks.onStep(planStep);

    let iteration = 0;
    let completed = false;
    let finalAnswer = '';

    const currentMessages: ChatMessageParam[] = [...history];

    // Build system instruction enforcing agent loop and tool use
    const baseSystem = options.systemInstruction || 'You are NEXUS, an advanced modular personal AI operating system.';
    const agentSystemInstruction = `${baseSystem}
When appropriate, use the available tools to verify facts, calculate math, read uploaded files, write documents, query dates, or run sandbox code.
Explain your reasoning concisely.`;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      while (iteration < maxIterations && !completed) {
        iteration++;

        // Call provider with tools enabled
        const response = await this.provider.generateResponse(currentMessages, {
          ...options,
          systemInstruction: agentSystemInstruction,
          tools: toolDefinitions,
        });

        const hasToolCalls = response.toolCalls && response.toolCalls.length > 0;

        if (!hasToolCalls) {
          // No more tools needed, task complete!
          completed = true;
          finalAnswer = response.text || '';

          const completeStep: AgentStepOutput = {
            stepNumber: steps.length + 1,
            stage: 'COMPLETE',
            thought: 'Task objectives satisfied. Formulating final response.',
          };
          steps.push(completeStep);
          callbacks.onStep(completeStep);
          callbacks.onChunk(finalAnswer);
          break;
        }

        // Handle tool calls in this iteration
        for (const tc of response.toolCalls!) {
          const selectStep: AgentStepOutput = {
            stepNumber: steps.length + 1,
            stage: 'SELECT_TOOL',
            thought: `Selected tool "${tc.name}" to address requirement.`,
            toolCall: {
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
              status: 'pending',
            },
          };
          steps.push(selectStep);
          callbacks.onStep(selectStep);

          const toolImpl = getToolByName(tc.name);
          if (!toolImpl) {
            const errResult = `Tool "${tc.name}" is not recognized by NEXUS.`;
            const observeStep: AgentStepOutput = {
              stepNumber: steps.length + 1,
              stage: 'OBSERVE',
              thought: `Tool execution failed: ${errResult}`,
              toolCall: {
                id: tc.id,
                name: tc.name,
                arguments: tc.arguments,
                error: errResult,
                status: 'failed',
              },
            };
            steps.push(observeStep);
            callbacks.onStep(observeStep);

            currentMessages.push({
              role: 'assistant',
              content: response.text || `Executing tool ${tc.name}`,
            });
            currentMessages.push({
              role: 'tool',
              toolCallId: tc.id,
              toolName: tc.name,
              content: JSON.stringify({ error: errResult }),
            });
            continue;
          }

          if (permissions[tc.name] === false) {
            const permissionErr = `Tool "${tc.name}" is disabled in NEXUS Settings.`;
            const observeStep: AgentStepOutput = {
              stepNumber: steps.length + 1,
              stage: 'OBSERVE',
              thought: `Security safeguard: ${permissionErr}`,
              toolCall: {
                id: tc.id,
                name: tc.name,
                arguments: tc.arguments,
                error: permissionErr,
                status: 'failed',
              },
            };
            steps.push(observeStep);
            callbacks.onStep(observeStep);

            currentMessages.push({
              role: 'assistant',
              content: response.text || `Executing tool ${tc.name}`,
            });
            currentMessages.push({
              role: 'tool',
              toolCallId: tc.id,
              toolName: tc.name,
              content: JSON.stringify({ error: permissionErr }),
            });
            continue;
          }

          // Execute tool with safeguard
          const execStep: AgentStepOutput = {
            stepNumber: steps.length + 1,
            stage: 'EXECUTE_TOOL',
            thought: `Executing ${tc.name} with arguments: ${JSON.stringify(tc.arguments)}`,
            toolCall: {
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
              status: 'running',
            },
          };
          steps.push(execStep);
          callbacks.onStep(execStep);

          let toolOutput: any;
          try {
            toolOutput = await toolImpl.execute(tc.arguments, config.context);
          } catch (execErr: any) {
            toolOutput = { error: execErr.message || String(execErr) };
          }

          const observeStep: AgentStepOutput = {
            stepNumber: steps.length + 1,
            stage: 'OBSERVE',
            thought: `Observed tool output from ${tc.name}. Evaluating next step.`,
            toolCall: {
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
              result: toolOutput,
              status: toolOutput?.error ? 'failed' : 'completed',
            },
          };
          steps.push(observeStep);
          callbacks.onStep(observeStep);

          // Append to conversation history so model can see results
          currentMessages.push({
            role: 'assistant',
            content: response.text || `Tool executed: ${tc.name}`,
          });
          currentMessages.push({
            role: 'tool',
            toolCallId: tc.id,
            toolName: tc.name,
            content: JSON.stringify(toolOutput),
          });
        }
      }

      if (!completed && iteration >= maxIterations) {
        const safeguardNote = `\n\n*(NEXUS Agent Safeguard: Reached maximum iteration limit of ${maxIterations} steps to prevent infinite loop).*`;
        finalAnswer += safeguardNote;
        callbacks.onChunk(safeguardNote);
      }

      callbacks.onComplete(finalAnswer, steps);
    } catch (err: any) {
      callbacks.onError(err);
    } finally {
      clearTimeout(timer);
    }
  }
}
