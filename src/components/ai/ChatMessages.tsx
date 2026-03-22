import React from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble, type Message } from './MessageBubble';
import { SourceCitations } from './SourceCitations';
import { ResearchProgress } from './ResearchProgress';
import { ReportViewer } from './ReportViewer';
import type { ResearchAgentStatus, ResearchReport } from './types';
import type { ResearchPhase } from '@/hooks/useResearch';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  streamingText: string;
  researchPhase: ResearchPhase;
  researchAgents: ResearchAgentStatus[];
  researchReport: ResearchReport | null;
  planMessage: string;
  synthesisMessage: string;
  retryCount: number;
  verificationConfidence?: number;
  uploadProgress: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  animateParent: React.Ref<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  streamingText,
  researchPhase,
  researchAgents,
  researchReport,
  planMessage,
  synthesisMessage,
  retryCount,
  verificationConfidence,
  uploadProgress,
  messagesEndRef,
  animateParent,
}) => (
  <div ref={animateParent} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth" role="log" aria-label="Chat messages" aria-live="polite">
    {messages.map((msg) => (
      <div key={msg.id}>
        <MessageBubble message={msg} />
        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
          <div className="ml-11 mt-1">
            <SourceCitations sources={msg.sources} />
          </div>
        )}
      </div>
    ))}

    {/* Streaming text */}
    {isLoading && streamingText && (
      <MessageBubble
        message={{ id: 'streaming', role: 'assistant', content: streamingText + '\u258C', timestamp: new Date() }}
        animate={false}
      />
    )}

    {/* Research progress */}
    {researchPhase !== 'idle' && (
      <ResearchProgress
        phase={researchPhase}
        agents={researchAgents}
        planMessage={planMessage}
        synthesisMessage={synthesisMessage}
        retryCount={retryCount}
        verificationConfidence={verificationConfidence}
      />
    )}

    {/* Research report */}
    {researchReport && researchPhase === 'complete' && (
      <div className="mt-4">
        <ReportViewer report={researchReport} />
      </div>
    )}

    {/* Typing indicator */}
    {isLoading && !streamingText && researchPhase === 'idle' && (
      <div className="flex gap-3" role="status" aria-label="AI is thinking">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
        <div className="bg-medium-contrast/40 backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-3 border border-medium-contrast/30">
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )}

    {/* Upload progress */}
    {uploadProgress && (
      <div className="flex gap-3 items-center">
        <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
        <span className="text-body-sm text-medium-contrast">{uploadProgress}</span>
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>
);
