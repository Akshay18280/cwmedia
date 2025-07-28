import React from 'react';
import { Palette, Sparkles, Eye, Zap, Heart, Star } from 'lucide-react';
import { ModernButton, ModernCard } from '../components/ModernDesignSystem';

export default function AccentTest() {
  return (
    <div className="min-h-screen bg-gradient-subtle py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-display mb-6 text-gradient-flow">
            🌊 Flowing Gradients + 🔮 Holographic Effects
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience our revolutionary dynamic color system with flowing gradients and holographic effects.
            Watch colors come alive with smooth animations and interactive responses.
          </p>
        </div>

        {/* Live Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Flowing Gradients Demo */}
          <ModernCard variant="default" padding="lg" className="text-center">
            <div className="w-16 h-16 bg-gradient-flow rounded-full mx-auto mb-4 animate-gradient-flow"></div>
            <h3 className="text-2xl font-bold mb-4 text-gradient-flow">Flowing Gradients</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Colors smoothly flow and shift like liquid, creating mesmerizing visual experiences.
            </p>
            <div className="space-y-4">
              <div className="h-4 bg-gradient-flow rounded-full animate-gradient-flow-slow"></div>
              <div className="h-4 bg-gradient-flow rounded-full animate-gradient-flow"></div>
              <div className="h-4 bg-gradient-flow rounded-full animate-gradient-flow-fast"></div>
            </div>
          </ModernCard>

          {/* Holographic Effects Demo */}
          <ModernCard variant="default" padding="lg" className="text-center">
            <div className="w-16 h-16 bg-holographic rounded-full mx-auto mb-4"></div>
            <h3 className="text-2xl font-bold mb-4 text-holographic">Holographic Effects</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Color-shifting effects like soap bubbles or holographic foil with hue rotation.
            </p>
            <div className="space-y-4">
              <div className="h-4 bg-holographic rounded-full animate-holographic-slow"></div>
              <div className="h-4 bg-holographic rounded-full animate-holographic"></div>
              <div className="h-4 bg-holographic rounded-full animate-holographic-fast"></div>
            </div>
          </ModernCard>
        </div>

        {/* Button Variations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gradient-accent">Interactive Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernButton variant="default" intent="primary" size="lg" icon={Sparkles}>
              Gradient Flow
            </ModernButton>
            <ModernButton variant="default" intent="accent" size="lg" icon={Zap}>
              Holographic
            </ModernButton>
            <ModernButton variant="neumorphic" intent="primary" size="lg" icon={Heart}>
              Neomorphism
            </ModernButton>
            <ModernButton variant="glass" intent="accent" size="lg" icon={Star}>
              Glass Morph
            </ModernButton>
          </div>
        </div>

        {/* Card Variations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-holographic">Dynamic Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModernCard variant="default" padding="lg" hover className="text-center">
              <Eye className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Default Style</h3>
              <p className="text-gray-600 dark:text-gray-400">Clean and professional appearance</p>
            </ModernCard>

            <ModernCard variant="neumorphic" padding="lg" hover className="text-center">
              <Palette className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Neumorphic</h3>
              <p className="text-gray-600 dark:text-gray-400">Soft, tactile design with depth</p>
            </ModernCard>

            <ModernCard variant="glass" padding="lg" hover className="text-center">
              <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Glass Morphism</h3>
              <p className="text-gray-600 dark:text-gray-400">Translucent with blur effects</p>
            </ModernCard>
          </div>
        </div>

        {/* Typography Effects */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gradient-flow">Typography Effects</h2>
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-gradient-flow">Flowing Text</h1>
            <h1 className="text-6xl font-bold text-holographic">Holographic Text</h1>
            <h1 className="text-6xl font-bold text-gradient-accent">Static Gradient</h1>
          </div>
        </div>

        {/* Background Patterns */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gradient-accent">Background Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-gradient-flow rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              Flowing Background
            </div>
            <div className="h-40 bg-holographic rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              Holographic Background
            </div>
          </div>
        </div>

        {/* Performance Info */}
        <ModernCard variant="glass" padding="lg" className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-gradient-flow">Performance Optimized</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            All animations respect user preferences for reduced motion and adapt to device capabilities.
            Gradients are hardware-accelerated and optimized for smooth 60fps performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">60 FPS</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Smooth Animation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">&lt; 50ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">GPU</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accelerated</div>
            </div>
          </div>
        </ModernCard>

        {/* Instructions */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4 text-holographic">How to Test</h3>
          <div className="max-w-2xl mx-auto">
            <ol className="list-decimal list-inside space-y-2 text-left text-gray-600 dark:text-gray-400">
              <li>Change accent colors in the theme toggle (top navigation)</li>
              <li>Watch all gradients and holographic effects update instantly</li>
              <li>Hover over buttons and cards to see interactive effects</li>
              <li>Try different theme modes (light, dark, auto)</li>
              <li>Test on different devices to see adaptive performance</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 