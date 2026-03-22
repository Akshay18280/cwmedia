import React from 'react';
import { BookOpen, Scale, Code2, HeadphonesIcon } from 'lucide-react';

const useCases = [
  {
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
    title: 'Internal Knowledge Search',
    description: 'Enable employees to search company wikis, SOPs, and policy documents using natural language instead of keyword-based search.',
    borderColor: 'border-l-blue-500',
  },
  {
    icon: <Scale className="w-5 h-5 text-amber-500" />,
    title: 'Legal Document Analysis',
    description: 'Upload contracts, legal briefs, or regulations and ask specific questions about clauses, obligations, and compliance requirements.',
    borderColor: 'border-l-amber-500',
  },
  {
    icon: <Code2 className="w-5 h-5 text-green-500" />,
    title: 'Developer Documentation',
    description: 'Index API docs, READMEs, and code comments to create an intelligent assistant that helps developers find answers without leaving their workflow.',
    borderColor: 'border-l-green-500',
  },
  {
    icon: <HeadphonesIcon className="w-5 h-5 text-purple-500" />,
    title: 'Customer Support',
    description: 'Build a support bot grounded in your help center articles, FAQs, and troubleshooting guides. Every answer is traceable to a source document.',
    borderColor: 'border-l-purple-500',
  },
];

export const UseCases: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {useCases.map((uc) => (
        <div
          key={uc.title}
          className={`rounded-xl border border-medium-contrast bg-medium-contrast/30 p-4 border-l-4 ${uc.borderColor} flex gap-3`}
        >
          <div className="flex-shrink-0 mt-0.5">{uc.icon}</div>
          <div>
            <h4 className="text-body-sm font-semibold text-high-contrast mb-1">{uc.title}</h4>
            <p className="text-body-sm text-medium-contrast leading-relaxed">{uc.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
