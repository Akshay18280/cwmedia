import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const NavSearchInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/ai-lab?q=${encodeURIComponent(trimmed)}`);
    setQuery('');
  }, [query, navigate]);

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-xs" role="search" aria-label="Quick research">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-low-contrast pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Research anything..."
        className="w-full pl-8 pr-3 py-1.5 text-body-sm bg-medium-contrast/40 border border-medium-contrast/50 rounded-lg text-high-contrast placeholder:text-low-contrast focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/25 transition-colors"
      />
    </form>
  );
};
