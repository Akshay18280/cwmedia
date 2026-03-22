import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  Home, User, Brain, Mail, BookOpen, Search,
  Sun, Moon, Sparkles, LayoutDashboard, Download,
  FileText, Clock, Zap,
} from 'lucide-react';
import { useResearchStore } from '@/stores/researchStore';

interface CommandPaletteProps {
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onToggleTheme, isDark }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const savedReports = useResearchStore((s) => s.savedReports);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-xl border border-medium-contrast/50 bg-medium-contrast/95 backdrop-blur-sm shadow-2xl overflow-hidden"
          label="Command Palette"
        >
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 text-sm bg-transparent border-b border-medium-contrast/30 text-high-contrast placeholder:text-low-contrast outline-none"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-medium-contrast">
              No results found.
            </Command.Empty>

            {/* AI Research group */}
            <Command.Group heading="AI Research" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-accent-primary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <CommandItem
                icon={<Sparkles className="w-4 h-4" />}
                onSelect={() => runAction(() => navigate('/ai-lab'))}
                keywords={['ai', 'research', 'deep', 'new']}
              >
                New Research
              </CommandItem>
              <CommandItem
                icon={<LayoutDashboard className="w-4 h-4" />}
                onSelect={() => runAction(() => navigate('/dashboard'))}
                keywords={['dashboard', 'history', 'reports', 'saved']}
              >
                Research Dashboard
              </CommandItem>
              <CommandItem
                icon={<Search className="w-4 h-4" />}
                onSelect={() => runAction(() => navigate('/search'))}
                keywords={['search', 'find', 'documents']}
              >
                Search Documents
              </CommandItem>
              <CommandItem
                icon={<Zap className="w-4 h-4" />}
                onSelect={() => runAction(() => navigate('/automation-lab'))}
                keywords={['automation', 'lab', 'pipeline', 'n8n', 'publish', 'blog']}
              >
                Automation Lab
              </CommandItem>
            </Command.Group>

            {/* Recent research */}
            {savedReports.length > 0 && (
              <>
                <Command.Separator className="my-1 h-px bg-medium-contrast/20" />
                <Command.Group heading="Recent Research" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-low-contrast [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  {savedReports.slice(0, 5).map((report) => (
                    <CommandItem
                      key={report.id}
                      icon={<Clock className="w-4 h-4" />}
                      onSelect={() => runAction(() => navigate(`/ai-lab?q=${encodeURIComponent(report.title)}`))}
                      keywords={report.title.toLowerCase().split(/\s+/)}
                    >
                      <span className="truncate">{report.title}</span>
                      <span className="ml-auto text-[10px] text-low-contrast flex-shrink-0">
                        {report.confidence.toFixed(0)}%
                      </span>
                    </CommandItem>
                  ))}
                </Command.Group>
              </>
            )}

            <Command.Separator className="my-1 h-px bg-medium-contrast/20" />

            {/* Navigation */}
            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-low-contrast [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <CommandItem icon={<Home className="w-4 h-4" />} onSelect={() => runAction(() => navigate('/'))}>
                Home
              </CommandItem>
              <CommandItem icon={<Brain className="w-4 h-4" />} onSelect={() => runAction(() => navigate('/ai-lab'))}>
                AI Research Lab
              </CommandItem>
              <CommandItem icon={<BookOpen className="w-4 h-4" />} onSelect={() => runAction(() => navigate('/blog'))}>
                Blog
              </CommandItem>
              <CommandItem icon={<User className="w-4 h-4" />} onSelect={() => runAction(() => navigate('/about-akshay'))}>
                About Akshay
              </CommandItem>
              <CommandItem icon={<Mail className="w-4 h-4" />} onSelect={() => runAction(() => navigate('/contact'))}>
                Contact
              </CommandItem>
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-medium-contrast/20" />

            {/* Actions */}
            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-low-contrast [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <CommandItem
                icon={isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                onSelect={() => runAction(() => onToggleTheme?.())}
              >
                Toggle {isDark ? 'Light' : 'Dark'} Mode
              </CommandItem>
            </Command.Group>
          </Command.List>

          <div className="border-t border-medium-contrast/20 px-4 py-2 flex items-center justify-between text-[10px] text-low-contrast">
            <span>Navigate with <kbd className="px-1 py-0.5 rounded bg-medium-contrast/30 font-mono">↑↓</kbd></span>
            <span><kbd className="px-1 py-0.5 rounded bg-medium-contrast/30 font-mono">Enter</kbd> to select · <kbd className="px-1 py-0.5 rounded bg-medium-contrast/30 font-mono">Esc</kbd> to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

const CommandItem: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
  keywords?: string[];
}> = ({ icon, children, onSelect, keywords }) => (
  <Command.Item
    onSelect={onSelect}
    keywords={keywords}
    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-medium-contrast data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-high-contrast transition-colors"
  >
    <span className="text-low-contrast">{icon}</span>
    <span className="flex-1 min-w-0 flex items-center gap-2">{children}</span>
  </Command.Item>
);
