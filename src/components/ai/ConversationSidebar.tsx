import React from 'react';
import { Brain, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useResearchStore, type ConversationMeta } from '@/stores/researchStore';

interface ConversationSidebarProps {
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  onNewConversation,
  onSelectConversation,
}) => {
  const conversations = useResearchStore((s) => s.conversations);
  const activeId = useResearchStore((s) => s.activeConversationId);
  const removeConversation = useResearchStore((s) => s.removeConversation);
  const savedReports = useResearchStore((s) => s.savedReports);

  return (
    <div className="flex flex-col h-full" role="navigation" aria-label="Research history">
      {/* New conversation button */}
      <div className="p-3 border-b border-medium-contrast/30">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-medium-contrast/40 text-body-sm font-medium text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Research
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="w-8 h-8 text-low-contrast mx-auto mb-2" />
            <p className="text-body-sm text-low-contrast">Your conversations will appear here</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full group flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                conv.id === activeId
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/20'
              }`}
              aria-current={conv.id === activeId ? 'true' : undefined}
            >
              <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium truncate">{conv.title}</div>
                <div className="text-caption text-low-contrast">
                  {conv.messageCount} messages · {new Date(conv.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-low-contrast hover:text-red-500 transition-all"
                aria-label={`Delete conversation: ${conv.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))
        )}
      </div>

      {/* Recent reports summary */}
      {savedReports.length > 0 && (
        <div className="border-t border-medium-contrast/30 p-3">
          <div className="text-caption font-semibold text-low-contrast uppercase tracking-wider mb-2">
            Recent Reports
          </div>
          <div className="space-y-1">
            {savedReports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="px-2 py-1.5 rounded text-caption text-medium-contrast truncate"
                title={report.title}
              >
                {report.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
