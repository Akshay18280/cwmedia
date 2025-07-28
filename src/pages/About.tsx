import React from 'react';
import { User, Award, Target, Heart, Star, Code, Zap, Globe } from 'lucide-react';
import { ModernCard, ModernButton } from '../components/ModernDesignSystem';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-subtle py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-display mb-6 text-gradient-flow">
            About Carelwave Media
          </h1>
          <p className="text-body-lg text-medium-contrast max-w-3xl mx-auto">
            AI-powered content creation that delivers measurable business growth through performance-driven strategies and cutting-edge automation.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <ModernCard variant="neumorphic" padding="lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-flow rounded-full mx-auto mb-6 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-title font-bold mb-4 text-holographic">Our Mission</h2>
              <p className="text-medium-contrast leading-relaxed">
                To democratize technology knowledge and empower individuals with cutting-edge insights 
                that drive innovation and career growth in the digital age.
              </p>
            </div>
          </ModernCard>

          <ModernCard variant="glass" padding="lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-holographic rounded-full mx-auto mb-6 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-title font-bold mb-4 text-gradient-accent">Our Values</h2>
              <p className="text-medium-contrast leading-relaxed">
                Innovation, authenticity, and community-driven learning form the cornerstone of everything 
                we create and share with our global audience.
              </p>
            </div>
          </ModernCard>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-headline font-bold text-center mb-12 text-gradient-flow">Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <ModernCard variant="default" padding="lg" hover className="text-center">
              <div className="w-24 h-24 bg-gradient-flow rounded-full mx-auto mb-6 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-body-lg font-bold mb-2 text-gradient-accent">Akshay Verma</h3>
              <p className="text-accent-primary font-medium mb-3">Founder & CEO</p>
              <p className="text-medium-contrast text-body-sm">
                Technology visionary with 10+ years of experience in digital innovation and content strategy.
              </p>
            </ModernCard>

            {/* Add more team members as needed */}
            <ModernCard variant="neumorphic" padding="lg" hover className="text-center">
              <div className="w-24 h-24 bg-holographic rounded-full mx-auto mb-6 flex items-center justify-center">
                <Code className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-body-lg font-bold mb-2 text-holographic">Tech Team</h3>
              <p className="text-accent-primary font-medium mb-3">Development</p>
              <p className="text-medium-contrast text-body-sm">
                Expert developers creating cutting-edge web experiences and digital solutions.
              </p>
            </ModernCard>

            <ModernCard variant="glass" padding="lg" hover className="text-center">
              <div className="w-24 h-24 bg-gradient-flow-subtle rounded-full mx-auto mb-6 flex items-center justify-center">
                <Globe className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-body-lg font-bold mb-2 text-gradient-flow">Content Team</h3>
              <p className="text-accent-primary font-medium mb-3">Editorial</p>
              <p className="text-medium-contrast text-body-sm">
                Passionate writers and researchers delivering high-quality technology content.
              </p>
            </ModernCard>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-20">
          <h2 className="text-headline font-bold text-center mb-12 text-holographic">Our Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-flow rounded-full mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="text-title font-bold text-gradient-accent mb-2">10K+</div>
              <div className="text-medium-contrast">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-holographic rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-title font-bold text-holographic mb-2">50+</div>
              <div className="text-medium-contrast">Articles Published</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-flow-subtle rounded-full mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-title font-bold text-gradient-flow mb-2">100K+</div>
              <div className="text-medium-contrast">Monthly Views</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-title font-bold text-gradient-accent mb-2">25+</div>
              <div className="text-medium-contrast">Countries Reached</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <ModernCard variant="gradient-flow" padding="xl" className="text-white">
            <h2 className="text-headline font-bold mb-6">Join Our Journey</h2>
            <p className="text-body-lg mb-8 opacity-90">
              Be part of the future of technology content and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ModernButton variant="glass" intent="accent" size="lg" icon={Heart}>
                Subscribe Newsletter
              </ModernButton>
              <ModernButton variant="neumorphic" intent="primary" size="lg" icon={Star}>
                Follow Our Journey
              </ModernButton>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
