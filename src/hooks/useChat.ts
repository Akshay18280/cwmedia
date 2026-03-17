import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '@/components/ai/MessageBubble';
import type { PipelineStep, SourceChunk, QueryMetrics } from '@/components/ai/types';
import { streamChat } from '@/services/ai/SSEChatService';
import { appConfig } from '@/config/appConfig';

export type BackendStatus = 'checking' | 'connected' | 'demo' | 'unavailable';

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
  return [{
    id: '1',
    role: 'assistant',
    content: "Hello! I'm the AI Research Copilot. Ask me anything, upload a document, or switch to **Research Mode** for deep multi-agent analysis.",
    timestamp: new Date(),
  }];
}

const INITIAL_STEPS: PipelineStep[] = [
  { step: 'embedding', status: 'idle' },
  { step: 'search', status: 'idle' },
  { step: 'retrieve', status: 'idle' },
  { step: 'prompt', status: 'idle' },
  { step: 'generate', status: 'idle' },
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];

export function useChat() {
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiBase = appConfig.ai.apiBaseUrl;

  // Persist messages
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Check backend health
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

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm the AI Research Copilot. Ask me anything, upload a document, or switch to **Research Mode** for deep multi-agent analysis.",
      timestamp: new Date(),
    }]);
    setLastSources(null);
    setLastMetrics(null);
    setLastPrompt(null);
    setAttachedFile(null);
    setUploadProgress('');
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `Unsupported file type. Please upload **PDF**, **TXT**, or **Markdown** files.`,
        timestamp: new Date(),
      });
      return;
    }
    setAttachedFile(file);
    if (e.target) e.target.value = '';
  }, [addMessage]);

  const uploadFile = useCallback(async (file: File) => {
    if (backendStatus !== 'connected') {
      return "In demo mode, file uploads are simulated. When the backend is running, the file would be chunked, embedded, and indexed for Q&A.";
    }
    setUploadProgress('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiBase}/api/documents/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || 'Upload failed');
      }
      const data = await res.json();
      setUploadProgress('');
      return data.message || `Document "${file.name}" uploaded and indexed successfully.`;
    } catch (err) {
      setUploadProgress('');
      return `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }, [apiBase, backendStatus]);

  const sendChatMessage = useCallback(async (question: string) => {
    setLastSources(null);
    setLastMetrics(null);
    setLastPrompt(null);

    if (backendStatus === 'connected') {
      setPipelineActive(true);
      setPipelineSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle' })));

      let fullText = '';
      let sources: SourceChunk[] = [];
      let metrics: QueryMetrics | null = null;

      try {
        await new Promise<void>((resolve, reject) => {
          const ctrl = streamChat(apiBase, question, {
            onStep: (step) => {
              setPipelineSteps(prev => prev.map(s => s.step === step.step ? { ...s, ...step } : s));
            },
            onToken: (token) => { fullText += token; setStreamingText(fullText); },
            onSources: (s) => { sources = s; setLastSources(s); },
            onMetrics: (m) => { metrics = m; setLastMetrics(m); },
            onDone: () => resolve(),
            onError: (err) => reject(new Error(err)),
          });
          abortRef.current = ctrl;
        });

        setStreamingText('');
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullText || 'No response received.',
          timestamp: new Date(),
          sources,
          metrics: metrics || undefined,
        });
      } catch {
        try {
          const res = await fetch(`${apiBase}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
            signal: AbortSignal.timeout(30000),
          });
          if (!res.ok) throw new Error('Backend error');
          const data = await res.json();
          if (data.sources) setLastSources(data.sources);
          if (data.metrics) setLastMetrics(data.metrics);
          if (data.prompt_preview) setLastPrompt(data.prompt_preview);
          setStreamingText('');
          addMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.answer || 'No response from backend.',
            timestamp: new Date(),
            sources: data.sources,
            metrics: data.metrics,
            promptPreview: data.prompt_preview,
          });
        } catch {
          setBackendStatus('demo');
          const mockText = getMockResponse(question);
          await streamResponse(mockText);
          setStreamingText('');
          addMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: mockText,
            timestamp: new Date(),
          });
        }
      } finally {
        setPipelineActive(false);
      }
    } else {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      const mockText = getMockResponse(question);
      await streamResponse(mockText);
      setStreamingText('');
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockText,
        timestamp: new Date(),
      });
    }
  }, [apiBase, backendStatus, streamResponse, addMessage]);

  return {
    // State
    messages,
    input,
    isLoading,
    streamingText,
    backendStatus,
    pipelineSteps,
    pipelineActive,
    lastSources,
    lastMetrics,
    lastPrompt,
    attachedFile,
    uploadProgress,
    // Refs
    messagesEndRef,
    inputRef,
    fileInputRef,
    abortRef,
    // Actions
    setInput,
    setIsLoading,
    setMessages,
    setBackendStatus,
    addMessage,
    clearChat,
    handleFileSelect,
    uploadFile,
    sendChatMessage,
    setAttachedFile,
    scrollToBottom,
    setStreamingText,
  };
}

export const EXAMPLE_QUESTIONS = [
  'Explain the system architecture',
  'How does RAG work',
  'What technologies power this project',
];

export const RESEARCH_EXAMPLES = [
  'Research the current state of RAG systems in 2026',
  'Analyze the vector database market landscape',
  'Compare embedding models for production use',
];
