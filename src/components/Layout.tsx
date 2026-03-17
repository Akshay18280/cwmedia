import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, LogOut, Settings, Brain, ChevronDown, Sparkles, LayoutDashboard } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import { NavSearchInput } from './NavSearchInput';
import { LiveNotifications } from './realtime/LiveNotifications';
import { appConfig } from '@/config/appConfig';
import { FloatingAssistant } from './ai/FloatingAssistant';
import { CommandPalette } from './CommandPalette';
import { useTheme } from '../hooks/useTheme';
import { useHotkeys } from 'react-hotkeys-hook';

const PRIMARY_NAV = [
  { name: 'Home', href: '/' },
  ...(appConfig.features.aiLab ? [
    { name: 'Research', href: '/ai-lab', icon: Brain },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ] : []),
];

const MORE_NAV = [
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'About Akshay', href: '/about-akshay' },
  { name: 'Contact', href: '/contact' },
];

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, signOut } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === 'dark';

  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcuts
  useHotkeys('shift+n', () => navigate('/ai-lab'), { preventDefault: true });
  useHotkeys('shift+/', () => navigate('/search'), { preventDefault: true });
  useHotkeys('shift+h', () => navigate('/'), { preventDefault: true });
  useHotkeys('shift+b', () => navigate('/blog'), { preventDefault: true });

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-high-contrast">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-medium-contrast/95 backdrop-blur-sm border-b border-medium-contrast">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 text-body-lg font-bold text-gradient-flow hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 bg-gradient-flow rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-body-sm">C</span>
              </div>
              <span className="hidden sm:block text-body font-bold">CWMedia</span>
            </Link>

            {/* Desktop: Nav + Search + Actions */}
            <div className="hidden md:flex items-center gap-1 flex-1 ml-6">
              {/* Primary nav links */}
              {PRIMARY_NAV.map((item) => {
                const Icon = (item as any).icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-accent-primary bg-accent-primary/10'
                        : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/40'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.name}
                  </Link>
                );
              })}

              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                    MORE_NAV.some((n) => isActive(n.href))
                      ? 'text-accent-primary bg-accent-primary/10'
                      : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/40'
                  }`}
                >
                  More
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border border-medium-contrast/50 bg-medium-contrast/95 backdrop-blur-sm shadow-lg py-1 z-50">
                    {MORE_NAV.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`block px-4 py-2 text-body-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-accent-primary bg-accent-primary/5'
                            : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Spacer + Search input */}
              <div className="flex-1 flex justify-center px-4">
                <NavSearchInput />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* New Research CTA */}
              {appConfig.features.aiLab && (
                <Link
                  to="/ai-lab"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-body-sm font-semibold hover:shadow-md hover:shadow-indigo-500/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  New Research
                </Link>
              )}

              {currentUser && (
                <LiveNotifications variant="dropdown" showSettings={true} />
              )}

              <ThemeToggle />

              {currentUser ? (
                <UserMenu />
              ) : (
                <Link
                  to="/login"
                  className="text-body-sm font-medium text-medium-contrast hover:text-high-contrast transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile: Actions + Hamburger */}
            <div className="md:hidden flex items-center gap-1">
              {currentUser && (
                <LiveNotifications variant="dropdown" showSettings={false} />
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-medium-contrast hover:text-high-contrast transition-colors rounded-lg"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden" ref={menuRef}>
            <div className="px-3 pt-2 pb-3 space-y-1 bg-medium-contrast border-t border-medium-contrast">
              {/* New Research CTA (mobile) */}
              {appConfig.features.aiLab && (
                <Link
                  to="/ai-lab"
                  className="flex items-center gap-2 px-3 py-3 text-body font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mb-2"
                >
                  <Sparkles className="w-4 h-4" />
                  New Research
                </Link>
              )}

              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-3 text-body font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-accent-primary bg-accent-primary/10'
                      : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-medium-contrast/50 pt-2 mt-2">
                {MORE_NAV.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-3 text-body font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'text-accent-primary bg-accent-primary/10'
                        : 'text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Mobile actions */}
              <div className="pt-2 border-t border-medium-contrast/50 space-y-1">
                <Link
                  to="/search"
                  className="flex items-center px-3 py-3 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Link>

                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>

                {currentUser ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-body-sm text-medium-contrast border-t border-medium-contrast/50">
                      Signed in as {currentUser.name}
                    </div>
                    {currentUser.isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-3 py-3 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-3 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="block px-3 py-3 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-medium-contrast/30 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Command Palette */}
      <CommandPalette onToggleTheme={toggleTheme} isDark={isDark} />

      {/* Floating AI Assistant */}
      {appConfig.features.aiLab && <FloatingAssistant />}

      {/* Footer */}
      <footer className="bg-medium-contrast border-t border-medium-contrast mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-2 mb-3">
                <div className="w-7 h-7 bg-gradient-flow rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-body-sm">C</span>
                </div>
                <span className="text-body font-bold text-gradient-flow">CWMedia</span>
              </Link>
              <p className="text-body-sm text-medium-contrast max-w-sm">
                AI-powered research intelligence platform. Multi-agent analysis, fact verification, and structured reports — at zero cost.
              </p>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-high-contrast mb-3">Platform</h3>
              <div className="space-y-1.5">
                <Link to="/ai-lab" className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors">AI Research</Link>
                <Link to="/blog" className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors">Blog</Link>
                <Link to="/about" className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors">About</Link>
                <Link to="/contact" className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold text-high-contrast mb-3">Built With</h3>
              <div className="space-y-1.5">
                <p className="text-body-sm text-medium-contrast">React + TypeScript + Vite</p>
                <p className="text-body-sm text-medium-contrast">Go + Gin + pgvector</p>
                <p className="text-body-sm text-medium-contrast">Gemini 2.5 Flash</p>
                <p className="text-body-sm text-medium-contrast">Multi-Agent Architecture</p>
              </div>
            </div>
          </div>

          <div className="border-t border-low-contrast mt-6 pt-6 text-center">
            <p className="text-caption text-low-contrast">
              © {new Date().getFullYear()} Carelwave Media. AI Research Intelligence Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
