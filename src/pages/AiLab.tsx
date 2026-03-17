import React from 'react';
import { Brain } from 'lucide-react';
import { appConfig } from '@/config/appConfig';
import { ResearchWorkspace } from '../components/ai/ResearchWorkspace';

export default function AiLab() {
  if (!appConfig.features.aiLab) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center px-4">
          <Brain className="w-16 h-16 text-low-contrast mx-auto mb-6" />
          <h1 className="text-headline font-bold text-high-contrast mb-4">AI Lab is currently disabled.</h1>
          <p className="text-body-lg text-medium-contrast">Check back soon — this feature is under development.</p>
        </div>
      </div>
    );
  }

  return <ResearchWorkspace />;
}
