import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Bot, X, Loader2, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResearchStore } from '@/stores/researchStore';

const ChatWindow = lazy(() => import('./ChatWindow').then(m => ({ default: m.ChatWindow })));

const ChatFallback = () => (
  <div className="h-[500px] rounded-2xl border border-medium-contrast/50 bg-white dark:bg-gray-900 backdrop-blur-sm flex items-center justify-center">
    <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
  </div>
);

const FabIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <AnimatePresence mode="wait">
    {isOpen ? (
      <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
        <X className="w-6 h-6" />
      </motion.div>
    ) : (
      <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
        <Bot className="w-6 h-6" />
      </motion.div>
    )}
  </AnimatePresence>
);

/** Context-aware greeting and quick actions based on current route */
function useContextAwareness() {
  const { pathname } = useLocation();
  const savedReports = useResearchStore((s) => s.savedReports);
  const lastReport = savedReports[0];

  if (pathname === '/') {
    return {
      greeting: 'Ready to research any topic with AI',
      quickActions: [
        { label: 'Start research', route: '/ai-lab', icon: Brain },
        { label: 'View dashboard', route: '/dashboard', icon: Sparkles },
      ],
    };
  }
  if (pathname === '/blog' || pathname.startsWith('/post/')) {
    return {
      greeting: 'Want to dive deeper into this topic?',
      quickActions: [
        { label: 'Research this topic', route: '/ai-lab', icon: Brain },
      ],
    };
  }
  if (pathname === '/dashboard') {
    return {
      greeting: lastReport ? `Last research: ${lastReport.title}` : 'Your research dashboard',
      quickActions: [
        { label: 'New research', route: '/ai-lab', icon: Sparkles },
      ],
    };
  }
  if (pathname === '/ai-lab') {
    return {
      greeting: 'Research session active',
      quickActions: [],
    };
  }
  return {
    greeting: 'How can I help?',
    quickActions: [
      { label: 'Start research', route: '/ai-lab', icon: Brain },
    ],
  };
}

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ctx = useContextAwareness();
  const savedReports = useResearchStore((s) => s.savedReports);

  // Notification badge: show when a new report arrives while assistant is closed
  const reportCountRef = React.useRef(savedReports.length);
  useEffect(() => {
    if (savedReports.length > reportCountRef.current && !isOpen && !drawerOpen) {
      setHasNotification(true);
    }
    reportCountRef.current = savedReports.length;
  }, [savedReports.length, isOpen, drawerOpen]);

  // Clear notification on open
  useEffect(() => {
    if (isOpen || drawerOpen) setHasNotification(false);
  }, [isOpen, drawerOpen]);

  // Hide on AI Lab page (already has full chat)
  if (pathname === '/ai-lab') return null;

  const handleQuickAction = (route: string) => {
    navigate(route);
    setIsOpen(false);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Desktop: popup chat window with context header */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[min(400px,calc(100vw-2rem))] shadow-2xl rounded-2xl hidden sm:block overflow-hidden"
          >
            {/* Context-aware header */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border-b border-medium-contrast/20 px-4 py-2.5">
              <p className="text-xs text-medium-contrast truncate">{ctx.greeting}</p>
              {ctx.quickActions.length > 0 && (
                <div className="flex gap-2 mt-1.5">
                  {ctx.quickActions.map((action) => (
                    <button
                      key={action.route}
                      onClick={() => handleQuickAction(action.route)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-accent-primary hover:text-indigo-400 transition-colors"
                    >
                      <action.icon className="w-3 h-3" />
                      {action.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Suspense fallback={<ChatFallback />}>
              <ChatWindow isPopup onClose={() => setIsOpen(false)} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: vaul drawer */}
      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Trigger asChild>
          <motion.button
            className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all flex items-center justify-center sm:hidden"
            whileTap={{ scale: 0.95 }}
            aria-label={drawerOpen ? 'Close AI assistant' : 'Open AI assistant'}
          >
            <FabIcon isOpen={drawerOpen} />
            {hasNotification && !drawerOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
            )}
          </motion.button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 my-3" />
            {/* Context bar for mobile */}
            <div className="px-4 pb-2 flex items-center gap-2">
              <p className="text-xs text-medium-contrast truncate flex-1">{ctx.greeting}</p>
              {ctx.quickActions.map((action) => (
                <button
                  key={action.route}
                  onClick={() => handleQuickAction(action.route)}
                  className="flex items-center gap-1 text-[11px] font-medium text-accent-primary"
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<ChatFallback />}>
                <ChatWindow isPopup onClose={() => setDrawerOpen(false)} />
              </Suspense>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Desktop: FAB button with notification badge */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all items-center justify-center hidden sm:flex"
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        <FabIcon isOpen={isOpen} />
        {hasNotification && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
        )}
      </motion.button>
    </>
  );
};
