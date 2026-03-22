import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import type { SourceChunk, QueryMetrics } from './types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceChunk[];
  metrics?: QueryMetrics;
  promptPreview?: { system_prompt: string; user_prompt: string };
}

interface MessageBubbleProps {
  message: Message;
  animate?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, animate = true }) => {
  const isUser = message.role === 'user';

  const content = (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      role="article"
      aria-label={`${isUser ? 'Your message' : 'AI response'}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-white/10 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
            : 'bg-gradient-to-br from-emerald-500 to-cyan-600'
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-body-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-md shadow-lg shadow-indigo-500/20'
            : 'bg-medium-contrast/50 backdrop-blur-sm text-high-contrast rounded-tl-md border border-medium-contrast/40'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-black/10 prose-pre:rounded-lg prose-code:text-xs prose-code:bg-black/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-high-contrast">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <time
          className={`block text-[10px] mt-1.5 tabular-nums ${
            isUser ? 'text-white/50' : 'text-low-contrast'
          }`}
          dateTime={message.timestamp.toISOString()}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {content}
    </motion.div>
  );
};
