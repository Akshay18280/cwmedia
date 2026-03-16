import React from 'react';
import { AlertTriangle, XCircle, Info, X, RefreshCw } from 'lucide-react';

type ErrorType = 'backend_unavailable' | 'no_documents' | 'rate_limited' | 'query_failed' | 'upload_failed';

interface ErrorBannerProps {
  type: ErrorType;
  message?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const CONFIG: Record<ErrorType, { icon: React.ReactNode; defaultMessage: string; color: string }> = {
  backend_unavailable: {
    icon: <XCircle className="w-4 h-4" />,
    defaultMessage: 'Backend is unavailable. Running in demo mode with simulated responses.',
    color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  },
  no_documents: {
    icon: <Info className="w-4 h-4" />,
    defaultMessage: 'No documents uploaded yet. Upload a document to start asking questions.',
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  },
  rate_limited: {
    icon: <AlertTriangle className="w-4 h-4" />,
    defaultMessage: 'Rate limit exceeded. Please wait a moment before trying again.',
    color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  },
  query_failed: {
    icon: <XCircle className="w-4 h-4" />,
    defaultMessage: 'Failed to process your question. Please try again.',
    color: 'border-red-500/50 bg-red-500/10 text-red-400',
  },
  upload_failed: {
    icon: <XCircle className="w-4 h-4" />,
    defaultMessage: 'Document upload failed. Please check the file and try again.',
    color: 'border-red-500/50 bg-red-500/10 text-red-400',
  },
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ type, message, onDismiss, onRetry }) => {
  const config = CONFIG[type];

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-xs ${config.color}`}>
      {config.icon}
      <span className="flex-1">{message || config.defaultMessage}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="hover:opacity-80 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
