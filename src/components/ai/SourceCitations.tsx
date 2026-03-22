import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourceChunk } from './types';

interface SourceCitationsProps {
  sources: SourceChunk[];
}

export const SourceCitations: React.FC<SourceCitationsProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
      >
        <FileText className="w-3 h-3" />
        View Sources ({sources.length})
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {sources.map((source, i) => {
                const similarity = Math.max(0, Math.round((1 - source.distance) * 100));
                return (
                  <div
                    key={source.chunk_id || i}
                    className="rounded-lg border border-medium-contrast bg-medium-contrast/30 p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                        {source.document_filename}
                      </span>
                      <span className="text-xs text-low-contrast font-mono">
                        {similarity}% match
                      </span>
                    </div>
                    <p className="text-xs text-medium-contrast leading-relaxed line-clamp-3">
                      {source.content.slice(0, 200)}
                      {source.content.length > 200 && '...'}
                    </p>
                    <div className="mt-1.5 h-1 rounded-full bg-low-contrast/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-primary/60 transition-all"
                        style={{ width: `${similarity}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
