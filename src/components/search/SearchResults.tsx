/**
 * Search Results Component
 * Displays search results with highlighting, pagination, and sorting
 * @version 1.0.0
 */

import React from 'react';
import { SearchResult } from '../../services/search/SearchService';
import { Clock, Eye, Heart, MessageCircle, User, Tag, Calendar, ExternalLink } from 'lucide-react';
import { ModernCard } from '../ModernDesignSystem';
import { Link } from 'react-router-dom';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
  totalResults: number;
  searchTime: number;
  onResultClick: (result: SearchResult) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  loading,
  totalResults,
  searchTime,
  onResultClick,
  className = ''
}) => {
  // Format search time
  const formatSearchTime = (time: number) => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Render highlight with proper HTML escaping
  const renderHighlight = (highlight: string) => {
    return {
      __html: highlight
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;mark&gt;/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">')
        .replace(/&lt;\/mark&gt;/g, '</mark>')
    };
  };

  // Get result URL
  const getResultUrl = (result: SearchResult) => {
    if (result.type === 'post') {
      return `/blog/${result.id}`;
    } else {
      return `/blog/${result.id}#comment`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-medium-contrast">Searching...</span>
        </div>
      </div>
    );
  }

  // No results state
  if (!loading && results.length === 0 && query) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-low-contrast rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-low-contrast" />
          </div>
          <h3 className="text-subtitle font-semibold text-high-contrast mb-2">
            No results found
          </h3>
          <p className="text-body text-medium-contrast mb-4">
            We couldn't find any results for "{query}". Try adjusting your search terms or filters.
          </p>
          <div className="text-body-sm text-low-contrast">
            Suggestions:
            <ul className="mt-2 space-y-1">
              <li>• Check your spelling</li>
              <li>• Try different keywords</li>
              <li>• Use fewer filters</li>
              <li>• Search for broader terms</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Summary */}
      {query && results.length > 0 && (
        <div className="flex items-center justify-between pb-4 border-b border-medium-contrast">
          <div className="text-body text-medium-contrast">
            <span className="font-medium text-high-contrast">{totalResults.toLocaleString()}</span> result{totalResults !== 1 ? 's' : ''} found for{' '}
            <span className="font-medium text-high-contrast">"{query}"</span>
          </div>
          <div className="text-body-sm text-low-contrast">
            Search completed in {formatSearchTime(searchTime)}
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <ModernCard
            key={`${result.type}-${result.id}`}
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => onResultClick(result)}
          >
            <div className="space-y-4">
              {/* Result Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title and Type Badge */}
                  <div className="flex items-center space-x-3 mb-2">
                    <Link
                      to={getResultUrl(result)}
                      className="text-body-lg font-semibold text-high-contrast hover:text-gradient-flow transition-colors line-clamp-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {result.title}
                    </Link>
                    <span className={`px-2 py-1 rounded-full text-caption font-medium ${
                      result.type === 'post'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}>
                      {result.type === 'post' ? 'Post' : 'Comment'}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-body-sm text-low-contrast mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{result.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(result.createdAt)}</span>
                    </div>
                    {result.type === 'post' && (
                      <>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{result.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{result.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{result.comments}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Relevance Score */}
                <div className="text-caption text-low-contrast">
                  {Math.round(result.relevanceScore)}% match
                </div>
              </div>

              {/* Content Preview with Highlights */}
              <div className="space-y-2">
                {result.highlights.length > 0 ? (
                  <div className="space-y-2">
                    {result.highlights.slice(0, 2).map((highlight, highlightIndex) => (
                      <p
                        key={highlightIndex}
                        className="text-body text-medium-contrast leading-relaxed"
                        dangerouslySetInnerHTML={renderHighlight(highlight)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-body text-medium-contrast leading-relaxed line-clamp-3">
                    {result.excerpt}
                  </p>
                )}
              </div>

              {/* Tags and Categories */}
              {(result.categories.length > 0 || result.tags.length > 0) && (
                <div className="flex items-center space-x-4">
                  {/* Categories */}
                  {result.categories.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-body-sm text-low-contrast">Categories:</span>
                      <div className="flex items-center space-x-1">
                        {result.categories.slice(0, 3).map((category, catIndex) => (
                          <span
                            key={catIndex}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-caption font-medium"
                          >
                            {category}
                          </span>
                        ))}
                        {result.categories.length > 3 && (
                          <span className="text-caption text-low-contrast">
                            +{result.categories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-low-contrast" />
                      <div className="flex items-center space-x-1">
                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-caption font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="text-caption text-low-contrast">
                            +{result.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Matched Terms */}
              {result.matchedTerms.length > 0 && (
                <div className="flex items-center space-x-2 pt-2 border-t border-low-contrast">
                  <span className="text-body-sm text-low-contrast">Matched terms:</span>
                  <div className="flex items-center space-x-1">
                    {result.matchedTerms.slice(0, 5).map((term, termIndex) => (
                      <span
                        key={termIndex}
                        className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-caption font-medium"
                      >
                        {term}
                      </span>
                    ))}
                    {result.matchedTerms.length > 5 && (
                      <span className="text-caption text-low-contrast">
                        +{result.matchedTerms.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ModernCard>
        ))}
      </div>

      {/* Load More / Pagination could go here */}
      {results.length > 0 && results.length < totalResults && (
        <div className="text-center py-6">
          <p className="text-body-sm text-medium-contrast">
            Showing {results.length} of {totalResults.toLocaleString()} results
          </p>
        </div>
      )}
    </div>
  );
}; 