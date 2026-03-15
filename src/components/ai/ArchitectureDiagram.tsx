import React, { useState } from 'react';
import { User, MessageSquare, Server, Database, Brain, ArrowDown, ChevronRight } from 'lucide-react';

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
    sublabel: 'Interactive chat interface',
    tooltip:
      'A streaming chat UI built with React and TypeScript. Displays messages in real time, supports file uploads via drag-and-drop, and shows backend connection status.',
    color: 'bg-blue-500',
  },
  {
    icon: <Server className="w-6 h-6 text-white" />,
    label: 'Golang API',
    sublabel: 'REST API & orchestration',
    tooltip:
      'A high-performance Go REST API that handles document ingestion, text chunking (512 tokens, 50-token overlap), embedding generation, and query orchestration between the vector database and LLM.',
    color: 'bg-cyan-600',
  },
  {
    icon: <Database className="w-6 h-6 text-white" />,
    label: 'pgvector',
    sublabel: 'Vector similarity search',
    tooltip:
      'PostgreSQL with the pgvector extension stores 1536-dimensional embeddings and performs HNSW-indexed approximate nearest-neighbor search to find the most relevant document chunks for a query.',
    color: 'bg-indigo-600',
  },
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    label: 'LLM',
    sublabel: 'Answer generation',
    tooltip:
      'A pluggable LLM provider (OpenAI, Anthropic, or local models) receives the retrieved document chunks as context and generates a grounded answer to the user\'s question.',
    color: 'bg-holographic',
  },
];

export const ArchitectureDiagram: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      {nodes.map((node, i) => (
        <React.Fragment key={node.label}>
          {/* Node */}
          <button
            type="button"
            onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
            onMouseEnter={() => setActiveTooltip(i)}
            onMouseLeave={() => setActiveTooltip(null)}
            className="relative flex items-center gap-4 w-full max-w-sm rounded-xl px-4 py-3 transition-all hover:bg-low-contrast/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/40 text-left"
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

            {/* Tooltip */}
            {activeTooltip === i && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-medium-contrast bg-medium-contrast/95 backdrop-blur-sm p-4 shadow-xl">
                <p className="text-body-sm text-medium-contrast leading-relaxed">
                  {node.tooltip}
                </p>
              </div>
            )}
          </button>

          {/* Arrow */}
          {i < nodes.length - 1 && (
            <div className="flex items-center justify-center py-0.5">
              <ArrowDown className="w-5 h-5 text-accent-primary" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
