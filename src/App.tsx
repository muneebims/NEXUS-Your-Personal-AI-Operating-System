import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { ChatArea } from './components/ChatArea.js';
import { MessageInput } from './components/MessageInput.js';
import { AgentPanel } from './components/AgentPanel.js';
import { MemoryModal } from './components/MemoryModal.js';
import { FilesModal } from './components/FilesModal.js';
import { ToolsModal } from './components/ToolsModal.js';
import { SettingsModal } from './components/SettingsModal.js';

import {
  Conversation,
  Message,
  FileAttachment,
  MemoryItem,
  NexusToolDefinition,
  AppSettings,
  SystemStatus,
  ToolCall,
  AgentStep,
} from './types/nexus.js';

import { storage, defaultSettings } from './services/storage.js';
import { apiClient } from './services/apiClient.js';

export default function App() {
  // Application State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [sessionFiles, setSessionFiles] = useState<FileAttachment[]>([]);
  const [tools, setTools] = useState<NexusToolDefinition[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'files' | 'tools' | 'settings'>('chat');
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [selectedInspectFile, setSelectedInspectFile] = useState<FileAttachment | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Agent execution tracking
  const [currentTask, setCurrentTask] = useState<string>('');
  const [recentAgentSteps, setRecentAgentSteps] = useState<AgentStep[]>([]);

  // Abort controller for streaming
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize data on mount
  useEffect(() => {
    // Load local storage data
    const savedSettings = storage.getSettings();
    setSettings(savedSettings);

    const savedMemories = storage.getMemories();
    setMemories(savedMemories);

    const savedFiles = storage.getFiles();
    setSessionFiles(savedFiles);

    const savedConvs = storage.getConversations();
    if (savedConvs.length > 0) {
      setConversations(savedConvs);
      const lastActiveId = storage.getActiveConversationId();
      if (lastActiveId && savedConvs.some((c) => c.id === lastActiveId)) {
        setActiveConversationId(lastActiveId);
      } else {
        setActiveConversationId(savedConvs[0].id);
      }
    } else {
      // Create initial conversation
      const initialConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: 'Initial Session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations([initialConv]);
      setActiveConversationId(initialConv.id);
      storage.saveConversations([initialConv]);
      storage.setActiveConversationId(initialConv.id);
    }

    // Fetch server status & registered tools
    apiClient
      .getStatus()
      .then((status) => {
        setSystemStatus(status);
        // Default to Groq provider for main AI chat
        if (status.groqConfigured || status.openaiConfigured || !localStorage.getItem('nexus_settings_v1')) {
          setSettings((prev) => ({
            ...prev,
            provider: 'groq',
            groqModel: prev.groqModel || 'openai/gpt-oss-20b',
          }));
        }
      })
      .catch((err) => console.warn('Could not fetch initial status:', err));

    apiClient
      .getTools()
      .then((data) => {
        setTools(data.tools || []);
      })
      .catch((err) => console.warn('Could not fetch tools:', err));
  }, []);

  // Save conversations whenever updated
  const updateConversations = (newConvs: Conversation[]) => {
    setConversations(newConvs);
    storage.saveConversations(newConvs);
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  ) || conversations[0];

  // Conversation Management
  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const updated = [newConv, ...conversations];
    updateConversations(updated);
    setActiveConversationId(newConv.id);
    storage.setActiveConversationId(newConv.id);
    setCurrentTask('');
    setRecentAgentSteps([]);
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fresh: Conversation = {
        id: `conv_${Date.now()}`,
        title: 'New Session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      updateConversations([fresh]);
      setActiveConversationId(fresh.id);
      storage.setActiveConversationId(fresh.id);
    } else {
      updateConversations(remaining);
      if (activeConversationId === id) {
        setActiveConversationId(remaining[0].id);
        storage.setActiveConversationId(remaining[0].id);
      }
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
    );
    updateConversations(updated);
  };

  const handleTogglePinConversation = (id: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    updateConversations(updated);
  };

  const handleClearAllConversations = () => {
    storage.clearConversations();
    const fresh: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations([fresh]);
    setActiveConversationId(fresh.id);
    storage.setActiveConversationId(fresh.id);
  };

  // Memory Management
  const handleAddMemory = (
    key: string,
    value: string,
    category: MemoryItem['category'] = 'fact',
    sourceMsgId?: string
  ) => {
    const newMem = storage.addMemory(key, value, category, sourceMsgId);
    setMemories(storage.getMemories());
    return newMem;
  };

  const handleDeleteMemory = (id: string) => {
    storage.deleteMemory(id);
    setMemories(storage.getMemories());
  };

  const handleClearAllMemories = () => {
    storage.clearMemories();
    setMemories([]);
  };

  const handleQuickRemember = (content: string) => {
    // Extract key idea from first line or sentence
    const firstLine = content.split('\n')[0].replace(/[#*`_]/g, '').trim();
    const key = firstLine.length > 50 ? `${firstLine.slice(0, 48)}...` : firstLine || 'Saved Insight';
    handleAddMemory(key, content.slice(0, 500), 'fact');
    setIsMemoriesOpen(true);
  };

  // Files Management
  const handleDeleteFile = (id: string) => {
    storage.deleteFile(id);
    setSessionFiles(storage.getFiles());
  };

  const handleAskAboutFile = (file: FileAttachment) => {
    // Inject prompt asking about the file
    handleSendMessage(`Please inspect the file "${file.name}" and provide a summary of its contents and key insights.`, [file]);
  };

  // Settings Management
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleToggleToolPermission = (toolName: string) => {
    const current = settings.toolPermissions[toolName] !== false;
    const updatedPermissions = {
      ...settings.toolPermissions,
      [toolName]: !current,
    };
    handleSaveSettings({
      ...settings,
      toolPermissions: updatedPermissions,
    });
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send Message Flow
  const handleSendMessage = async (
    text: string,
    newAttachments: FileAttachment[] = []
  ) => {
    if ((!text.trim() && newAttachments.length === 0) || isStreaming) return;

    // Persist any uploaded files into session files store
    if (newAttachments.length > 0) {
      const updatedFiles = [...newAttachments, ...sessionFiles];
      setSessionFiles(updatedFiles);
      storage.saveFiles(updatedFiles);
    }

    // Set current active task
    setCurrentTask(text || (newAttachments.length > 0 ? `Uploaded ${newAttachments[0].name}` : ''));
    setRecentAgentSteps([]);

    const userMessageId = `msg_${Date.now()}_user`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: text,
      attachments: newAttachments.length > 0 ? newAttachments : undefined,
      timestamp: Date.now(),
    };

    const assistantMessageId = `msg_${Date.now() + 1}_assistant`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
      toolCalls: [],
      agentSteps: [],
    };

    // Auto update conversation title if it's the first user message
    const currentMessages = activeConversation?.messages || [];
    let newTitle = activeConversation?.title || 'Session';
    if (currentMessages.length === 0 && text.trim()) {
      newTitle = text.slice(0, 32).trim() + (text.length > 32 ? '...' : '');
    }

    const updatedMessages = [...currentMessages, userMessage, assistantMessage];
    const updatedConversation: Conversation = {
      ...activeConversation,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    const updatedConvs = conversations.map((c) =>
      c.id === updatedConversation.id ? updatedConversation : c
    );
    updateConversations(updatedConvs);

    // Prepare API chat call
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    let accumulatedContent = '';
    const activeToolCalls: ToolCall[] = [];
    const activeSteps: AgentStep[] = [];

    try {
      await apiClient.streamChat({
        messages: updatedMessages.slice(0, -1), // send all messages up to current user message
        provider: settings.provider,
        model:
          settings.provider === 'groq'
            ? settings.groqModel || 'openai/gpt-oss-20b'
            : settings.provider === 'openai'
            ? settings.openaiModel
            : settings.geminiModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        systemPrompt: settings.systemPrompt,
        memoryItems: settings.memoryEnabled ? memories : [],
        uploadedFiles: sessionFiles,
        agentMode: settings.agentMode,
        toolPermissions: settings.toolPermissions,
        signal: abortControllerRef.current.signal,

        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setConversations((prevConvs) =>
            prevConvs.map((conv) => {
              if (conv.id !== updatedConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedContent, isStreaming: true }
                    : m
                ),
              };
            })
          );
        },

        onToolCall: (tc) => {
          const newToolCall: ToolCall = {
            id: tc.id,
            name: tc.name,
            arguments: tc.arguments,
            status: 'running',
            executedAt: Date.now(),
          };
          activeToolCalls.push(newToolCall);

          setConversations((prevConvs) =>
            prevConvs.map((conv) => {
              if (conv.id !== updatedConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, toolCalls: [...activeToolCalls] }
                    : m
                ),
              };
            })
          );
        },

        onToolResult: (tc) => {
          const targetIndex = activeToolCalls.findIndex((t) => t.id === tc.id);
          if (targetIndex >= 0) {
            activeToolCalls[targetIndex] = {
              ...activeToolCalls[targetIndex],
              result: tc.result,
              status: tc.status,
            };
          } else {
            activeToolCalls.push(tc);
          }

          setConversations((prevConvs) =>
            prevConvs.map((conv) => {
              if (conv.id !== updatedConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, toolCalls: [...activeToolCalls] }
                    : m
                ),
              };
            })
          );
        },

        onAgentStep: (step) => {
          activeSteps.push(step);
          setRecentAgentSteps([...activeSteps]);

          setConversations((prevConvs) =>
            prevConvs.map((conv) => {
              if (conv.id !== updatedConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, agentSteps: [...activeSteps] }
                    : m
                ),
              };
            })
          );
        },

        onError: (err) => {
          setIsStreaming(false);
          const errorMsg = `\n\n[NEXUS Alert]: ${err}`;
          accumulatedContent += errorMsg;

          setConversations((prevConvs) => {
            const finalConvs = prevConvs.map((conv) => {
              if (conv.id !== updatedConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        isStreaming: false,
                        error: err,
                      }
                    : m
                ),
              };
            });
            storage.saveConversations(finalConvs);
            return finalConvs;
          });
        },

        onDone: (fullText) => {
          setIsStreaming(false);
          const finalText = fullText || accumulatedContent || 'Response completed.';

          setConversations((prevConvs) => {
            const finalConvs = prevConvs.map((conv) => {
              if (conv.id !== updatedConversation.id) return conv;
              return {
                ...conv,
                updatedAt: Date.now(),
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: finalText,
                        isStreaming: false,
                        toolCalls: activeToolCalls.length > 0 ? activeToolCalls : undefined,
                        agentSteps: activeSteps.length > 0 ? activeSteps : undefined,
                      }
                    : m
                ),
              };
            });
            storage.saveConversations(finalConvs);
            return finalConvs;
          });
        },
      });
    } catch (err: any) {
      setIsStreaming(false);
      console.error('Chat error:', err);
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (isStreaming || !activeConversation) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    // Find last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUserMsg = msgs[lastUserIndex];
    // Trim conversation up to the last user message
    const trimmed = msgs.slice(0, lastUserIndex);
    const updatedConv: Conversation = {
      ...activeConversation,
      messages: trimmed,
    };
    const updatedConvs = conversations.map((c) =>
      c.id === updatedConv.id ? updatedConv : c
    );
    updateConversations(updatedConvs);

    // Resend message
    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
  };

  const activeToolsCount = Object.values(settings.toolPermissions).filter(
    (v) => v !== false
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090e] text-slate-100 antialiased font-sans">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'memory') setIsMemoriesOpen(true);
          else if (tab === 'files') setIsFilesOpen(true);
          else if (tab === 'tools') setIsToolsOpen(true);
          else if (tab === 'settings') setIsSettingsOpen(true);
        }}
        memoriesCount={memories.length}
        filesCount={sessionFiles.length}
      />

      {/* Main Center Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#07090e] relative overflow-hidden">
        {/* Top Header */}
        <Header
          settings={settings}
          systemStatus={systemStatus}
          agentMode={settings.agentMode}
          onToggleAgentMode={() =>
            handleSaveSettings({
              ...settings,
              agentMode: !settings.agentMode,
            })
          }
          showRightPanel={showRightPanel}
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMemories={() => setIsMemoriesOpen(true)}
          onOpenTools={() => setIsToolsOpen(true)}
          onNewChat={handleNewConversation}
          memoriesCount={memories.length}
          activeToolsCount={activeToolsCount}
        />

        {/* Chat Thread Messages */}
        <ChatArea
          messages={activeConversation?.messages || []}
          conversationTitle={activeConversation?.title || 'Session'}
          isStreaming={isStreaming}
          onRegenerate={handleRegenerate}
          onStopGeneration={handleStopGeneration}
          onRememberMessage={handleQuickRemember}
          onPromptPreset={(preset) => handleSendMessage(preset)}
          activeModelName={
            settings.provider === 'openai'
              ? settings.openaiModel
              : settings.geminiModel
          }
        />

        {/* Bottom Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopGeneration={handleStopGeneration}
          activeToolsCount={activeToolsCount}
          onOpenTools={() => setIsToolsOpen(true)}
        />
      </main>

      {/* Right-Side Agent Inspector Panel */}
      {showRightPanel && (
        <AgentPanel
          currentTask={currentTask}
          recentSteps={recentAgentSteps}
          tools={tools}
          toolPermissions={settings.toolPermissions}
          sessionFiles={sessionFiles}
          activeMemories={memories}
          agentMode={settings.agentMode}
          onToggleToolPermission={handleToggleToolPermission}
          onSelectFile={(f) => {
            setSelectedInspectFile(f);
            setIsFilesOpen(true);
          }}
        />
      )}

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          systemStatus={systemStatus}
          tools={tools}
          onSaveSettings={handleSaveSettings}
          onClearConversations={handleClearAllConversations}
          onClearMemories={handleClearAllMemories}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isMemoriesOpen && (
        <MemoryModal
          memories={memories}
          onAddMemory={(key, val, cat) => handleAddMemory(key, val, cat)}
          onDeleteMemory={handleDeleteMemory}
          onClearMemories={handleClearAllMemories}
          onClose={() => setIsMemoriesOpen(false)}
        />
      )}

      {isFilesOpen && (
        <FilesModal
          files={sessionFiles}
          onDeleteFile={handleDeleteFile}
          onAskAboutFile={handleAskAboutFile}
          onClose={() => setIsFilesOpen(false)}
        />
      )}

      {isToolsOpen && (
        <ToolsModal
          tools={tools}
          toolPermissions={settings.toolPermissions}
          onToggleToolPermission={handleToggleToolPermission}
          onClose={() => setIsToolsOpen(false)}
        />
      )}
    </div>
  );
}
