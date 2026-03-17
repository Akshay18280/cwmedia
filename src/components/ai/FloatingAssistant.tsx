import React, { useState, lazy, Suspense } from 'react';
import { Bot, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';

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

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop: popup chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[min(400px,calc(100vw-2rem))] shadow-2xl rounded-2xl hidden sm:block"
          >
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
          </motion.button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 my-3" />
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<ChatFallback />}>
                <ChatWindow isPopup onClose={() => setDrawerOpen(false)} />
              </Suspense>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Desktop: FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all items-center justify-center hidden sm:flex"
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        <FabIcon isOpen={isOpen} />
      </motion.button>
    </>
  );
};
