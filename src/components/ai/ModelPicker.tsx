import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Zap } from 'lucide-react';
import type { AIModel } from './types';

interface ModelPickerProps {
  models: AIModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}

const providerIcons: Record<string, React.ReactNode> = {
  gemini: <Zap className="w-3.5 h-3.5" />,
  groq: <Cpu className="w-3.5 h-3.5" />,
};

export function ModelPicker({ models, selectedModel, onSelect, disabled }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = models.find(m => m.id === selectedModel) || models[0];
  if (!current || models.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-medium-contrast/20 border border-medium-contrast/30 text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30 transition-colors disabled:opacity-50"
      >
        {providerIcons[current.provider] || <Cpu className="w-3.5 h-3.5" />}
        <span className="max-w-[100px] truncate">{current.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 rounded-xl border border-medium-contrast/50 bg-medium-contrast/95 backdrop-blur-sm shadow-lg py-1 z-50">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-low-contrast uppercase tracking-wider">
            AI Models
          </div>
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => { onSelect(model.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                model.id === selectedModel
                  ? 'text-accent-primary bg-accent-primary/10'
                  : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30'
              }`}
            >
              {providerIcons[model.provider] || <Cpu className="w-3.5 h-3.5" />}
              <span className="flex-1 text-left">{model.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                {model.tier === 'free' ? 'Free' : 'Paid'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
