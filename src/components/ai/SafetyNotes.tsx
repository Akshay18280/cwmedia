import React from 'react';
import { ShieldCheck, Lock, Eye } from 'lucide-react';

const safetyItems = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
    title: 'Hallucination Mitigation',
    description: 'System prompt constrains the LLM to answer only from provided context. Low temperature (0.3) reduces fabrication. Source citations enable verification.',
  },
  {
    icon: <Lock className="w-5 h-5 text-blue-500" />,
    title: 'Prompt Injection Protection',
    description: 'Input validation limits query length. System instructions use Gemini\'s separate systemInstruction field, reducing injection surface.',
  },
  {
    icon: <Eye className="w-5 h-5 text-purple-500" />,
    title: 'Context Constraints',
    description: 'Only top-5 chunks in context. Rate limiting (10 req/min) prevents abuse. Query Inspector provides full prompt transparency.',
  },
];

export const SafetyNotes: React.FC = () => {
  return (
    <div className="space-y-3">
      {safetyItems.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/20 p-4 flex gap-3"
        >
          <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
          <div>
            <h4 className="text-body-sm font-semibold text-high-contrast mb-1">{item.title}</h4>
            <p className="text-xs text-medium-contrast leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
