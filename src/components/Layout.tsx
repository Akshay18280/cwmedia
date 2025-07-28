import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, LogOut, Settings, Sun, Moon, Mic, MicOff } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { SearchBar } from './search/SearchBar';
import { LiveNotifications } from './realtime/LiveNotifications';
import { ModernButton } from './ModernDesignSystem';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, signOut } = useAuth();
  const { isListening, toggleListening, isSupported } = useVoiceCommands();
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'About Akshay', href: '/about-akshay' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-high-contrast">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-medium-contrast/95 backdrop-blur-sm border-b border-medium-contrast">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-body-lg font-bold text-gradient-flow hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-flow rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-body">C</span>
              </div>
              <span className="hidden sm:block">Carelwave Media</span>
            </Link>

            {/* Desktop Navigation & Search */}
            <div className="hidden md:flex items-center space-x-6 flex-1 max-w-2xl mx-8">
              <SearchBar
                onSearch={handleSearch}
                onFiltersToggle={() => navigate('/search')}
                placeholder="Search posts, articles..."
                showVoiceSearch={true}
                showFilters={false}
                className="flex-1"
              />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-body-sm font-medium transition-colors hover:text-gradient-flow ${
                    location.pathname === item.href
                      ? 'text-gradient-flow'
                      : 'text-medium-contrast'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Voice Commands */}
              {isSupported && (
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'text-low-contrast hover:text-medium-contrast'
                  }`}
                  title={isListening ? 'Stop voice commands' : 'Start voice commands'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* Live Notifications */}
              {currentUser && (
                <LiveNotifications
                  variant="dropdown"
                  showSettings={true}
                />
              )}

              {/* Advanced Search Link */}
              <Link
                to="/search"
                className="p-2 text-low-contrast hover:text-medium-contrast transition-colors rounded-lg"
                title="Advanced search"
              >
                <Search className="w-5 h-5" />
              </Link>

              <ThemeToggle />

              {/* User Menu */}
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

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Notifications */}
              {currentUser && (
                <LiveNotifications
                  variant="dropdown"
                  showSettings={false}
                />
              )}
              
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 text-medium-contrast hover:text-high-contrast transition-colors rounded-lg"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-medium-contrast hover:text-high-contrast transition-colors rounded-lg"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showMobileSearch && (
            <div className="md:hidden py-4 border-t border-medium-contrast">
              <SearchBar
                onSearch={handleSearch}
                onFiltersToggle={() => navigate('/search')}
                placeholder="Search posts, articles..."
                showVoiceSearch={true}
                showFilters={true}
              />
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden" ref={menuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-medium-contrast border-t border-medium-contrast">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-body font-medium rounded-lg transition-colors ${
                    location.pathname === item.href
                      ? 'text-gradient-flow bg-low-contrast'
                      : 'text-medium-contrast hover:text-high-contrast hover:bg-low-contrast'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Actions */}
              <div className="pt-4 border-t border-low-contrast space-y-2">
                <Link
                  to="/search"
                  className="flex items-center px-3 py-2 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-low-contrast rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Advanced Search
                </Link>
                
                {isSupported && (
                  <button
                    onClick={toggleListening}
                    className={`flex items-center w-full px-3 py-2 text-body font-medium rounded-lg transition-colors ${
                      isListening
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'text-medium-contrast hover:text-high-contrast hover:bg-low-contrast'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                    {isListening ? 'Stop Voice Commands' : 'Voice Commands'}
                  </button>
                )}

                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>

                {currentUser ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-body-sm text-medium-contrast border-t border-low-contrast">
                      Signed in as {currentUser.name}
                    </div>
                                          {currentUser.isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-3 py-2 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-low-contrast rounded-lg transition-colors"
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-low-contrast rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-body font-medium text-medium-contrast hover:text-high-contrast hover:bg-low-contrast rounded-lg transition-colors"
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
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-medium-contrast border-t border-medium-contrast mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-flow rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-body">C</span>
                </div>
                <span className="text-body-lg font-bold text-gradient-flow">Carelwave Media</span>
              </Link>
              <p className="text-body text-medium-contrast mb-4 max-w-md">
                AI-powered content solutions that boost your rankings, drive conversions, and scale your business growth on autopilot.
              </p>
              <div className="flex items-center space-x-4">
                <Link to="/search" className="text-low-contrast hover:text-medium-contrast transition-colors">
                  <Search className="w-5 h-5" />
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-body font-semibold text-high-contrast mb-4">Quick Links</h3>
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/search"
                  className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors"
                >
                  Search
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-body font-semibold text-high-contrast mb-4">Resources</h3>
              <div className="space-y-2">
                <Link to="/theme-showcase" className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors">
                  Theme Showcase
                </Link>
                <Link to="/accent-test" className="block text-body-sm text-medium-contrast hover:text-high-contrast transition-colors">
                  Design System
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-low-contrast mt-8 pt-8 text-center">
            <p className="text-body-sm text-low-contrast">
              © 2025 Carelwave Media. Built with modern web technologies and real-time features.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}