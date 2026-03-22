import React from 'react';
import { List } from 'lucide-react';
import type { ResearchReport } from './types';

interface ReportTableOfContentsProps {
  report: ResearchReport;
}

export const ReportTableOfContents: React.FC<ReportTableOfContentsProps> = ({ report }) => {
  const items: string[] = [];

  if (report.company_profile) items.push('Company Overview');
  if (report.key_findings?.length) items.push('Key Findings');
  if (report.financial_data?.length) items.push('Financial Performance');
  if (report.competitors?.length) items.push('Competitive Landscape');
  if (report.swot_analysis) items.push('SWOT Analysis');
  if (report.news_items?.length) items.push('News Intelligence');
  if (report.timeline?.length) items.push('Company Timeline');
  if (report.sections?.length) {
    report.sections.forEach((s) => items.push(s.title));
  }

  if (items.length === 0) return null;

  return (
    <nav className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/10 p-4" aria-label="Table of contents">
      <div className="flex items-center gap-2 mb-3">
        <List className="w-4 h-4 text-indigo-400" />
        <span className="text-body-sm font-semibold text-high-contrast">Contents</span>
      </div>
      <ol className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-body-sm text-medium-contrast hover:text-high-contrast transition-colors cursor-default truncate">
            <span className="text-[10px] text-low-contrast mr-2">{(i + 1).toString().padStart(2, '0')}</span>
            {item}
          </li>
        ))}
      </ol>
    </nav>
  );
};
