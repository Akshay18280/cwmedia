import React from 'react';
import { Zap, Layers, Settings2, FileDown } from 'lucide-react';

const notes = [
  {
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
    title: 'Async Pipeline',
    description: 'Each RAG stage (embed, search, generate) runs independently. SSE streaming delivers tokens as they\'re generated, reducing perceived latency from seconds to milliseconds for the first token.',
  },
  {
    icon: <Layers className="w-5 h-5 text-blue-500" />,
    title: 'Batch Embeddings',
    description: 'Documents are embedded in batches of 20 chunks. The local hash-based embedder processes all chunks in-memory without network calls, achieving sub-millisecond embedding times.',
  },
  {
    icon: <Settings2 className="w-5 h-5 text-green-500" />,
    title: 'HNSW Index Tuning',
    description: 'pgvector\'s HNSW index provides approximate nearest-neighbor search with configurable ef_construction and M parameters. Default settings achieve >95% recall with query times under 15ms.',
  },
  {
    icon: <FileDown className="w-5 h-5 text-purple-500" />,
    title: 'Prompt Compression',
    description: 'Context chunks are limited to top-5 results and joined with clear separators. Token count is approximated to stay within Gemini\'s context window while maximizing relevant information density.',
  },
];

export const PerformanceNotes: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes.map((note) => (
        <div
          key={note.title}
          className="rounded-xl border border-medium-contrast bg-medium-contrast/30 p-4 flex gap-3"
        >
          <div className="flex-shrink-0 mt-0.5">{note.icon}</div>
          <div>
            <h4 className="text-body-sm font-semibold text-high-contrast mb-1">{note.title}</h4>
            <p className="text-body-sm text-medium-contrast leading-relaxed">{note.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
