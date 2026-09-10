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
import { StatusModal } from './components/StatusModal.js';

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

  // UI Navigation & View State - Agent drawer is closed by default for clean UX
  const [showRightPanel, setShowRightPanel] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [selectedInspectFile, setSelectedInspectFile] = useState<FileAttachment | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Agent execution tracking
  const [currentTask, setCurrentTask] = useState<string>('');
  const [recentAgentSteps, setRecentAgentSteps] = useState<AgentStep[]>([]);

  // Abort controller for streaming
  const abortControllerRef = useRef<AbortController | null>(null);

  // Real-time theme & accent synchronization
  useEffect(() => {
    const activeTheme = settings.theme || 'midnight';
    const activeAccent = settings.accent || 'cyan';
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-accent', activeAccent);
  }, [settings.theme, settings.accent]);

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
        title: 'New Session',
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
    setIsMobileSidebarOpen(false);
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
    handleSendMessage(`Please inspect the file "${file.name}" and provide a summary of its contents and key insights.`, [file]);
  };

  // Settings Management
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleToggleToolPermission = (toolName: string) => {
    const updated = {
      ...settings.toolPermissions,
      [toolName]: settings.toolPermissions[toolName] === false ? true : false,
    };
    handleSaveSettings({
      ...settings,
      toolPermissions: updated,
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

    // If agent mode is enabled, open the drawer automatically so user sees live execution
    if (settings.agentMode) {
      setShowRightPanel(true);
    }

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

    // Prepare full conversation messages including the current user message
    const fullConversationMessages = [...currentMessages, userMessage];
    const messagesPayload = fullConversationMessages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }));

    // Filter active memories
    const relevantMemories = settings.memoryEnabled ? memories : [];

    // Filter tools based on permissions
    const activeToolDefs = tools.filter(
      (t) => settings.toolPermissions[t.name] !== false
    );

    let accumulatedContent = '';
    const collectedToolCalls: ToolCall[] = [];
    const collectedAgentSteps: AgentStep[] = [];

    try {
      await apiClient.streamChat({
        messages: messagesPayload,
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
        memoryItems: relevantMemories,
        uploadedFiles: newAttachments.length > 0 ? newAttachments : undefined,
        agentMode: settings.agentMode,
        toolPermissions: settings.toolPermissions,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          accumulatedContent += chunk;
          setConversations((prevConvs) =>
            prevConvs.map((c) => {
              if (c.id !== updatedConversation.id) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== assistantMessageId) return m;
                  return {
                    ...m,
                    content: accumulatedContent,
                    isStreaming: true,
                  };
                }),
              };
            })
          );
        },
        onToolCall: (tc: ToolCall) => {
          collectedToolCalls.push({ ...tc, status: 'running' });
          setConversations((prevConvs) =>
            prevConvs.map((c) => {
              if (c.id !== updatedConversation.id) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== assistantMessageId) return m;
                  return {
                    ...m,
                    toolCalls: [...collectedToolCalls],
                  };
                }),
              };
            })
          );
        },
        onToolResult: (tc: ToolCall) => {
          const idx = collectedToolCalls.findIndex(
            (item) => item.id === tc.id || item.name === tc.name
          );
          if (idx !== -1) {
            collectedToolCalls[idx] = {
              ...collectedToolCalls[idx],
              status: tc.status === 'failed' ? 'failed' : 'completed',
              result: tc.result,
              error: tc.error,
            };
          } else {
            collectedToolCalls.push(tc);
          }
          setConversations((prevConvs) =>
            prevConvs.map((c) => {
              if (c.id !== updatedConversation.id) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== assistantMessageId) return m;
                  return {
                    ...m,
                    toolCalls: [...collectedToolCalls],
                  };
                }),
              };
            })
          );
        },
        onAgentStep: (step: AgentStep) => {
          collectedAgentSteps.push(step);
          setRecentAgentSteps([...collectedAgentSteps]);
          setConversations((prevConvs) =>
            prevConvs.map((c) => {
              if (c.id !== updatedConversation.id) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== assistantMessageId) return m;
                  return {
                    ...m,
                    agentSteps: [...collectedAgentSteps],
                  };
                }),
              };
            })
          );
        },
        onError: (errMsg: string) => {
          accumulatedContent += `\n\n*(Error: ${errMsg})*`;
        },
        onDone: (fullText: string) => {
          if (fullText) {
            accumulatedContent = fullText;
          }
        },
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        accumulatedContent += `\n\n*(Connection error: ${err.message || 'Could not complete response'} )*`;
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;

      // Final state persistence
      setConversations((prevConvs) => {
        const finalConvs = prevConvs.map((c) => {
          if (c.id !== updatedConversation.id) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) => {
              if (m.id !== assistantMessageId) return m;
              return {
                ...m,
                content: accumulatedContent,
                isStreaming: false,
                toolCalls: collectedToolCalls,
                agentSteps: collectedAgentSteps,
              };
            }),
          };
        });
        storage.saveConversations(finalConvs);
        return finalConvs;
      });
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    const msgs = activeConversation?.messages || [];
    if (msgs.length < 2) return;

    // Find last user message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const lastUserMsg = msgs[lastUserIdx];
    // Remove subsequent messages
    const trimmedMsgs = msgs.slice(0, lastUserIdx);
    const updatedConv = {
      ...activeConversation,
      messages: trimmedMsgs,
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

  const activeModelDisplay =
    settings.provider === 'groq'
      ? settings.groqModel || 'openai/gpt-oss-20b'
      : settings.provider === 'openai'
      ? settings.openaiModel
      : settings.geminiModel;

  return (
    <div
      data-theme={settings.theme || 'midnight'}
      data-accent={settings.accent || 'cyan'}
      className="flex h-screen w-screen overflow-hidden antialiased font-sans transition-colors"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onOpenMemory={() => setIsMemoriesOpen(true)}
        onOpenFiles={() => setIsFilesOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        memoriesCount={memories.length}
        filesCount={sessionFiles.length}
        activeToolsCount={activeToolsCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Center Area */}
      <main
        className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        {/* Top Header */}
        <Header
          settings={settings}
          systemStatus={systemStatus}
          agentMode={settings.agentMode}
          onToggleAgentMode={() => {
            const nextMode = !settings.agentMode;
            handleSaveSettings({
              ...settings,
              agentMode: nextMode,
            });
            if (nextMode) {
              setShowRightPanel(true);
            }
          }}
          showRightPanel={showRightPanel}
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenStatus={() => setIsStatusOpen(true)}
          onNewChat={handleNewConversation}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isStreaming={isStreaming}
          recentSteps={recentAgentSteps}
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
          onOpenFiles={() => setIsFilesOpen(true)}
          onOpenTools={() => setIsToolsOpen(true)}
          activeModelName={activeModelDisplay}
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

      {/* Right-Side Agent Inspector Drawer */}
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
          onClose={() => setShowRightPanel(false)}
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

      {isStatusOpen && (
        <StatusModal
          status={systemStatus}
          onClose={() => setIsStatusOpen(false)}
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
