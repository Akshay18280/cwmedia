/**
 * AI Writing Assistant Component
 * Real-time writing assistance with ChatGPT integration
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, Sparkles, Lightbulb, Target, Zap, RotateCcw, 
  Check, X, Copy, Download, Settings, Brain, Wand2,
  MessageSquare, BookOpen, Search, TrendingUp
} from 'lucide-react';
import { chatGPTIntegrationService, WritingAssistanceRequest, WritingAssistanceResponse } from '../../services/ai/ChatGPTIntegrationService';
import { seoAnalysisService } from '../../services/ai/SEOAnalysisService';
import { ModernButton, ModernCard } from '../ModernDesignSystem';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from 'sonner';

interface AIWritingAssistantProps {
  content: string;
  onContentChange: (content: string) => void;
  title?: string;
  targetKeywords?: string[];
  contentType?: 'blog' | 'video-description' | 'social-post' | 'email' | 'seo-content';
  audience?: 'general' | 'technical' | 'business' | 'academic' | 'casual';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational';
  className?: string;
}

interface WritingSuggestion {
  id: string;
  type: 'improvement' | 'alternative' | 'expansion' | 'seo' | 'tone';
  title: string;
  description: string;
  before?: string;
  after: string;
  confidence: number;
  applied: boolean;
}

interface SEOMetrics {
  score: number;
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  wordCount: number;
  issues: string[];
  suggestions: string[];
}

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  content,
  onContentChange,
  title = '',
  targetKeywords = [],
  contentType = 'blog',
  audience = 'general',
  tone = 'professional',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'generate' | 'seo' | 'settings'>('suggestions');
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [seoMetrics, setSeoMetrics] = useState<SEOMetrics | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [autoApply, setAutoApply] = useState(false);

  const debouncedContent = useDebounce(content, 1000);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real-time analysis
  useEffect(() => {
    if (realTimeMode && debouncedContent && debouncedContent.length > 50) {
      analyzeContent();
    }
  }, [debouncedContent, realTimeMode]);

  const analyzeContent = useCallback(async () => {
    if (!content || content.length < 50) return;

    setIsAnalyzing(true);
    try {
      // Get AI suggestions
      const response = await chatGPTIntegrationService.improveContent(
        content,
        'clarity',
        {
          contentType,
          audience,
          tone,
          purpose: 'inform',
          keywords: targetKeywords
        }
      );

      // Generate suggestions from response
      const newSuggestions: WritingSuggestion[] = response.suggestions.map((suggestion, index) => ({
        id: `suggestion-${index}`,
        type: suggestion.type as any,
        title: suggestion.description,
        description: suggestion.reasoning,
        before: suggestion.originalText,
        after: suggestion.suggestedText,
        confidence: suggestion.confidence,
        applied: false
      }));

      setSuggestions(newSuggestions);

      // Get SEO analysis if keywords provided
      if (targetKeywords.length > 0) {
        const seoResult = await seoAnalysisService.performRealTimeOptimization(content, targetKeywords[0]);
        setSeoMetrics({
          score: seoResult.score,
          keywordDensity: {},
          readabilityScore: 75, // Would calculate actual readability
          wordCount: content.split(/\s+/).length,
          issues: seoResult.issues,
          suggestions: seoResult.quickFixes
        });
      }

    } catch (error) {
      console.error('Error analyzing content:', error);
      toast.error('Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, contentType, audience, tone, targetKeywords]);

  const generateContent = async (prompt: string, type: 'expand' | 'rewrite' | 'optimize' | 'ideas') => {
    setIsGenerating(true);
    try {
      const request: WritingAssistanceRequest = {
        type: type === 'expand' ? 'expand_content' : 
              type === 'rewrite' ? 'rewrite_content' :
              type === 'optimize' ? 'improve_writing' : 'generate_ideas',
        context: {
          contentType,
          audience,
          tone,
          purpose: 'inform',
          keywords: targetKeywords,
          existingContent: content
        },
        userInput: prompt,
        options: {
          temperature: 0.7,
          includeMetadata: true,
          includeSEO: targetKeywords.length > 0
        }
      };

      const response = await chatGPTIntegrationService.generateContent(request);
      setGeneratedContent(response.generatedContent);
      
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    let newContent = content;
    
    if (suggestion.before && suggestion.after) {
      newContent = content.replace(suggestion.before, suggestion.after);
    } else {
      // For suggestions without specific text replacement
      newContent = content + '\n\n' + suggestion.after;
    }

    onContentChange(newContent);
    
    // Mark suggestion as applied
    setSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, applied: true } : s)
    );

    toast.success('Suggestion applied successfully!');
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const acceptGeneratedContent = () => {
    if (generatedContent) {
      onContentChange(generatedContent);
      setGeneratedContent('');
      setActiveTab('suggestions');
      toast.success('Generated content applied!');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Zap className="w-4 h-4" />;
      case 'alternative': return <RotateCcw className="w-4 h-4" />;
      case 'expansion': return <BookOpen className="w-4 h-4" />;
      case 'seo': return <TrendingUp className="w-4 h-4" />;
      case 'tone': return <MessageSquare className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'alternative': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'expansion': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'seo': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'tone': return 'text-pink-600 bg-pink-50 dark:bg-pink-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <ModernButton
          variant="default"
          intent="primary"
          size="lg"
          icon={Brain}
          onClick={() => setIsVisible(true)}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          AI Assistant
        </ModernButton>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <ModernCard className="w-96 max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-low-contrast">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-flow rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-high-contrast">AI Writing Assistant</h3>
              <p className="text-caption text-medium-contrast">
                {isAnalyzing ? 'Analyzing...' : `${suggestions.length} suggestions`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-low-contrast hover:text-medium-contrast transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-low-contrast">
          {[
            { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
            { id: 'generate', label: 'Generate', icon: Wand2 },
            { id: 'seo', label: 'SEO', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-body-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600'
                  : 'text-medium-contrast hover:text-high-contrast'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'suggestions' && (
            <div className="p-4 space-y-3">
              {isAnalyzing && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="ml-2 text-medium-contrast">Analyzing content...</span>
                </div>
              )}

              {suggestions.length === 0 && !isAnalyzing && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-low-contrast" />
                  <p className="text-medium-contrast text-body-sm">
                    Start writing to get AI suggestions
                  </p>
                  <ModernButton
                    variant="minimal"
                    intent="primary"
                    size="sm"
                    className="mt-3"
                    onClick={analyzeContent}
                  >
                    Analyze Current Content
                  </ModernButton>
                </div>
              )}

              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className={`p-3 rounded-lg border transition-all ${
                    suggestion.applied 
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 opacity-60'
                      : 'border-low-contrast hover:border-medium-contrast'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${getSuggestionColor(suggestion.type)}`}>
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-high-contrast text-body-sm">
                          {suggestion.title}
                        </h4>
                        <p className="text-caption text-medium-contrast">
                          Confidence: {Math.round(suggestion.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                    {suggestion.applied && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>

                  <p className="text-body-sm text-medium-contrast mb-3">
                    {suggestion.description}
                  </p>

                  {suggestion.before && (
                    <div className="mb-2">
                      <p className="text-caption text-medium-contrast mb-1">Current:</p>
                      <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-body-sm">
                        {suggestion.before}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-caption text-medium-contrast mb-1">Suggested:</p>
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-body-sm">
                      {suggestion.after}
                    </div>
                  </div>

                  {!suggestion.applied && (
                    <div className="flex items-center space-x-2">
                      <ModernButton
                        variant="default"
                        intent="primary"
                        size="xs"
                        onClick={() => applySuggestion(suggestion.id)}
                      >
                        Apply
                      </ModernButton>
                      <ModernButton
                        variant="minimal"
                        intent="secondary"
                        size="xs"
                        icon={Copy}
                        onClick={() => copyToClipboard(suggestion.after)}
                      >
                        Copy
                      </ModernButton>
                      <ModernButton
                        variant="minimal"
                        intent="secondary"
                        size="xs"
                        icon={X}
                        onClick={() => dismissSuggestion(suggestion.id)}
                      >
                        Dismiss
                      </ModernButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <ModernButton
                  variant="default"
                  intent="primary"
                  size="sm"
                  icon={BookOpen}
                  onClick={() => generateContent('Expand this content with more details and examples', 'expand')}
                  loading={isGenerating}
                >
                  Expand
                </ModernButton>
                <ModernButton
                  variant="default"
                  intent="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => generateContent('Rewrite this content with better clarity and flow', 'rewrite')}
                  loading={isGenerating}
                >
                  Rewrite
                </ModernButton>
                <ModernButton
                  variant="default"
                  intent="primary"
                  size="sm"
                  icon={TrendingUp}
                  onClick={() => generateContent('Optimize this content for SEO and engagement', 'optimize')}
                  loading={isGenerating}
                >
                  Optimize
                </ModernButton>
                <ModernButton
                  variant="default"
                  intent="secondary"
                  size="sm"
                  icon={Lightbulb}
                  onClick={() => generateContent('Generate ideas to improve this content', 'ideas')}
                  loading={isGenerating}
                >
                  Ideas
                </ModernButton>
              </div>

              {generatedContent && (
                <div className="border border-low-contrast rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-high-contrast">Generated Content</h4>
                    <div className="flex items-center space-x-1">
                      <ModernButton
                        variant="minimal"
                        intent="secondary"
                        size="xs"
                        icon={Copy}
                        onClick={() => copyToClipboard(generatedContent)}
                      >
                        Copy
                      </ModernButton>
                    </div>
                  </div>
                  <div className="bg-low-contrast p-3 rounded text-body-sm max-h-48 overflow-y-auto">
                    {generatedContent}
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <ModernButton
                      variant="default"
                      intent="primary"
                      size="sm"
                      onClick={acceptGeneratedContent}
                    >
                      Use This Content
                    </ModernButton>
                    <ModernButton
                      variant="minimal"
                      intent="secondary"
                      size="sm"
                      onClick={() => setGeneratedContent('')}
                    >
                      Discard
                    </ModernButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="p-4 space-y-4">
              {targetKeywords.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-8 h-8 mx-auto mb-3 text-low-contrast" />
                  <p className="text-medium-contrast text-body-sm">
                    Add target keywords to get SEO analysis
                  </p>
                </div>
              ) : seoMetrics ? (
                <div className="space-y-4">
                  {/* SEO Score */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      seoMetrics.score >= 80 ? 'text-green-600' :
                      seoMetrics.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {seoMetrics.score}
                    </div>
                    <p className="text-body-sm text-medium-contrast">SEO Score</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-low-contrast rounded">
                      <div className="font-semibold text-high-contrast">{seoMetrics.wordCount}</div>
                      <div className="text-caption text-medium-contrast">Words</div>
                    </div>
                    <div className="text-center p-2 bg-low-contrast rounded">
                      <div className="font-semibold text-high-contrast">{seoMetrics.readabilityScore}</div>
                      <div className="text-caption text-medium-contrast">Readability</div>
                    </div>
                  </div>

                  {/* Issues */}
                  {seoMetrics.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-high-contrast mb-2">Issues to Fix</h4>
                      <div className="space-y-2">
                        {seoMetrics.issues.map((issue, index) => (
                          <div key={index} className="flex items-start space-x-2 text-body-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-medium-contrast">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {seoMetrics.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-high-contrast mb-2">Quick Fixes</h4>
                      <div className="space-y-2">
                        {seoMetrics.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-2 text-body-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-medium-contrast">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ModernButton
                    variant="default"
                    intent="primary"
                    onClick={analyzeContent}
                    loading={isAnalyzing}
                  >
                    Analyze SEO
                  </ModernButton>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={realTimeMode}
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-body-sm text-high-contrast">Real-time analysis</span>
                </label>
                <p className="text-caption text-medium-contrast mt-1">
                  Analyze content as you type
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoApply}
                    onChange={(e) => setAutoApply(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-body-sm text-high-contrast">Auto-apply high-confidence suggestions</span>
                </label>
                <p className="text-caption text-medium-contrast mt-1">
                  Automatically apply suggestions with 90%+ confidence
                </p>
              </div>

              <div className="border-t border-low-contrast pt-4">
                <h4 className="font-medium text-high-contrast mb-2">Content Settings</h4>
                <div className="space-y-2 text-body-sm text-medium-contrast">
                  <div>Type: <span className="font-medium">{contentType}</span></div>
                  <div>Audience: <span className="font-medium">{audience}</span></div>
                  <div>Tone: <span className="font-medium">{tone}</span></div>
                  {targetKeywords.length > 0 && (
                    <div>Keywords: <span className="font-medium">{targetKeywords.join(', ')}</span></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ModernCard>
    </div>
  );
}; 