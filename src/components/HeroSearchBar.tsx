import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXAMPLE_QUERIES = [
  'Research Tesla\'s market position in 2026',
  'Analyze the AI chip industry landscape',
  'Compare cloud providers: AWS vs Azure vs GCP',
  'Deep dive into the LLM market trends',
  'Evaluate Apple\'s financial performance',
];

const PLACEHOLDER_CYCLE = [
  'Research any company, technology, or market...',
  'Ask about industry trends and competitive analysis...',
  'Get AI-powered research with source verification...',
];

export const HeroSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const navigate = useNavigate();

  // Cycle placeholder text
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_CYCLE.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback((q?: string) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    navigate(`/ai-lab?q=${encodeURIComponent(searchQuery)}`);
  }, [query, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-0 blur-sm transition-opacity duration-300 ${isFocused ? 'opacity-60' : 'group-hover:opacity-30'}`} />
        <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl border border-medium-contrast/50 shadow-lg shadow-black/5 overflow-hidden">
          <Search className="w-5 h-5 text-low-contrast ml-4 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_CYCLE[placeholderIndex]}
            className="flex-1 px-4 py-4 bg-transparent text-body text-high-contrast placeholder:text-low-contrast focus:outline-none"
            aria-label="Research anything"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!query.trim()}
            className="mr-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:shadow-none flex items-center gap-2"
          >
            Research
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Example query pills */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="text-[10px] text-low-contrast uppercase tracking-wider font-semibold mr-1 self-center">Try:</span>
        {EXAMPLE_QUERIES.slice(0, 4).map((q, i) => (
          <motion.button
            key={q}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            onClick={() => handleSubmit(q)}
            className="text-xs px-3 py-1.5 rounded-lg border border-medium-contrast/40 text-medium-contrast hover:text-high-contrast hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
