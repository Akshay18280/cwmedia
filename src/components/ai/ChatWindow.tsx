import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Wifi, WifiOff, CircleDot, Trash2, FlaskConical } from 'lucide-react';
import { MessageBubble, Message } from './MessageBubble';
import { SourceCitations } from './SourceCitations';
import { QueryInspector } from './QueryInspector';
import { PipelineVisualizer } from './PipelineVisualizer';
import { ResearchProgress } from './ResearchProgress';
import { ReportViewer } from './ReportViewer';
import { streamChat } from '@/services/ai/SSEChatService';
import { streamResearch, isResearchQuery } from '@/services/ai/ResearchService';
import { appConfig } from '@/config/appConfig';
import type { PipelineStep, SourceChunk, QueryMetrics, ResearchAgentStatus, ResearchReport, VerificationResult } from './types';

type BackendStatus = 'checking' | 'connected' | 'demo' | 'unavailable';
type ResearchPhase = 'idle' | 'planning' | 'researching' | 'extracting' | 'verifying' | 'synthesizing' | 'complete';

const MOCK_RESPONSES: Record<string, string> = {
  'explain the system architecture':
    'The AI Knowledge Copilot uses a layered architecture:\n\n1. **React frontend** — provides the chat UI and document upload interface.\n2. **Golang REST API** — handles HTTP requests, orchestrates the RAG pipeline, and manages document ingestion.\n3. **pgvector (PostgreSQL)** — stores document chunk embeddings as 512-dimensional vectors and performs HNSW-indexed similarity search.\n4. **Google Gemini 2.5 Flash** — receives the retrieved context and user question, then generates a grounded answer.\n\nAll components are designed for zero-cost deployment.',

  'how does rag work':
    'RAG (Retrieval-Augmented Generation) works in two phases:\n\n**Indexing phase:**\n- Documents are split into overlapping chunks (512 tokens, 50-token overlap).\n- Each chunk is converted to a 512-dimensional vector using local hash-based embeddings.\n- Embeddings are stored in pgvector alongside the original text.\n\n**Query phase:**\n- The user\'s question is embedded using the same model.\n- A cosine-similarity search finds the top-5 most relevant chunks.\n- Those chunks are injected into the Gemini prompt as context.\n- Gemini 2.5 Flash generates an answer grounded in the retrieved documents.',

  'what technologies power this project':
    'The project is built with:\n\n- **Go (Golang)** — high-performance API server with Gin\n- **PostgreSQL + pgvector** — vector database for embeddings\n- **Google Gemini 2.5 Flash** — free-tier LLM for answer generation\n- **Local hash-based embeddings** — zero-cost 512-dimensional vectors\n- **React + TypeScript** — frontend chat interface\n- **Vite + Tailwind CSS** — build tooling and styling\n\nThe architecture is designed to be modular — you can swap the LLM provider or embedding model without changing the core pipeline.',

  'summarize the uploaded document':
    'In demo mode, documents are not actually processed by a backend. When the full system is running, the pipeline would:\n\n1. Extract text from your uploaded file (PDF, Markdown, or TXT).\n2. Split it into semantic chunks.\n3. Generate 512-dimensional vector embeddings for each chunk.\n4. Store them in pgvector with HNSW indexing.\n\nAfter indexing, you could ask questions and receive answers grounded in your document\'s content.',
};

const FALLBACK_RESPONSES = [
  'Based on the uploaded documents, the system uses a microservices architecture with Go as the primary backend language.',
  'The RAG pipeline first embeds your query, then searches the vector database for semantically similar document chunks, and passes them as context to Gemini 2.5 Flash.',
  'pgvector stores document embeddings as 512-dimensional vectors and uses HNSW indexing for approximate nearest neighbor search.',
  'The API supports PDF, Markdown, and plain text files. Documents are chunked into 512-token segments with 50-token overlap.',
  'The system runs at $0/month cost using local embeddings and Google Gemini\'s free tier.',
];

const EXAMPLE_QUESTIONS = [
  'Explain the system architecture',
  'How does RAG work',
  'What technologies power this project',
  'Summarize the uploaded document',
];

const RESEARCH_EXAMPLES = [
  'Research the current state of RAG systems in 2026',
  'Analyze the vector database market landscape',
  'Compare embedding models for production use',
];

const STORAGE_KEY = 'cwmedia-chat-history';

function getMockResponse(question: string): string {
  const lower = question.toLowerCase().trim();
  for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

function loadMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((m: Record<string, unknown>) => ({ ...m, timestamp: new Date(m.timestamp as string) }));
    }
  } catch { /* ignore */ }
  return [
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm the AI Knowledge Copilot. Upload a document and ask me anything about it, or try **Research Mode** for deep multi-agent analysis on any topic.",
      timestamp: new Date(),
    },
  ];
}

