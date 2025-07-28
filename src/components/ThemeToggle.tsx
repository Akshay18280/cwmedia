import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Check, 
  ChevronDown,
  Sparkles,
  Zap,
  Settings
} from 'lucide-react';
import { useTheme, type ThemeMode, type AccentColor } from '../hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'compact' | 'full' | 'minimal';
  showAccentPicker?: boolean;
  className?: string;
}

export default function ThemeToggle({ 
  variant = 'compact', 
  showAccentPicker = true, 
  className = '' 
}: ThemeToggleProps) {
  const {
    mode,
    accentColor,
    isTransitioning,
    systemPreference,
    setTheme,
    setAccentColor,
    toggleTheme,
    cycleTheme,
    getCurrentTheme
  } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccentPickerOpen, setIsAccentPickerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (accentRef.current && !accentRef.current.contains(event.target as Node)) {
        setIsAccentPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsAccentPickerOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (variant === 'minimal') {
        toggleTheme();
      } else {
        setIsDropdownOpen(!isDropdownOpen);
      }
    }
  };

  const themeOptions: Array<{
    mode: ThemeMode;
    icon: React.ReactNode;
    label: string;
    description: string;
  }> = [
    {
      mode: 'light',
      icon: <Sun className="w-4 h-4" />,
      label: 'Light',
      description: 'Clean and bright interface'
    },
    {
      mode: 'dark',
      icon: <Moon className="w-4 h-4" />,
      label: 'Dark',
      description: 'Easy on the eyes'
    },
    {
      mode: 'auto',
      icon: <Monitor className="w-4 h-4" />,
      label: 'Auto',
      description: `Follows system (${systemPreference})`
    }
  ];

  const accentOptions: Array<{
    color: AccentColor;
    name: string;
    colors: { light: string; dark: string };
  }> = [
    {
      color: 'blue',
      name: 'Ocean Blue',
      colors: { light: 'bg-blue-500', dark: 'bg-blue-400' }
    },
    {
      color: 'purple',
      name: 'Royal Purple',
      colors: { light: 'bg-purple-500', dark: 'bg-purple-400' }
    },
    {
      color: 'green',
      name: 'Forest Green',
      colors: { light: 'bg-green-500', dark: 'bg-green-400' }
    },
    {
      color: 'orange',
      name: 'Sunset Orange',
      colors: { light: 'bg-orange-500', dark: 'bg-orange-400' }
    },
    {
      color: 'pink',
      name: 'Cherry Pink',
      colors: { light: 'bg-pink-500', dark: 'bg-pink-400' }
    }
  ];

  const getCurrentIcon = () => {
    const current = getCurrentTheme();
    if (mode === 'auto') {
      return <Monitor className="w-5 h-5" />;
    }
    return current === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
  };

  // Minimal variant - simple toggle button
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        disabled={isTransitioning}
        className={`
          relative p-2 rounded-lg transition-all duration-300 ease-out
          text-gray-600 dark:text-gray-300 
          hover:bg-gray-100 dark:hover:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transform hover:scale-105 active:scale-95
          ${className}
        `}
        aria-label={`Switch to ${getCurrentTheme() === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className={`transition-transform duration-300 ${isTransitioning ? 'rotate-180' : ''}`}>
          {getCurrentIcon()}
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-10 bg-gradient-to-r from-blue-500 to-purple-500 transition-opacity duration-300" />
      </button>
    );
  }

  // Compact variant - dropdown with theme options
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onKeyDown={handleKeyDown}
          disabled={isTransitioning}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300
            text-gray-600 dark:text-gray-300 
            hover:bg-gray-100 dark:hover:bg-gray-800
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transform hover:scale-105 active:scale-95
            ${isDropdownOpen ? 'bg-medium-contrast' : ''}
          `}
          aria-label="Theme settings"
          aria-expanded={isDropdownOpen}
        >
          <div className={`transition-transform duration-300 ${isTransitioning ? 'rotate-180' : ''}`}>
            {getCurrentIcon()}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-medium-contrast rounded-xl shadow-2xl border border-low-contrast z-50 overflow-hidden">
            <div className="p-3">
              <h3 className="text-body-sm font-semibold text-high-contrast mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Theme Settings
              </h3>
              
              {/* Theme Options */}
              <div className="space-y-1 mb-3">
                {themeOptions.map((option) => (
                  <button
                    key={option.mode}
                    onClick={() => {
                      setTheme(option.mode);
                      setIsDropdownOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      ${mode === option.mode ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-high-contrast'}
                    `}
                  >
                    <div className="flex-shrink-0">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-body-sm font-medium">{option.label}</div>
                      <div className="text-caption opacity-70">{option.description}</div>
                    </div>
                    {mode === option.mode && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Accent Color Picker */}
              {showAccentPicker && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-caption font-medium text-medium-contrast flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      Accent Color
                    </span>
                  </div>
                  {/* Accent Color Options */}
                  <div className="flex gap-2">
                    {(['blue', 'purple', 'green', 'orange', 'pink'] as AccentColor[]).map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          accentColor === color 
                            ? 'border-white shadow-md' 
                            : 'border-medium-contrast'
                        }`}
                        style={{
                          background: color === 'blue' 
                            ? 'linear-gradient(-45deg, #3b82f6, #60a5fa, #93c5fd)' 
                            : color === 'purple'
                            ? 'linear-gradient(-45deg, #8b5cf6, #a78bfa, #c4b5fd)'
                            : color === 'green'
                            ? 'linear-gradient(-45deg, #10b981, #34d399, #6ee7b7)'
                            : color === 'orange'
                            ? 'linear-gradient(-45deg, #f59e0b, #fbbf24, #fcd34d)'
                            : 'linear-gradient(-45deg, #ec4899, #f472b6, #f9a8d4)',
                          backgroundSize: '200% 200%',
                          animation: accentColor === color ? 'gradient-flow 3s ease infinite' : 'none'
                        }}
                        title={`${color.charAt(0).toUpperCase() + color.slice(1)} gradient theme`}
                        aria-label={`Select ${color} gradient accent color`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant - expanded controls
  return (
    <div className={`bg-medium-contrast rounded-xl p-4 shadow-lg border border-low-contrast ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body font-semibold text-high-contrast flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Appearance
        </h3>
        <div className={`transition-transform duration-300 ${isTransitioning ? 'rotate-180' : ''}`}>
          {getCurrentIcon()}
        </div>
      </div>

      {/* Theme Mode Selection */}
      <div className="mb-6">
        <label className="block text-body-sm font-medium text-high-contrast mb-3">
          Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.mode}
              onClick={() => setTheme(option.mode)}
              disabled={isTransitioning}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 border-2
                ${mode === option.mode 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-high-contrast'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                transform hover:scale-105 active:scale-95
              `}
            >
              {option.icon}
              <span className="text-caption font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Selection */}
      {showAccentPicker && (
        <div>
          <label className="block text-body-sm font-medium text-high-contrast mb-3">
            Accent Color
          </label>
          <div className="grid grid-cols-5 gap-3">
            {accentOptions.map((option) => (
              <button
                key={option.color}
                onClick={() => setAccentColor(option.color)}
                className={`
                  aspect-square rounded-lg transition-all duration-200 border-2 p-1
                  ${accentColor === option.color 
                    ? 'border-gray-400 dark:border-gray-600' 
                    : 'border-low-contrast hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  transform hover:scale-110 active:scale-95
                `}
                title={option.name}
              >
                <div className={`w-full h-full rounded-md ${option.colors.light} ${option.colors.dark} flex items-center justify-center`}>
                  {accentColor === option.color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-low-contrast">
        <div className="flex gap-2">
          <button
            onClick={cycleTheme}
            disabled={isTransitioning}
            className="flex items-center gap-2 px-3 py-2 text-body-sm font-medium text-medium-contrast hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Quick Cycle
          </button>
        </div>
      </div>
    </div>
  );
} 