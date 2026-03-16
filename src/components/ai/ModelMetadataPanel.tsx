import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { appConfig } from '@/config/appConfig';

interface Metadata {
  llm_provider: string;
  llm_model: string;
  embedding_model: string;
  embedding_dimensions: number;
  vector_db: string;
  similarity_metric: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  max_tokens: number;
  temperature: number;
}

const DEFAULTS: Metadata = {
  llm_provider: 'gemini',
  llm_model: 'gemini-2.5-flash',
  embedding_model: 'local-hash-512d',
  embedding_dimensions: 512,
  vector_db: 'pgvector',
  similarity_metric: 'cosine',
  chunk_size: 512,
  chunk_overlap: 50,
  top_k: 5,
  max_tokens: 1024,
  temperature: 0.3,
};

const LABELS: Record<string, string> = {
  llm_provider: 'LLM Provider',
  llm_model: 'Model',
  embedding_model: 'Embeddings',
  embedding_dimensions: 'Dimensions',
  vector_db: 'Vector DB',
  similarity_metric: 'Similarity',
  chunk_size: 'Chunk Size',
  chunk_overlap: 'Overlap',
  top_k: 'Top-K',
  max_tokens: 'Max Tokens',
  temperature: 'Temperature',
};

export const ModelMetadataPanel: React.FC = () => {
  const [metadata, setMetadata] = useState<Metadata>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${appConfig.ai.apiBaseUrl}/api/metadata`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          setMetadata({ ...DEFAULTS, ...data });
        }
      } catch {
        // Use defaults
      }
    })();
  }, []);

  const entries = Object.entries(metadata) as [keyof Metadata, string | number][];

  return (
    <div className="rounded-xl border border-medium-contrast bg-medium-contrast/30 p-4">
      <h4 className="text-body-sm font-semibold text-high-contrast mb-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-accent-primary" />
        Model Configuration
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-xs text-low-contrast">{LABELS[key] || key}</span>
            <span className="text-xs text-high-contrast font-mono">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
