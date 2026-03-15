import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Wifi, WifiOff, CircleDot } from 'lucide-react';
import { MessageBubble, Message } from './MessageBubble';
import { appConfig } from '@/config/appConfig';

type BackendStatus = 'checking' | 'connected' | 'demo' | 'unavailable';

const MOCK_RESPONSES: Record<string, string> = {
  'explain the system architecture':
    'The AI Knowledge Copilot uses a layered architecture:\n\n1. **React frontend** — provides the chat UI and document upload interface.\n2. **Golang REST API** — handles HTTP requests, orchestrates the RAG pipeline, and manages document ingestion.\n3. **pgvector (PostgreSQL)** — stores document chunk embeddings as 1536-dimensional vectors and performs HNSW-indexed similarity search.\n4. **LLM provider** — receives the retrieved context and user question, then generates a grounded answer.\n\nAll services are containerized with Docker Compose for reproducible deployments.',

  'how does rag work':
    'RAG (Retrieval-Augmented Generation) works in two phases:\n\n**Indexing phase:**\n• Documents are split into overlapping chunks (512 tokens, 50-token overlap).\n• Each chunk is converted to a vector embedding using an embedding model.\n• Embeddings are stored in pgvector alongside the original text.\n\n**Query phase:**\n• The user\'s question is embedded using the same model.\n• A cosine-similarity search finds the top-k most relevant chunks.\n• Those chunks are injected into the LLM prompt as context.\n• The LLM generates an answer grounded in the retrieved documents.',

  'what technologies power this project':
    'The project is built with:\n\n• **Go (Golang)** — high-performance API server\n• **PostgreSQL + pgvector** — vector database for embeddings\n• **OpenAI / Anthropic APIs** — pluggable LLM providers\n• **Docker Compose** — container orchestration\n• **React + TypeScript** — frontend chat interface\n• **Vite** — build tooling\n\nThe architecture is designed to be modular — you can swap the LLM provider or embedding model without changing the core pipeline.',

  'summarize the uploaded document':
    'In demo mode, documents are not actually processed by a backend. When the full system is running, the pipeline would:\n\n1. Extract text from your uploaded file (PDF, Markdown, or TXT).\n2. Split it into semantic chunks.\n3. Generate vector embeddings for each chunk.\n4. Store them in pgvector.\n\nAfter indexing, you could ask questions and receive answers grounded in your document\'s content.',
};

const FALLBACK_RESPONSES = [
  'Based on the uploaded documents, the system uses a microservices architecture with Go as the primary backend language.',
  'The RAG pipeline first embeds your query, then searches the vector database for semantically similar document chunks, and passes them as context to the LLM.',
  'pgvector stores document embeddings as 1536-dimensional vectors and uses HNSW indexing for approximate nearest neighbor search.',
  'The API supports PDF, Markdown, and plain text files. Documents are chunked into 512-token segments with 50-token overlap.',
  'Docker Compose orchestrates three services: the Go API server, PostgreSQL with pgvector, and an optional embedding service.',
];

const EXAMPLE_QUESTIONS = [
  'Explain the system architecture',
  'How does RAG work',
  'What technologies power this project',
  'Summarize the uploaded document',
];

function getMockResponse(question: string): string {
  const lower = question.toLowerCase().trim();
  for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm the AI Knowledge Copilot. Upload a document and ask me anything about it. Try one of the example questions below to get started.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        setBackendStatus(res.ok ? 'connected' : 'demo');
      } catch {
        setBackendStatus('demo');
      }
    };
    checkHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Streaming text simulation
  const streamResponse = useCallback(async (fullText: string) => {
    setStreamingText('');
    const words = fullText.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      setStreamingText(current);
      await new Promise((r) => setTimeout(r, 25 + Math.random() * 35));
    }
    return current;
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let responseText: string;

    if (backendStatus === 'connected') {
      // Try real backend
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: trimmed }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error('Backend error');
        const data = await res.json();
        responseText = data.answer || data.response || data.message || 'No response from backend.';
      } catch {
        responseText = getMockResponse(trimmed);
        setBackendStatus('demo');
      }
    } else {
      // Simulate network delay then use mock
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      responseText = getMockResponse(trimmed);
    }

    // Stream the response
    await streamResponse(responseText);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    };

    setStreamingText('');
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    inputRef.current?.focus();
  }, [input, isLoading, backendStatus, streamResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusConfig = {
    checking: { color: 'text-yellow-500', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Checking...' },
    connected: { color: 'text-green-500', icon: <Wifi className="w-3 h-3" />, label: 'Backend connected' },
    demo: { color: 'text-yellow-500', icon: <CircleDot className="w-3 h-3" />, label: 'Demo mode' },
    unavailable: { color: 'text-red-500', icon: <WifiOff className="w-3 h-3" />, label: 'Backend unavailable' },
  };
  const status = statusConfig[backendStatus];

  return (
    <div className="flex flex-col h-[550px] rounded-2xl border border-medium-contrast bg-medium-contrast/50 overflow-hidden">
      {/* Chat header with health indicator */}
      <div className="px-5 py-3 border-b border-medium-contrast bg-medium-contrast/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-body-sm font-medium text-high-contrast">AI Knowledge Copilot</span>
          <span className={`ml-auto flex items-center gap-1.5 text-xs ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming text (shown while typing) */}
        {isLoading && streamingText && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingText + '\u258C',
              timestamp: new Date(),
            }}
          />
        )}

        {/* Loading dots (shown before streaming starts) */}
        {isLoading && !streamingText && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-holographic flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-low-contrast rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-medium-contrast animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-medium-contrast animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-medium-contrast animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Example questions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-5 pb-2">
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-medium-contrast text-medium-contrast hover:text-high-contrast hover:border-accent-primary hover:bg-accent-primary/5 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-medium-contrast bg-medium-contrast/80">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your documents..."
            disabled={isLoading}
            className="flex-1 bg-low-contrast border border-medium-contrast rounded-xl px-4 py-2.5 text-body-sm text-high-contrast placeholder:text-low-contrast focus:outline-none focus:ring-2 focus:ring-accent-primary/50 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-gradient-flow text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
