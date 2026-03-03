/**
 * Smart Content Recommendations Component
 * AI-powered personalized content recommendations
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Clock, Heart, Eye, Share2, BookOpen, 
  Star, ChevronRight, Filter, Refresh, Sparkles,
  User, Calendar, Tag, Target, Brain, Zap
} from 'lucide-react';
import { aiRecommendationEngine, RecommendationResult, RecommendationRequest } from '../../services/ai/AIRecommendationEngine';
import { ModernCard, ModernButton } from '../ModernDesignSystem';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface SmartContentRecommendationsProps {
  userId?: string;
  currentContentId?: string;
  context?: 'homepage' | 'post-detail' | 'search' | 'profile';
  maxRecommendations?: number;
  showFilters?: boolean;
  showAnalytics?: boolean;
  className?: string;
}

interface RecommendationFilters {
  categories: string[];
  contentTypes: string[];
  maxReadingTime?: number;
  difficulty?: string[];
}

export const SmartContentRecommendations: React.FC<SmartContentRecommendationsProps> = ({
  userId,
  currentContentId,
  context = 'homepage',
  maxRecommendations = 6,
  showFilters = false,
  showAnalytics = true,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecommendationFilters>({
    categories: [],
    contentTypes: [],
    maxReadingTime: undefined,
    difficulty: []
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const effectiveUserId = userId || currentUser?.id || 'anonymous';

  useEffect(() => {
    loadRecommendations();
  }, [effectiveUserId, currentContentId, context, filters, refreshKey]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const request: RecommendationRequest = {
        userId: effectiveUserId,
        context: {
          currentContent: currentContentId,
          sessionHistory: [], // Would get from session storage
          timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                     new Date().getHours() < 18 ? 'afternoon' : 'evening',
          deviceType: window.innerWidth <= 768 ? 'mobile' : 
                     window.innerWidth <= 1024 ? 'tablet' : 'desktop',
          intent: getIntentFromContext(context)
        },
        filters: {
          ...filters,
          excludeViewed: true
        },
        limit: maxRecommendations,
        diversityFactor: 0.3,
        freshnessFactor: 0.2
      };

      const results = await aiRecommendationEngine.getRecommendations(request);
      setRecommendations(results);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getIntentFromContext = (ctx: string): 'browse' | 'search' | 'continue' | 'discover' => {
    switch (ctx) {
      case 'search': return 'search';
      case 'post-detail': return 'continue';
      case 'profile': return 'discover';
      default: return 'browse';
    }
  };

  const handleRecommendationClick = async (recommendation: RecommendationResult) => {
    // Track interaction
    await aiRecommendationEngine.updateUserProfile(effectiveUserId, {
      type: 'click',
      contentId: recommendation.contentId,
      metadata: {
        category: recommendation.category,
        score: recommendation.score,
        context
      }
    });
  };

  const refreshRecommendations = () => {
    setRefreshKey(prev => prev + 1);
  };

  const updateFilter = (key: keyof RecommendationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleContentType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'trending': 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      'personalized': 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      'similar': 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      'discovery': 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      'continuation': 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trending': return <TrendingUp className="w-3 h-3" />;
      case 'personalized': return <User className="w-3 h-3" />;
      case 'similar': return <Heart className="w-3 h-3" />;
      case 'discovery': return <Sparkles className="w-3 h-3" />;
      case 'continuation': return <BookOpen className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-flow rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-title font-bold text-high-contrast">
              Smart Recommendations
            </h2>
            <p className="text-body-sm text-medium-contrast">
              AI-powered content suggestions just for you
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showFilters && (
            <ModernButton
              variant="minimal"
              intent="secondary"
              size="sm"
              icon={Filter}
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              Filters
            </ModernButton>
          )}
          <ModernButton
            variant="minimal"
            intent="secondary"
            size="sm"
            icon={Refresh}
            onClick={refreshRecommendations}
            loading={loading}
          >
            Refresh
          </ModernButton>
        </div>
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <ModernCard className="p-4">
          <h3 className="font-medium text-high-contrast mb-4">Filter Recommendations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-body-sm font-medium text-medium-contrast mb-2">
                Categories
              </label>
              <div className="space-y-2">
                {['Technology', 'Business', 'Design', 'Marketing', 'Tutorial'].map(category => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-body-sm text-high-contrast">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div>
              <label className="block text-body-sm font-medium text-medium-contrast mb-2">
                Content Types
              </label>
              <div className="space-y-2">
                {['Blog', 'Video', 'Tutorial', 'Case Study', 'News'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.contentTypes.includes(type)}
                      onChange={() => toggleContentType(type)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-body-sm text-high-contrast">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reading Time */}
            <div>
              <label className="block text-body-sm font-medium text-medium-contrast mb-2">
                Max Reading Time
              </label>
              <select
                value={filters.maxReadingTime || ''}
                onChange={(e) => updateFilter('maxReadingTime', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg text-high-contrast"
              >
                <option value="">Any length</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: maxRecommendations }).map((_, index) => (
            <ModernCard key={index} className="p-4 animate-pulse">
              <div className="h-4 bg-low-contrast rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-low-contrast rounded w-full mb-2"></div>
              <div className="h-3 bg-low-contrast rounded w-2/3 mb-4"></div>
              <div className="flex items-center space-x-2">
                <div className="h-2 bg-low-contrast rounded w-16"></div>
                <div className="h-2 bg-low-contrast rounded w-12"></div>
              </div>
            </ModernCard>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <ModernCard
              key={recommendation.contentId}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-caption font-medium ${getCategoryColor(recommendation.category)}`}>
                  {getCategoryIcon(recommendation.category)}
                  <span className="capitalize">{recommendation.category}</span>
                </div>
                
                {showAnalytics && (
                  <div className={`text-caption font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                    {Math.round(recommendation.confidence * 100)}%
                  </div>
                )}
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                <h3 className="font-semibold text-high-contrast text-body-lg mb-2 group-hover:text-blue-600 transition-colors">
                  Sample Content Title {recommendation.contentId.slice(-3)}
                </h3>
                <p className="text-medium-contrast text-body-sm mb-3">
                  This is a sample description for the recommended content. In a real implementation, this would come from the actual content data.
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-caption text-medium-contrast mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatReadingTime(recommendation.metadata.estimatedReadTime)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{Math.round(recommendation.metadata.engagementProbability * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>{Math.round(recommendation.metadata.relevanceScore * 100)}</span>
                </div>
              </div>

              {/* Reasons */}
              {recommendation.reasons.length > 0 && (
                <div className="mb-4">
                  <div className="text-caption text-medium-contrast mb-1">Why recommended:</div>
                  <div className="space-y-1">
                    {recommendation.reasons.slice(0, 2).map((reason, index) => (
                      <div key={index} className="flex items-start space-x-2 text-caption">
                        <Zap className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-medium-contrast">{reason.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <Link
                to={`/post/${recommendation.contentId}`}
                onClick={() => handleRecommendationClick(recommendation)}
                className="flex items-center justify-between w-full p-3 bg-low-contrast hover:bg-medium-contrast rounded-lg transition-colors group"
              >
                <span className="text-body-sm font-medium text-high-contrast">
                  Read More
                </span>
                <ChevronRight className="w-4 h-4 text-medium-contrast group-hover:text-high-contrast transition-colors" />
              </Link>
            </ModernCard>
          ))}
        </div>
      ) : (
        <ModernCard className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-low-contrast" />
          <h3 className="font-medium text-high-contrast mb-2">No Recommendations Yet</h3>
          <p className="text-medium-contrast text-body-sm mb-4">
            {effectiveUserId === 'anonymous' 
              ? 'Sign in to get personalized content recommendations'
              : 'Start reading content to get personalized recommendations'
            }
          </p>
          <ModernButton
            variant="default"
            intent="primary"
            onClick={refreshRecommendations}
          >
            Get Recommendations
          </ModernButton>
        </ModernCard>
      )}

      {/* Analytics Summary */}
      {showAnalytics && recommendations.length > 0 && (
        <ModernCard className="p-4">
          <h3 className="font-medium text-high-contrast mb-3">Recommendation Insights</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-title font-bold text-blue-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length * 100)}%
              </div>
              <div className="text-caption text-medium-contrast">Avg Confidence</div>
            </div>
            
            <div className="text-center">
              <div className="text-title font-bold text-green-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.metadata.engagementProbability, 0) / recommendations.length * 100)}%
              </div>
              <div className="text-caption text-medium-contrast">Engagement Likely</div>
            </div>
            
            <div className="text-center">
              <div className="text-title font-bold text-purple-600">
                {Math.round(recommendations.reduce((sum, r) => sum + r.metadata.estimatedReadTime, 0) / recommendations.length)}
              </div>
              <div className="text-caption text-medium-contrast">Avg Read Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-title font-bold text-orange-600">
                {new Set(recommendations.map(r => r.category)).size}
              </div>
              <div className="text-caption text-medium-contrast">Categories</div>
            </div>
          </div>
        </ModernCard>
      )}
    </div>
  );
}; 