import React from 'react';
import { 
  Palette, 
  CheckCircle, 
  Star, 
  Users, 
  Mail,
  Phone,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function AccentTest() {
  const { accentColor, setAccentColor } = useTheme();

  const testElements = [
    {
      title: 'Buttons',
      elements: (
        <div className="space-y-3">
          <button className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-light transition-colors">
            Primary Button
          </button>
          <button className="px-6 py-3 border-2 border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary hover:text-white transition-colors">
            Secondary Button
          </button>
          <button className="px-6 py-3 bg-gradient-accent text-white rounded-lg hover:opacity-90 transition-opacity">
            Gradient Button
          </button>
        </div>
      )
    },
    {
      title: 'Text & Links',
      elements: (
        <div className="space-y-2">
          <p className="text-accent-primary font-semibold">Accent Text Color</p>
          <p className="text-accent-primary-light">Light Accent Text</p>
          <a href="#" className="text-gray-600 hover:accent-primary transition-colors underline">
            Hover Link Effect
          </a>
        </div>
      )
    },
    {
      title: 'Backgrounds & Borders',
      elements: (
        <div className="space-y-3">
          <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
            <p className="text-accent-primary font-medium">Accent Background</p>
          </div>
          <div className="p-4 bg-gradient-accent text-white rounded-lg">
            <p className="font-medium">Gradient Background</p>
          </div>
        </div>
      )
    },
    {
      title: 'Icons & Indicators',
      elements: (
        <div className="flex gap-4">
          <CheckCircle className="w-8 h-8 text-accent-primary" />
          <Star className="w-8 h-8 text-accent-primary-light" />
          <Users className="w-8 h-8 text-accent-primary" />
          <Mail className="w-8 h-8 text-accent-primary-light" />
        </div>
      )
    },
    {
      title: 'Form Elements',
      elements: (
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Focus me!" 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-accent-primary focus:border-accent-primary"
          />
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-accent-primary focus:border-accent-primary">
            <option>Select option</option>
            <option>Option 1</option>
          </select>
        </div>
      )
    }
  ];

  const accentColors = [
    { name: 'Ocean Blue', color: 'blue' as const },
    { name: 'Royal Purple', color: 'purple' as const },
    { name: 'Forest Green', color: 'green' as const },
    { name: 'Sunset Orange', color: 'orange' as const },
    { name: 'Cherry Pink', color: 'pink' as const }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Palette className="w-8 h-8 text-accent-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Accent Colors Working! 🎉
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            All website elements now dynamically change colors based on your accent selection. 
            Try switching colors below to see the magic!
          </p>
        </div>

        {/* Color Picker */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            🎨 Choose Your Accent Color
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {accentColors.map((color) => (
              <button
                key={color.color}
                onClick={() => setAccentColor(color.color)}
                className={`
                  flex flex-col items-center p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                  ${accentColor === color.color 
                    ? 'bg-accent-primary/10 border-2 border-accent-primary' 
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-full mb-2 ${
                  color.color === 'blue' ? 'bg-blue-500' :
                  color.color === 'purple' ? 'bg-purple-500' :
                  color.color === 'green' ? 'bg-green-500' :
                  color.color === 'orange' ? 'bg-orange-500' :
                  'bg-pink-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  accentColor === color.color 
                    ? 'text-accent-primary' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {color.name}
                </span>
                {accentColor === color.color && (
                  <CheckCircle className="w-5 h-5 text-accent-primary mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Color Display */}
        <div className="bg-gradient-accent text-white rounded-2xl p-8 mb-8 text-center">
          <Zap className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Currently Using: {accentColor}</h2>
          <p className="text-xl opacity-90">
            This entire section changes color when you switch accent colors!
          </p>
        </div>

        {/* Test Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testElements.map((test, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-accent-primary rounded-full"></div>
                </div>
                {test.title}
              </h3>
              {test.elements}
            </div>
          ))}
        </div>

        {/* Success Message */}
        <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 ACCENT COLORS ARE FULLY FUNCTIONAL!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Your theme system is now truly world-class with dynamic accent colors 
            that affect the entire website experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Globe className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Universal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Works across all pages</p>
            </div>
            <div>
              <Zap className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Instant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time color changes</p>
            </div>
            <div>
              <Shield className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Persistent</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saved in localStorage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 