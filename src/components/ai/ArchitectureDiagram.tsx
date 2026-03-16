import React, { useState } from 'react';
import { User, MessageSquare, Server, Hash, Database, GitFork, FileCode, Brain, ArrowDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiagramNode {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  tooltip: string;
  color: string;
}

const nodes: DiagramNode[] = [
  {
    icon: <User className="w-6 h-6 text-white" />,
    label: 'User',
    sublabel: 'Uploads docs & asks questions',
    tooltip:
      'The user interacts through a React-based chat interface. They can upload PDF, Markdown, or plain text documents and ask natural-language questions about their content.',
    color: 'bg-gradient-flow',
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-white" />,
    label: 'React Chat UI',
    sublabel: 'SSE streaming interface',
    tooltip:
      'A streaming chat UI built with React and TypeScript. Displays messages in real time via Server-Sent Events, shows live pipeline visualization, source citations, and query inspection.',
    color: 'bg-blue-500',
  },
  {
    icon: <Server className="w-6 h-6 text-white" />,
    label: 'Go API Gateway',
    sublabel: 'Gin REST + SSE endpoints',
    tooltip:
      'A high-performance Go REST API built with Gin. Handles document ingestion, text chunking (512 tokens, 50-token overlap), and query orchestration. Supports both standard and SSE streaming responses.',
    color: 'bg-cyan-600',
  },
  {
    icon: <Hash className="w-6 h-6 text-white" />,
    label: 'Embedding Service',
    sublabel: 'Local 512-dim hash embeddings',
    tooltip:
      'Zero-cost local embedding model using SHA256 n-gram hashing. Generates 512-dimensional vectors from text using unigrams, bigrams, and character trigrams with L2 normalization.',
    color: 'bg-orange-500',
  },
  {
    icon: <Database className="w-6 h-6 text-white" />,
    label: 'pgvector',
    sublabel: 'HNSW cosine similarity search',
    tooltip:
      'PostgreSQL with the pgvector extension stores 512-dimensional embeddings and performs HNSW-indexed approximate nearest-neighbor search using cosine distance to find the most relevant document chunks.',
    color: 'bg-indigo-600',
  },
  {
    icon: <GitFork className="w-6 h-6 text-white" />,
    label: 'Retriever',
    sublabel: 'Top-K chunk selection',
    tooltip:
      'Retrieves the top-5 most similar document chunks from pgvector based on cosine distance. These chunks form the context window for the LLM.',
    color: 'bg-teal-500',
  },
  {
    icon: <FileCode className="w-6 h-6 text-white" />,
    label: 'Prompt Builder',
    sublabel: 'Context + question assembly',
    tooltip:
      'Assembles the final prompt by combining a system instruction (constraining the model to answer only from context), the retrieved chunks as context, and the user\'s question.',
    color: 'bg-violet-500',
  },
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    label: 'Gemini 2.5 Flash',
    sublabel: 'Free-tier LLM generation',
    tooltip:
      'Google Gemini 2.5 Flash generates grounded answers from the retrieved context. Uses temperature 0.3 for factual accuracy, max 1024 output tokens. Supports streaming via SSE for real-time token delivery.',
    color: 'bg-holographic',
  },
];

export const ArchitectureDiagram: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      {nodes.map((node, i) => (
        <React.Fragment key={node.label}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="w-full"
          >
            <button
              type="button"
              onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
              onMouseEnter={() => setActiveTooltip(i)}
              onMouseLeave={() => setActiveTooltip(null)}
              className="relative flex items-center gap-4 w-full max-w-sm mx-auto rounded-xl px-4 py-3 transition-all hover:bg-low-contrast/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/40 text-left"
            >
              <div
                className={`w-12 h-12 ${node.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
              >
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-high-contrast">{node.label}</p>
                <p className="text-body-sm text-low-contrast">{node.sublabel}</p>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-low-contrast transition-transform flex-shrink-0 ${
                  activeTooltip === i ? 'rotate-90' : ''
                }`}
              />

              {activeTooltip === i && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-medium-contrast bg-medium-contrast/95 backdrop-blur-sm p-4 shadow-xl">
                  <p className="text-body-sm text-medium-contrast leading-relaxed">
                    {node.tooltip}
                  </p>
                </div>
              )}
            </button>
          </motion.div>

          {i < nodes.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.05 }}
              className="flex items-center justify-center py-0.5"
            >
              <ArrowDown className="w-5 h-5 text-accent-primary" />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
