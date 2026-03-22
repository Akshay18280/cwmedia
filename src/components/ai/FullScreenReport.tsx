import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReportViewer } from './ReportViewer';
import type { ResearchReport } from './types';

interface FullScreenReportProps {
  report: ResearchReport;
  open: boolean;
  onClose: () => void;
}

export const FullScreenReport: React.FC<FullScreenReportProps> = ({ report, open, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
      closeRef.current?.focus();
    } else if (prevFocusRef.current instanceof HTMLElement) {
      prevFocusRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-high-contrast/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Research report"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-medium-contrast/80 backdrop-blur border-b border-medium-contrast/30">
            <h2 className="text-body font-semibold text-high-contrast truncate">{report.title}</h2>
            <button
              ref={closeRef}
              onClick={onClose}
              className="p-2 rounded-lg text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/20 transition-colors"
              aria-label="Close fullscreen report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report content */}
          <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <ReportViewer report={report} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
