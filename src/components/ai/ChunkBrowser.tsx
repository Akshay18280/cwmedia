import React, { useEffect, useState } from 'react';
import { FileText, ChevronRight, Database, Hash, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { appConfig } from '@/config/appConfig';

interface DocInfo {
  id: string;
  filename: string;
  uploaded_at: string;
  chunk_count: number;
}

interface ChunkInfo {
  id: string;
  content: string;
  preview: string;
}

export const ChunkBrowser: React.FC = () => {
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_documents: number; total_chunks: number } | null>(null);

  const apiBase = appConfig.ai.apiBaseUrl;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, statsRes] = await Promise.all([
          fetch(`${apiBase}/api/documents`, { signal: AbortSignal.timeout(5000) }),
          fetch(`${apiBase}/api/stats`, { signal: AbortSignal.timeout(5000) }),
        ]);

        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocs(data.documents || []);
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        setError(null);
      } catch {
        setError('Backend unavailable. Connect the Go backend to browse indexed documents.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBase]);

  const loadChunks = async (docId: string) => {
    if (selectedDoc === docId) {
      setSelectedDoc(null);
      setChunks([]);
      return;
    }
    setSelectedDoc(docId);
    setLoadingChunks(true);
    try {
      const res = await fetch(`${apiBase}/api/documents/${docId}/chunks`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
      }
    } catch {
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-medium-contrast bg-medium-contrast/30 p-8 text-center">
        <Loader2 className="w-6 h-6 text-accent-primary animate-spin mx-auto mb-3" />
        <p className="text-body-sm text-low-contrast">Loading indexed documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-medium-contrast bg-medium-contrast/30 p-8 text-center">
        <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-3" />
        <p className="text-body-sm text-medium-contrast mb-2">{error}</p>
        <p className="text-xs text-low-contrast">
          Run <code className="bg-low-contrast/50 px-1.5 py-0.5 rounded text-accent-primary">cd backend && go run ./cmd/server/</code> to start
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && (
        <div className="flex gap-6 justify-center">
          <div className="flex items-center gap-2 text-body-sm">
            <FileText className="w-4 h-4 text-accent-primary" />
            <span className="text-high-contrast font-semibold">{stats.total_documents}</span>
            <span className="text-low-contrast">documents</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm">
            <Database className="w-4 h-4 text-accent-primary" />
            <span className="text-high-contrast font-semibold">{stats.total_chunks}</span>
            <span className="text-low-contrast">chunks</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm">
            <Hash className="w-4 h-4 text-accent-primary" />
            <span className="text-high-contrast font-semibold">512</span>
            <span className="text-low-contrast">dimensions</span>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-2">
        {docs.length === 0 && (
          <div className="rounded-xl border border-dashed border-medium-contrast p-6 text-center">
            <p className="text-body-sm text-low-contrast">No documents indexed yet. Upload a document above to get started.</p>
          </div>
        )}

        {docs.map((doc) => (
          <div key={doc.id}>
            <button
              onClick={() => loadChunks(doc.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                selectedDoc === doc.id
                  ? 'border-accent-primary bg-accent-primary/5'
                  : 'border-medium-contrast bg-medium-contrast/20 hover:bg-medium-contrast/40'
              }`}
              aria-expanded={selectedDoc === doc.id}
              aria-label={`View chunks for ${doc.filename}`}
            >
              <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-high-contrast truncate">{doc.filename}</p>
                <p className="text-xs text-low-contrast">{doc.chunk_count} chunks</p>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-low-contrast transition-transform ${
                  selectedDoc === doc.id ? 'rotate-90' : ''
                }`}
              />
            </button>

            {/* Chunks panel */}
            <AnimatePresence>
              {selectedDoc === doc.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="ml-5 pl-4 border-l-2 border-accent-primary/30 mt-2 space-y-2 pb-2">
                    {loadingChunks ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-low-contrast">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading chunks...
                      </div>
                    ) : (
                      chunks.map((chunk, i) => (
                        <button
                          key={chunk.id}
                          onClick={() => setExpandedChunk(expandedChunk === chunk.id ? null : chunk.id)}
                          className="w-full text-left rounded-lg border border-medium-contrast/60 bg-medium-contrast/10 px-3 py-2.5 hover:bg-medium-contrast/30 transition-colors"
                          aria-label={`Chunk ${i + 1}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-accent-primary">
                              Chunk {i + 1}
                            </span>
                            <span className="text-[10px] font-mono text-low-contrast">
                              {chunk.id.slice(0, 8)}...
                            </span>
                          </div>
                          <p className="text-xs text-medium-contrast leading-relaxed">
                            {expandedChunk === chunk.id
                              ? chunk.content
                              : chunk.preview || chunk.content.slice(0, 150) + '...'}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
