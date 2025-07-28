import React from 'react';
import { 
  Palette, 
  Sparkles, 
  Zap, 
  Settings, 
  Sun, 
  Moon, 
  Monitor,
  Eye,
  Brush,
  Star
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';

export default function ThemeShowcase() {
  const { mode, accentColor, isTransitioning, systemPreference, getCurrentTheme } = useTheme();

  const themeFeatures = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Advanced Theme System',
      description: 'Light, Dark, and Auto modes with system preference detection',
      badge: 'Smart'
    },
    {
      icon: <Brush className="w-6 h-6" />,
      title: 'Dynamic Accent Colors',
      description: '5 beautiful accent colors that adapt to light/dark themes',
      badge: 'Customizable'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Smooth Transitions',
      description: 'Buttery smooth animations powered by CSS cubic-bezier curves',
      badge: 'Performant'
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Accessibility First',
      description: 'WCAG 2.1 AA compliant with proper focus management',
      badge: 'Inclusive'
    }
  ];

  const colorDemo = [
    { name: 'Primary', class: 'bg-blue-500' },
    { name: 'Secondary', class: 'bg-gray-500' },
    { name: 'Success', class: 'bg-green-500' },
    { name: 'Warning', class: 'bg-yellow-500' },
    { name: 'Error', class: 'bg-red-500' },
    { name: 'Accent', class: 'bg-accent-primary' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Advanced Theme System
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the next generation of theme management with smooth transitions, 
            dynamic accent colors, and intelligent system integration.
          </p>
        </div>

        {/* Current Theme Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="w-6 h-6 mr-3 text-blue-500" />
              Theme Status
            </h2>
            {isTransitioning && (
              <div className="flex items-center text-blue-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                Transitioning...
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-center mb-2">
                {mode === 'light' && <Sun className="w-8 h-8 text-yellow-500" />}
                {mode === 'dark' && <Moon className="w-8 h-8 text-blue-400" />}
                {mode === 'auto' && <Monitor className="w-8 h-8 text-green-500" />}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Current Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{mode}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-accent-primary rounded-full mx-auto mb-2"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Accent Color</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{accentColor}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-center mb-2">
                {systemPreference === 'dark' ? 
                  <Moon className="w-8 h-8 text-blue-400" /> : 
                  <Sun className="w-8 h-8 text-yellow-500" />
                }
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">System Preference</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{systemPreference}</p>
            </div>
          </div>
        </div>

        {/* Theme Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Compact Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-500" />
              Compact Toggle
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Perfect for navigation bars and minimal interfaces.
            </p>
            <div className="flex justify-center">
              <ThemeToggle variant="compact" />
            </div>
          </div>

          {/* Minimal Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-500" />
              Minimal Toggle
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Simple toggle for quick theme switching.
            </p>
            <div className="flex justify-center">
              <ThemeToggle variant="minimal" />
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-green-500" />
              Color Palette
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {colorDemo.map((color) => (
                <div key={color.name} className="text-center">
                  <div className={`w-full h-8 rounded-lg ${color.class} mb-1`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Theme Control Panel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Full Theme Control Panel
          </h2>
          <div className="flex justify-center">
            <ThemeToggle variant="full" showAccentPicker={true} />
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {themeFeatures.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-4">
                    <div className="text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                <span className="px-2 py-1 bg-gradient-accent text-white text-xs font-medium rounded-full">
                  {feature.badge}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Interactive Demo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buttons */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Buttons</h3>
              <button className="w-full px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-light transition-colors">
                Primary Button
              </button>
              <button className="w-full px-4 py-2 border border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary hover:text-white transition-colors">
                Secondary Button
              </button>
              <button className="w-full px-4 py-2 bg-gradient-accent text-white rounded-lg hover:opacity-90 transition-opacity">
                Gradient Button
              </button>
            </div>

            {/* Form Elements */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Form Elements</h3>
              <input 
                type="text" 
                placeholder="Enter text..." 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-accent-primary focus:border-accent-primary"
              />
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-accent-primary focus:border-accent-primary">
                <option>Select option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Cards</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Card Title</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">This is a sample card with theme-aware styling.</p>
              </div>
              <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
                <h4 className="font-medium text-accent-primary mb-2">Accent Card</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">This card uses the current accent color.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance & Accessibility
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">300ms</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Transition Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">WCAG AA</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accessibility</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accent Colors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Theme Modes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 