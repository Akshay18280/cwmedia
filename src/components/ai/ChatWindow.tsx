import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useChat, EXAMPLE_QUESTIONS, RESEARCH_EXAMPLES } from '@/hooks/useChat';
import { useResearch } from '@/hooks/useResearch';
import { appConfig } from '@/config/appConfig';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ExamplePrompts } from './ExamplePrompts';
import { PipelineVisualizer } from './PipelineVisualizer';
import { QueryInspector } from './QueryInspector';
import type { Message } from './MessageBubble';

type WindowMode = 'normal' | 'maximized' | 'minimized';

interface ChatWindowProps {
  /** When true, renders as a popup overlay */
  isPopup?: boolean;
  onClose?: () => void;
  /** Pre-filled query from URL deep-link — auto-submits on mount */
  initialQuery?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ isPopup = false, onClose, initialQuery }) => {
  const [windowMode, setWindowMode] = useState<WindowMode>('normal');
  const [animateParent] = useAutoAnimate();
  const initialQueryFired = useRef(false);

  const apiBase = appConfig.ai.apiBaseUrl;

  const chat = useChat();
  const research = useResearch(apiBase);

  const handleSend = useCallback(async (text?: string) => {
    const trimmed = (text || chat.input).trim();

    // Handle file upload with no text
    if (chat.attachedFile && !trimmed) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `📎 Uploading: ${chat.attachedFile.name}`,
        timestamp: new Date(),
      };
      chat.addMessage(userMsg);
      chat.setIsLoading(true);
      const file = chat.attachedFile;
      chat.setAttachedFile(null);

      const result = await chat.uploadFile(file);
      chat.addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result,
        timestamp: new Date(),
      });
      chat.setIsLoading(false);
      chat.inputRef.current?.focus();
      return;
    }

    if (!trimmed && !chat.attachedFile) return;
    if (chat.isLoading) return;

    // File + text
    if (chat.attachedFile) {
      const fileMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `📎 ${chat.attachedFile.name}\n\n${trimmed}`,
        timestamp: new Date(),
      };
      chat.addMessage(fileMsg);
      chat.setInput('');
      chat.setIsLoading(true);

      const file = chat.attachedFile;
      chat.setAttachedFile(null);
      const uploadResult = await chat.uploadFile(file);

      chat.addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: uploadResult,
        timestamp: new Date(),
      });
      chat.setIsLoading(false);
      chat.inputRef.current?.focus();
      return;
    }

    // Regular message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    chat.addMessage(userMessage);
    chat.setInput('');
    chat.setIsLoading(true);
    research.setResearchReport(null);

    const shouldResearch = research.shouldAutoResearch(trimmed, chat.backendStatus === 'connected');

    if (shouldResearch && chat.backendStatus === 'connected') {
      await research.handleResearch(trimmed, (msg) => chat.addMessage(msg));
      chat.setIsLoading(false);
      chat.inputRef.current?.focus();
      return;
    }

    await chat.sendChatMessage(trimmed);
    chat.setIsLoading(false);
    chat.inputRef.current?.focus();
  }, [chat, research]);

  // Trigger initialQuery from URL deep-link
  useEffect(() => {
    if (initialQuery && !initialQueryFired.current) {
      initialQueryFired.current = true;
      // Small delay to ensure hooks are settled
      const timer = setTimeout(() => handleSend(initialQuery), 100);
      return () => clearTimeout(timer);
    }
  }, [initialQuery, handleSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClearChat = useCallback(() => {
    chat.clearChat();
    research.resetResearch();
  }, [chat, research]);

  const lastAssistantMsg = [...chat.messages].reverse().find(m => m.role === 'assistant' && (m.sources || m.metrics));
  const examples = research.researchMode ? RESEARCH_EXAMPLES : EXAMPLE_QUESTIONS;

  // Dynamic height classes
  const heightClass = isPopup
    ? 'h-[500px]'
    : windowMode === 'maximized'
      ? 'h-[85vh]'
      : windowMode === 'minimized'
        ? 'h-14'
        : 'h-full';

  return (
    <div
      className={`flex flex-col ${heightClass} rounded-2xl border border-medium-contrast/50 bg-medium-contrast/30 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/5 transition-all duration-300`}
      role="region"
      aria-label="AI Chat Interface"
    >
      <ChatHeader
        backendStatus={chat.backendStatus}
        researchMode={research.researchMode}
        onToggleResearch={() => research.setResearchMode(!research.researchMode)}
        messagesCount={chat.messages.length}
        onClearChat={handleClearChat}
        windowMode={windowMode}
        onSetWindowMode={setWindowMode}
        isPopup={isPopup}
        onClose={onClose}
        models={chat.availableModels}
        selectedModel={chat.selectedModel}
        onSelectModel={chat.setSelectedModel}
      />

      {windowMode !== 'minimized' && (
        <>
          <ChatMessages
            messages={chat.messages}
            isLoading={chat.isLoading}
            streamingText={chat.streamingText}
            researchPhase={research.researchPhase}
            researchAgents={research.researchAgents}
            researchReport={research.researchReport}
            planMessage={research.planMessage}
            synthesisMessage={research.synthesisMessage}
            retryCount={research.retryCount}
            verificationConfidence={research.verificationConfidence}
            uploadProgress={chat.uploadProgress}
            messagesEndRef={chat.messagesEndRef}
            animateParent={animateParent}
          />

          {/* Pipeline Visualizer */}
          {(chat.pipelineActive || chat.pipelineSteps.some(s => s.status !== 'idle')) && (
            <PipelineVisualizer steps={chat.pipelineSteps} isActive={chat.pipelineActive} />
          )}

          {/* Query Inspector */}
          {lastAssistantMsg && (
            <div className="px-4 pb-2">
              <QueryInspector
                promptPreview={lastAssistantMsg.promptPreview || chat.lastPrompt || undefined}
                metrics={lastAssistantMsg.metrics || chat.lastMetrics || undefined}
              />
            </div>
          )}

          {/* Example questions */}
          {chat.messages.length <= 1 && !chat.isLoading && (
            <ExamplePrompts
              examples={examples}
              researchMode={research.researchMode}
              onSelect={(q) => handleSend(q)}
            />
          )}

          <ChatInput
            input={chat.input}
            onInputChange={chat.setInput}
            onSend={() => handleSend()}
            onKeyDown={handleKeyDown}
            isLoading={chat.isLoading}
            researchMode={research.researchMode}
            attachedFile={chat.attachedFile}
            onAttachFile={() => chat.fileInputRef.current?.click()}
            onRemoveFile={() => chat.setAttachedFile(null)}
            onFileSelect={chat.handleFileSelect}
            inputRef={chat.inputRef}
            fileInputRef={chat.fileInputRef}
          />
        </>
      )}
    </div>
  );
};
