import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

interface ThemeConfig {
  mode: ThemeMode;
  accentColor: AccentColor;
  isTransitioning: boolean;
  systemPreference: 'light' | 'dark';
}

interface ThemeActions {
  setTheme: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
  getCurrentTheme: () => 'light' | 'dark';
}

const THEME_STORAGE_KEY = 'carelwave-theme-config';
const ACCENT_STORAGE_KEY = 'carelwave-accent-color';

export function useTheme(): ThemeConfig & ThemeActions {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  // Detect system preference
  const detectSystemPreference = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Get the current effective theme
  const getCurrentTheme = useCallback((): 'light' | 'dark' => {
    if (mode === 'auto') {
      return systemPreference;
    }
    return mode;
  }, [mode, systemPreference]);

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark', accent: AccentColor, smooth = true) => {
    if (typeof document === 'undefined') return;

    if (smooth) {
      setIsTransitioning(true);
      
      // Add transition classes
      document.documentElement.classList.add('theme-transitioning');
      
      // Apply theme after a brief delay for smooth transition
      setTimeout(() => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Apply accent color
        document.documentElement.setAttribute('data-accent', accent);
        
        // Remove transition class after animation
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
          setIsTransitioning(false);
        }, 300);
      }, 50);
    } else {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.setAttribute('data-accent', accent);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((themeMode: ThemeMode, accent: AccentColor) => {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
      localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }, []);

  // Load preferences from localStorage
  const loadPreferences = useCallback((): { mode: ThemeMode; accent: AccentColor } => {
    if (typeof localStorage === 'undefined') {
      return { mode: 'auto', accent: 'blue' };
    }
    
    try {
      const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor;
      
      return {
        mode: savedMode && ['light', 'dark', 'auto'].includes(savedMode) ? savedMode : 'auto',
        accent: savedAccent && ['blue', 'purple', 'green', 'orange', 'pink'].includes(savedAccent) ? savedAccent : 'blue'
      };
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
      return { mode: 'auto', accent: 'blue' };
    }
  }, []);

  // Set theme mode
  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    const currentTheme = newMode === 'auto' ? systemPreference : newMode;
    applyTheme(currentTheme, accentColor);
    savePreferences(newMode, accentColor);
  }, [systemPreference, accentColor, applyTheme, savePreferences]);

  // Set accent color
  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme, color);
    savePreferences(mode, color);
  }, [getCurrentTheme, applyTheme, savePreferences, mode]);

  // Toggle between light and dark (skips auto)
  const toggleTheme = useCallback(() => {
    const current = getCurrentTheme();
    setTheme(current === 'light' ? 'dark' : 'light');
  }, [getCurrentTheme, setTheme]);

  // Cycle through all theme modes
  const cycleTheme = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex]);
  }, [mode, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    const preferences = loadPreferences();
    const systemPref = detectSystemPreference();
    
    setSystemPreference(systemPref);
    setMode(preferences.mode);
    setAccentColorState(preferences.accent);
    
    const effectiveTheme = preferences.mode === 'auto' ? systemPref : preferences.mode;
    applyTheme(effectiveTheme, preferences.accent, false);
  }, [loadPreferences, detectSystemPreference, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemPref = e.matches ? 'dark' : 'light';
      setSystemPreference(newSystemPref);
      
      // Only apply if in auto mode
      if (mode === 'auto') {
        applyTheme(newSystemPref, accentColor);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [mode, accentColor, applyTheme]);

  // Handle visibility change to sync theme
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Re-detect system preference when page becomes visible
        const newSystemPref = detectSystemPreference();
        if (newSystemPref !== systemPreference) {
          setSystemPreference(newSystemPref);
          if (mode === 'auto') {
            applyTheme(newSystemPref, accentColor);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mode, accentColor, systemPreference, detectSystemPreference, applyTheme]);

  return {
    mode,
    accentColor,
    isTransitioning,
    systemPreference,
    setTheme,
    setAccentColor,
    toggleTheme,
    cycleTheme,
    getCurrentTheme
  };
} 