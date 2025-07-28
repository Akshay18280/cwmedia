/**
 * Dedicated Search Page
 * Comprehensive search interface with filters, results, and analytics
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { SearchBar } from '../components/search/SearchBar';
import { AdvancedFilters } from '../components/search/AdvancedFilters';
import { SearchResults } from '../components/search/SearchResults';
import { searchService, SearchResult, SearchFilters, SearchAnalytics } from '../services/search/SearchService';
import { ModernCard } from '../components/ModernDesignSystem';
import { toast } from 'sonner';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);

  // Initialize search from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery, filters);
    }
  }, [searchParams]);

  // Load search analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await searchService.getSearchAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading search analytics:', error);
      }
    };

    loadAnalytics();
  }, []);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters = {}) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const startTime = performance.now();

    try {
      const searchResults = await searchService.search(searchQuery, searchFilters);
      const endTime = performance.now();
      
      setResults(searchResults);
      setSearchTime(endTime - startTime);

      // Update URL
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('q', searchQuery);
      setSearchParams(newSearchParams);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery, filters);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query) {
      performSearch(query, newFilters);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'post') {
      navigate(`/blog/${result.id}`);
    } else {
      navigate(`/blog/${result.id}#comment`);
    }
  };

  // Handle popular query click
  const handlePopularQueryClick = (popularQuery: string) => {
    setQuery(popularQuery);
    performSearch(popularQuery, filters);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-display mb-4 text-gradient-flow">
            Search
          </h1>
          <p className="text-body-lg text-medium-contrast max-w-2xl mx-auto">
            Find exactly what you're looking for with our advanced search system
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            onFiltersToggle={() => setShowFilters(true)}
            initialQuery={query}
            showVoiceSearch={true}
            showFilters={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Search Results */}
          <div className="lg:col-span-3">
            <SearchResults
              results={results}
              query={query}
              loading={loading}
              totalResults={results.length}
              searchTime={searchTime}
              onResultClick={handleResultClick}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Tips */}
            <ModernCard className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-5 h-5 text-blue-500" />
                <h3 className="text-subtitle font-semibold text-high-contrast">Search Tips</h3>
              </div>
              <div className="space-y-3 text-body-sm text-medium-contrast">
                <div>
                  <strong className="text-high-contrast">Exact phrases:</strong> Use quotes "like this"
                </div>
                <div>
                  <strong className="text-high-contrast">Multiple words:</strong> All words will be searched
                </div>
                <div>
                  <strong className="text-high-contrast">Voice search:</strong> Click the microphone icon
                </div>
                <div>
                  <strong className="text-high-contrast">Filters:</strong> Use the filter button for advanced options
                </div>
              </div>
            </ModernCard>

            {/* Popular Searches */}
            {analytics && analytics.topQueries.length > 0 && (
              <ModernCard className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="text-subtitle font-semibold text-high-contrast">Popular Searches</h3>
                </div>
                <div className="space-y-2">
                  {analytics.topQueries.slice(0, 8).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handlePopularQueryClick(item.query)}
                      className="w-full text-left p-2 text-body-sm text-medium-contrast hover:text-high-contrast hover:bg-low-contrast rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.query}</span>
                        <span className="text-caption text-low-contrast">{item.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ModernCard>
            )}

            {/* Recent Searches */}
            <ModernCard className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="text-subtitle font-semibold text-high-contrast">Recent Searches</h3>
              </div>
              <div className="text-body-sm text-medium-contrast">
                {localStorage.getItem('recent_searches') ? (
                  <div className="space-y-2">
                    {JSON.parse(localStorage.getItem('recent_searches') || '[]')
                      .slice(0, 5)
                      .map((recentQuery: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => handlePopularQueryClick(recentQuery)}
                          className="w-full text-left p-2 text-body-sm text-medium-contrast hover:text-high-contrast hover:bg-low-contrast rounded-lg transition-colors"
                        >
                          {recentQuery}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p>No recent searches</p>
                )}
              </div>
            </ModernCard>

            {/* Search Stats */}
            {analytics && (
              <ModernCard className="p-6">
                <h3 className="text-subtitle font-semibold text-high-contrast mb-4">Search Statistics</h3>
                <div className="space-y-3 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Total Searches:</span>
                    <span className="font-medium text-high-contrast">
                      {analytics.totalSearches.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-contrast">Avg. Results:</span>
                    <span className="font-medium text-high-contrast">
                      {analytics.averageResultsPerSearch.toFixed(1)}
                    </span>
                  </div>
                </div>
              </ModernCard>
            )}
          </div>
        </div>

        {/* Advanced Filters Modal */}
        <AdvancedFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      </div>
    </div>
  );
} 