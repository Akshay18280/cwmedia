import React from 'react';

interface ExamplePromptsProps {
  examples: string[];
  researchMode: boolean;
  onSelect: (question: string) => void;
}

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ examples, researchMode, onSelect }) => (
  <div className="px-4 pb-2">
    <p className="text-[10px] text-low-contrast uppercase tracking-wider font-semibold mb-2">
      {researchMode ? 'Try researching' : 'Try asking'}
    </p>
    <div className="flex flex-wrap gap-2">
      {examples.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
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
);