const INITIAL_STEPS: PipelineStep[] = [
  { step: 'embedding', status: 'idle' },
  { step: 'search', status: 'idle' },
  { step: 'retrieve', status: 'idle' },
  { step: 'prompt', status: 'idle' },
  { step: 'generate', status: 'idle' },
];

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [pipelineActive, setPipelineActive] = useState(false);
  const [lastSources, setLastSources] = useState<SourceChunk[] | null>(null);
  const [lastMetrics, setLastMetrics] = useState<QueryMetrics | null>(null);
  const [lastPrompt, setLastPrompt] = useState<{ system_prompt: string; user_prompt: string } | null>(null);

  // Research mode state
  const [researchMode, setResearchMode] = useState(false);
  const [researchPhase, setResearchPhase] = useState<ResearchPhase>('idle');
  const [researchAgents, setResearchAgents] = useState<ResearchAgentStatus[]>([]);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [planMessage, setPlanMessage] = useState('');
  const [synthesisMessage, setSynthesisMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [verificationConfidence, setVerificationConfidence] = useState<number | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiBase = appConfig.ai.apiBaseUrl;

  // Persist messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(3000) });
        setBackendStatus(res.ok ? 'connected' : 'demo');
      } catch {
        setBackendStatus('demo');
      }
    };
    checkHealth();
  }, [apiBase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, researchReport]);

  // Streaming text simulation for demo mode
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

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm the AI Knowledge Copilot. Upload a document and ask me anything about it, or try **Research Mode** for deep multi-agent analysis on any topic.",
        timestamp: new Date(),
      },
    ]);
    setLastSources(null);
    setLastMetrics(null);
    setLastPrompt(null);
    setResearchReport(null);
    setResearchPhase('idle');
    setResearchAgents([]);
    setRetryCount(0);
    setVerificationConfidence(undefined);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleResearch = useCallback(async (question: string) => {
    setResearchPhase('planning');
    setResearchAgents([]);
    setResearchReport(null);
    setPlanMessage('');
    setSynthesisMessage('');
    setRetryCount(0);
    setVerificationConfidence(undefined);

    try {
      await new Promise<void>((resolve, reject) => {
        const ctrl = streamResearch(apiBase, question, {
          onPlanning: (msg) => {
            setResearchPhase('planning');
            setPlanMessage(msg);
          },
          onPlanReady: (_plan) => {
            // Plan is received, agents about to start
          },
          onAgentStart: (agent) => {
            setResearchPhase('researching');
            setResearchAgents(prev => {
              const existing = prev.find(a => a.id === agent.id);
              if (existing) {
                return prev.map(a => a.id === agent.id ? agent : a);
              }
              return [...prev, agent];
            });
          },
          onAgentProgress: (agent, _message) => {
            setResearchAgents(prev =>
              prev.map(a => a.id === agent.id ? { ...a, message: agent.message } : a)
            );
          },
          onAgentComplete: (agent) => {
            setResearchAgents(prev =>
              prev.map(a => a.id === agent.id ? agent : a)
            );
          },
          onExtracting: (_msg) => {
            setResearchPhase('extracting');
          },
          onVerifying: (_msg) => {
            setResearchPhase('verifying');
          },
          onVerified: (result: VerificationResult) => {
            setVerificationConfidence(result.overall_confidence);
          },
          onRetry: (_msg, count) => {
            setRetryCount(count);
            setResearchPhase('researching');
          },
          onSynthesizing: (msg) => {
            setResearchPhase('synthesizing');
            setSynthesisMessage(msg);
          },
          onReport: (report) => {
            setResearchReport(report);
            setResearchPhase('complete');

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `**${report.title}**\n\n${report.summary}`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
          },
          onDone: () => resolve(),
          onError: (err) => reject(new Error(err)),
        });
        abortRef.current = ctrl;
      });
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Research failed: ${err instanceof Error ? err.message : 'Unknown error'}. Try a simpler query or switch to chat mode.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setResearchPhase('idle');
    }

    setIsLoading(false);
    inputRef.current?.focus();
  }, [apiBase]);

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
    setLastSources(null);
    setLastMetrics(null);
    setLastPrompt(null);
    setResearchReport(null);

    // Check if this should be a research query
    const shouldResearch = researchMode || (backendStatus === 'connected' && isResearchQuery(trimmed));

    if (shouldResearch && backendStatus === 'connected') {
      await handleResearch(trimmed);
      return;
    }

    if (backendStatus === 'connected') {
      // Try SSE streaming
      setPipelineActive(true);
      setPipelineSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle' })));

      let fullText = '';
      let sources: SourceChunk[] = [];
      let metrics: QueryMetrics | null = null;

      try {
        await new Promise<void>((resolve, reject) => {
          const ctrl = streamChat(apiBase, trimmed, {
            onStep: (step) => {
              setPipelineSteps(prev =>
                prev.map(s => s.step === step.step ? { ...s, ...step } : s)
              );
            },
            onToken: (token) => {
              fullText += token;
              setStreamingText(fullText);
            },
            onSources: (s) => {
              sources = s;
              setLastSources(s);
            },
            onMetrics: (m) => {
              metrics = m;
              setLastMetrics(m);
            },
            onDone: () => resolve(),
            onError: (err) => reject(new Error(err)),
          });
          abortRef.current = ctrl;
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullText || 'No response received.',
          timestamp: new Date(),
          sources,
          metrics: metrics || undefined,
        };

        setStreamingText('');
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        // Fall back to non-streaming endpoint
        try {
          const res = await fetch(`${apiBase}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: trimmed }),
            signal: AbortSignal.timeout(30000),
          });
          if (!res.ok) throw new Error('Backend error');
          const data = await res.json();

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.answer || 'No response from backend.',
            timestamp: new Date(),
            sources: data.sources,
            metrics: data.metrics,
            promptPreview: data.prompt_preview,
          };

          if (data.sources) setLastSources(data.sources);
          if (data.metrics) setLastMetrics(data.metrics);
          if (data.prompt_preview) setLastPrompt(data.prompt_preview);

          setStreamingText('');
          setMessages((prev) => [...prev, assistantMessage]);
        } catch {
          // Fall back to demo mode
          setBackendStatus('demo');
          const mockText = getMockResponse(trimmed);
          await streamResponse(mockText);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: mockText,
            timestamp: new Date(),
          };
          setStreamingText('');
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } finally {
        setPipelineActive(false);
      }
    } else {
      // Demo mode
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      const mockText = getMockResponse(trimmed);
      await streamResponse(mockText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockText,
        timestamp: new Date(),
      };
      setStreamingText('');
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  }, [input, isLoading, backendStatus, researchMode, streamResponse, apiBase, handleResearch]);

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

  // Find the last assistant message with sources/metrics for inspector
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && (m.sources || m.metrics));

  const examples = researchMode ? RESEARCH_EXAMPLES : EXAMPLE_QUESTIONS;

  return (
    <div
      className="flex flex-col h-[60vh] min-h-[400px] max-h-[700px] rounded-2xl border border-medium-contrast/50 bg-medium-contrast/30 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/5"
      role="region"
      aria-label="AI Chat Interface"
    >
      {/* Chat header */}
      <div className="px-5 py-3 border-b border-medium-contrast/40 bg-gradient-to-r from-medium-contrast/60 via-medium-contrast/40 to-medium-contrast/60">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-body-sm font-semibold text-high-contrast">
            {researchMode ? 'AI Research Copilot' : 'AI Knowledge Copilot'}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {/* Research mode toggle */}
            {backendStatus === 'connected' && (
              <button
                onClick={() => setResearchMode(!researchMode)}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg transition-all ${
                  researchMode
                    ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                    : 'text-low-contrast hover:text-high-contrast hover:bg-medium-contrast/40'
                }`}
                title={researchMode ? 'Switch to Chat mode' : 'Switch to Research mode'}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Research
              </button>
            )}
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1 text-xs text-low-contrast hover:text-high-contrast transition-colors p-1 rounded-md hover:bg-medium-contrast/40"
                title="Clear chat"
                aria-label="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className={`flex items-center gap-1.5 text-[11px] font-medium ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4" role="log" aria-label="Chat messages" aria-live="polite">
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
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingText + '\u258C',
              timestamp: new Date(),
            }}
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

        {/* Loading indicator */}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Pipeline Visualizer */}
      {(pipelineActive || pipelineSteps.some(s => s.status !== 'idle')) && (
        <PipelineVisualizer steps={pipelineSteps} isActive={pipelineActive} />
      )}

      {/* Query Inspector */}
      {lastAssistantMsg && (
        <div className="px-4 sm:px-5 pb-2">
          <QueryInspector
            promptPreview={lastAssistantMsg.promptPreview || lastPrompt || undefined}
            metrics={lastAssistantMsg.metrics || lastMetrics || undefined}
          />
        </div>
      )}

      {/* Example questions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 sm:px-5 pb-2">
          <p className="text-[10px] text-low-contrast uppercase tracking-wider font-semibold mb-2">
            {researchMode ? 'Try researching' : 'Try asking'}
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  researchMode
                    ? 'border-indigo-500/30 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                    : 'border-medium-contrast/50 text-medium-contrast hover:text-high-contrast hover:border-accent-primary/50 hover:bg-accent-primary/5'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-medium-contrast/40 bg-gradient-to-r from-medium-contrast/40 via-medium-contrast/20 to-medium-contrast/40">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={researchMode ? 'Enter a research topic for deep analysis...' : 'Ask about your documents...'}
            disabled={isLoading}
            aria-label="Type your question"
            className={`flex-1 bg-low-contrast/50 border rounded-xl px-4 py-2.5 text-body-sm text-high-contrast placeholder:text-low-contrast focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${
              researchMode
                ? 'border-indigo-500/30 focus:ring-indigo-500/40 focus:border-indigo-500/40'
                : 'border-medium-contrast/40 focus:ring-accent-primary/40 focus:border-accent-primary/40'
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={`p-2.5 text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 ${
              researchMode
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/20 hover:shadow-indigo-500/30'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/20 hover:shadow-indigo-500/30'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
