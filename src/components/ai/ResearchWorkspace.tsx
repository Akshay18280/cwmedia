import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Drawer } from 'vaul';
import { ChatWindow } from './ChatWindow';
import { ConversationSidebar } from './ConversationSidebar';
import { useResearchStore } from '@/stores/researchStore';

export const ResearchWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | null>(null);

  const addConversation = useResearchStore((s) => s.addConversation);
  const setActiveConversation = useResearchStore((s) => s.setActiveConversation);

  // Handle ?q= URL parameter for deep-linking
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setInitialQuery(q);
      // Create a new conversation for this query
      const convId = `conv-${Date.now()}`;
      addConversation({
        id: convId,
        title: q.slice(0, 60),
        createdAt: new Date().toISOString(),
        messageCount: 0,
      });
    }
  }, []); // Only on mount

  const handleNewConversation = useCallback(() => {
    const convId = `conv-${Date.now()}`;
    addConversation({
      id: convId,
      title: 'New Research',
      createdAt: new Date().toISOString(),
      messageCount: 0,
    });
    setMobileSidebarOpen(false);
  }, [addConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
      setMobileSidebarOpen(false);
    },
    [setActiveConversation],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col border-r border-medium-contrast/30 bg-medium-contrast/10 transition-all duration-200 ${
          sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
        }`}
      >
        {sidebarOpen && (
          <ConversationSidebar
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
          />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-medium-contrast/30">
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-1.5 rounded-lg text-low-contrast hover:text-high-contrast hover:bg-medium-contrast/20 transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {/* Mobile sidebar trigger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-low-contrast hover:text-high-contrast hover:bg-medium-contrast/20 transition-colors"
            aria-label="Open conversation history"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden px-4 py-4">
          <div className="max-w-3xl mx-auto h-full">
            <ChatWindow initialQuery={initialQuery ?? undefined} />
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      <Drawer.Root open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-medium-contrast/95 backdrop-blur-sm border-t border-medium-contrast/50 max-h-[75vh] flex flex-col">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-low-contrast/50 my-3" />
            <div className="flex-1 overflow-y-auto">
              <ConversationSidebar
                onNewConversation={handleNewConversation}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};
