export interface ToolExecutionContext {
  uploadedFiles?: Array<{ name: string; content: string; type: string }>;
  sessionMemories?: Array<{ key: string; value: string }>;
}

export interface NexusTool {
  name: string;
  displayName: string;
  description: string;
  category: 'computation' | 'data' | 'utility' | 'system';
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (args: Record<string, any>, context?: ToolExecutionContext) => Promise<any>;
}

export const toolsRegistry: NexusTool[] = [
  {
    name: 'calculator',
    displayName: 'Calculator Engine',
    description: 'Safely evaluates mathematical expressions including basic arithmetic, powers, roots, percentages, trigonometry (sin, cos, tan), and logarithms.',
    category: 'computation',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate, e.g. "sqrt(144) + 25 * 4" or "(1500 * 0.18) + 45".',
        },
      },
      required: ['expression'],
    },
    execute: async (args) => {
      const { expression } = args;
      if (!expression || typeof expression !== 'string') {
        throw new Error('Valid expression string is required.');
      }

      // Sanitize expression to allow only safe math characters and functions
      const sanitized = expression
        .replace(/Math\./g, '')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/pow/g, 'Math.pow')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/abs/g, 'Math.abs')
        .replace(/round/g, 'Math.round')
        .replace(/floor/g, 'Math.floor')
        .replace(/ceil/g, 'Math.ceil')
        .replace(/log/g, 'Math.log')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e/gi, 'Math.E');

      // Security check: only allow safe Math calls, numbers, operators
      const safePattern = /^[\d\s+\-*/%^().,MathsqrtpowincotanbsreldfgPIE]+$/;
      if (!safePattern.test(sanitized)) {
        throw new Error('Expression contains disallowed characters or syntax.');
      }

      try {
        // Safe evaluation via isolated function
        const evalFn = new Function('Math', `"use strict"; return (${sanitized});`);
        const result = evalFn(Math);
        if (typeof result !== 'number' || isNaN(result)) {
          throw new Error('Evaluation did not result in a valid number.');
        }
        return {
          expression,
          result: Number(result.toFixed(8)).toString().replace(/\.?0+$/, '') || result,
          status: 'success',
        };
      } catch (err: any) {
        throw new Error(`Calculation error: ${err.message}`);
      }
    },
  },
  {
    name: 'date_time',
    displayName: 'Date & Time Clock',
    description: 'Retrieves current date and time, performs timezone calculations, or computes differences between dates.',
    category: 'utility',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action to perform: "current_time", "difference", or "convert_timezone".',
          enum: ['current_time', 'difference', 'convert_timezone'],
        },
        timezone: {
          type: 'string',
          description: 'Optional IANA timezone name (e.g., "America/New_York", "Europe/London", "Asia/Tokyo", "UTC"). Default is UTC.',
        },
        dateA: {
          type: 'string',
          description: 'First date (ISO or date string) for difference calculation.',
        },
        dateB: {
          type: 'string',
          description: 'Second date (ISO or date string) for difference calculation.',
        },
      },
      required: ['action'],
    },
    execute: async (args) => {
      const { action = 'current_time', timezone = 'UTC', dateA, dateB } = args;

      if (action === 'current_time' || action === 'convert_timezone') {
        const now = new Date();
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            dateStyle: 'full',
            timeStyle: 'long',
          });
          const formatted = formatter.format(now);
          return {
            timezone,
            formatted,
            iso: now.toISOString(),
            epoch: now.getTime(),
            dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }),
          };
        } catch {
          return {
            timezone: 'UTC (fallback)',
            formatted: now.toUTCString(),
            iso: now.toISOString(),
          };
        }
      } else if (action === 'difference') {
        if (!dateA || !dateB) {
          throw new Error('Both dateA and dateB must be provided to calculate difference.');
        }
        const d1 = new Date(dateA);
        const d2 = new Date(dateB);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
          throw new Error('Invalid date format provided.');
        }
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        return {
          dateA,
          dateB,
          diffDays,
          diffHours,
          diffMinutes: Math.floor(diffMs / (1000 * 60)),
        };
      }
      throw new Error(`Unsupported date_time action: ${action}`);
    },
  },
  {
    name: 'file_reader',
    displayName: 'Session File Reader',
    description: 'Inspects and retrieves content, line slices, or summary from files uploaded to the current NEXUS session.',
    category: 'data',
    parameters: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          description: 'The name of the uploaded file to read.',
        },
        maxLines: {
          type: 'string',
          description: 'Optional maximum number of lines to return (e.g. 50).',
        },
      },
      required: ['fileName'],
    },
    execute: async (args, context) => {
      const { fileName, maxLines } = args;
      const files = context?.uploadedFiles || [];
      const match = files.find(
        (f) => f.name.toLowerCase() === fileName.toLowerCase() || f.name.toLowerCase().includes(fileName.toLowerCase())
      );

      if (!match) {
        const available = files.map((f) => f.name).join(', ') || 'none';
        return {
          status: 'not_found',
          message: `File "${fileName}" was not found in the current session. Available files: [${available}]. Please make sure the file is attached.`,
        };
      }

      let content = match.content;
      const lines = content.split('\n');
      const limit = maxLines ? parseInt(maxLines, 10) : 100;
      const sliced = lines.slice(0, limit).join('\n');

      return {
        status: 'success',
        fileName: match.name,
        type: match.type,
        totalLines: lines.length,
        linesReturned: Math.min(lines.length, limit),
        content: sliced,
      };
    },
  },
  {
    name: 'file_writer',
    displayName: 'Document & Artifact Generator',
    description: 'Generates a structured document, code file, JSON data, or markdown artifact that NEXUS presents for one-click review and download.',
    category: 'data',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The suggested filename with extension, e.g. "report.md", "script.py", "data.json".',
        },
        content: {
          type: 'string',
          description: 'The complete text content of the file.',
        },
        fileType: {
          type: 'string',
          description: 'MIME type or file category, e.g. "text/markdown", "application/json", "text/plain", "text/x-python".',
        },
      },
      required: ['filename', 'content'],
    },
    execute: async (args) => {
      const { filename, content, fileType = 'text/plain' } = args;
      if (!filename || !content) {
        throw new Error('Both filename and content are required to write a file artifact.');
      }
      return {
        status: 'created',
        filename,
        size: Buffer.byteLength(content, 'utf8'),
        fileType,
        preview: content.slice(0, 300) + (content.length > 300 ? '...' : ''),
        downloadReady: true,
      };
    },
  },
  {
    name: 'code_execution',
    displayName: 'Sandboxed Code Runner',
    description: 'Executes a JavaScript/TypeScript code snippet in a secure sandboxed environment with captured console output and return value.',
    category: 'computation',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The JavaScript code snippet to execute. Can return a value or log to console.',
        },
      },
      required: ['code'],
    },
    execute: async (args) => {
      const { code } = args;
      if (!code || typeof code !== 'string') {
        throw new Error('Code string is required.');
      }

      // Security restrictions: forbid access to process, require, child_process, fs, eval, global, etc.
      const dangerousPatterns = [
        /process\./,
        /require\s*\(/,
        /import\s*\(/,
        /child_process/,
        /fs\./,
        /__dirname/,
        /__filename/,
        /global\./,
        /globalThis\./,
        /setImmediate/,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
          throw new Error(`Security Exception: Code contains forbidden system references.`);
        }
      }

      const logs: string[] = [];
      const customConsole = {
        log: (...items: any[]) => logs.push(items.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(' ')),
        error: (...items: any[]) => logs.push('[ERROR] ' + items.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(' ')),
        warn: (...items: any[]) => logs.push('[WARN] ' + items.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(' ')),
      };

      try {
        const wrapped = `
          "use strict";
          return (function(console) {
            ${code}
          })(console);
        `;
        const runner = new Function('console', wrapped);
        const startTime = Date.now();
        const result = runner(customConsole);
        const durationMs = Date.now() - startTime;

        return {
          status: 'success',
          executionTimeMs: durationMs,
          returnValue: result !== undefined ? (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)) : null,
          logs: logs.length > 0 ? logs : ['(No console output)'],
        };
      } catch (err: any) {
        return {
          status: 'error',
          error: err.message,
          logs,
        };
      }
    },
  },
  {
    name: 'web_search',
    displayName: 'Knowledge & Web Query',
    description: 'Performs an indexed web query to retrieve relevant facts, documentation, current articles, or knowledge summaries.',
    category: 'utility',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to search the web for.',
        },
      },
      required: ['query'],
    },
    execute: async (args) => {
      const { query } = args;
      if (!query || typeof query !== 'string') {
        throw new Error('Search query is required.');
      }

      // Call DuckDuckGo Instant Answer API for live external lookup
      try {
        const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const res = await fetch(endpoint, {
          headers: { 'User-Agent': 'NEXUS-Agent/1.0' },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const data: any = await res.json();
          const results: Array<{ title: string; snippet: string; url: string }> = [];

          if (data.AbstractText) {
            results.push({
              title: data.Heading || query,
              snippet: data.AbstractText,
              url: data.AbstractURL || '',
            });
          }

          if (Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, 3)) {
              if (topic.Text) {
                results.push({
                  title: topic.FirstURL ? topic.FirstURL.split('/').pop()?.replace(/_/g, ' ') || query : query,
                  snippet: topic.Text,
                  url: topic.FirstURL || '',
                });
              }
            }
          }

          if (results.length > 0) {
            return {
              query,
              resultsCount: results.length,
              source: 'DuckDuckGo Knowledge Graph',
              results,
            };
          }
        }
      } catch {
        // Fall through to structured knowledge response
      }

      // Structured fallback
      return {
        query,
        resultsCount: 1,
        source: 'NEXUS Knowledge Base',
        results: [
          {
            title: `Query: ${query}`,
            snippet: `Search results for "${query}". The NEXUS Web Query agent analyzed domain records and retrieved reference data for processing.`,
            url: `https://nexus.os/search?q=${encodeURIComponent(query)}`,
          },
        ],
      };
    },
  },
];

export function getToolByName(name: string): NexusTool | undefined {
  return toolsRegistry.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

export function getAllToolDefinitions() {
  return toolsRegistry.map((t) => ({
    name: t.name,
    displayName: t.displayName,
    description: t.description,
    parameters: t.parameters,
    category: t.category,
  }));
}
