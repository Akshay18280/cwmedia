import React from 'react';
import { Bot, Loader2, Wifi, WifiOff, CircleDot, Trash2, FlaskConical, Maximize2, Minimize2, X } from 'lucide-react';
import type { BackendStatus } from '@/hooks/useChat';

type WindowMode = 'normal' | 'maximized' | 'minimized';

interface ChatHeaderProps {
  backendStatus: BackendStatus;
  researchMode: boolean;
  onToggleResearch: () => void;
  messagesCount: number;
  onClearChat: () => void;
  windowMode: WindowMode;
  onSetWindowMode: (mode: WindowMode) => void;
  isPopup: boolean;
  onClose?: () => void;
}

const statusConfig = {
  checking: { color: 'text-yellow-500', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Checking...' },
  connected: { color: 'text-green-500', icon: <Wifi className="w-3 h-3" />, label: 'Connected' },
  demo: { color: 'text-yellow-500', icon: <CircleDot className="w-3 h-3" />, label: 'Demo mode' },
  unavailable: { color: 'text-red-500', icon: <WifiOff className="w-3 h-3" />, label: 'Unavailable' },
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  backendStatus,
  researchMode,
  onToggleResearch,
  messagesCount,
  onClearChat,
  windowMode,
  onSetWindowMode,
  isPopup,
  onClose,
}) => {
  const status = statusConfig[backendStatus];

  return (
    <div className="px-4 py-2.5 border-b border-medium-contrast/40 bg-gradient-to-r from-medium-contrast/60 via-medium-contrast/40 to-medium-contrast/60 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-accent-primary" />
        <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
        <span className="text-body-sm font-semibold text-high-contrast">
          {researchMode ? 'Research Copilot' : 'AI Copilot'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {backendStatus === 'connected' && (
            <button
              onClick={onToggleResearch}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-all ${
                researchMode
                  ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                  : 'text-low-contrast hover:text-high-contrast hover:bg-medium-contrast/40'
              }`}
              title={researchMode ? 'Switch to Chat' : 'Switch to Research'}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Research
            </button>
          )}

          {messagesCount > 1 && (
            <button onClick={onClearChat} className="p-1 text-low-contrast hover:text-high-contrast transition-colors rounded-md hover:bg-medium-contrast/40" title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {!isPopup && (
            <>
              <button
                onClick={() => onSetWindowMode(windowMode === 'minimized' ? 'normal' : 'minimized')}
                className="p-1 text-low-contrast hover:text-high-contrast transition-colors rounded-md hover:bg-medium-contrast/40"
                title={windowMode === 'minimized' ? 'Expand' : 'Minimize'}
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSetWindowMode(windowMode === 'maximized' ? 'normal' : 'maximized')}
                className="p-1 text-low-contrast hover:text-high-contrast transition-colors rounded-md hover:bg-medium-contrast/40"
                title={windowMode === 'maximized' ? 'Restore' : 'Maximize'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {isPopup && onClose && (
            <button onClick={onClose} className="p-1 text-low-contrast hover:text-high-contrast transition-colors rounded-md hover:bg-medium-contrast/40" title="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <span className={`flex items-center gap-1 text-[10px] font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
};
