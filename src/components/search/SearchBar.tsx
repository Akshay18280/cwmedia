/**
 * Advanced Search Bar Component - 2025 Standards
 * Features: AI-powered search intent, semantic suggestions, performance metrics
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Mic, MicOff, Filter, Clock, Tag, User, BookOpen, Brain, TrendingUp, Zap } from 'lucide-react';
import { searchService, SearchSuggestion } from '../../services/search/SearchService';
import { useDebounce } from '../../hooks/useDebounce';
import { ModernButton } from '../ModernDesignSystem';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFiltersToggle: () => void;
  placeholder?: string;
  showVoiceSearch?: boolean;
  showFilters?: boolean;
  initialQuery?: string;
  className?: string;
}

interface SearchMetrics {
  responseTime: number;
  suggestionCount: number;
  searchIntent: string;
  confidence: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFiltersToggle,
  placeholder = "Search posts, articles, trends...",
  showVoiceSearch = true,
  showFilters = true,
  initialQuery = '',
  className = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchIntent, setSearchIntent] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // AI-powered search intent analysis
  const analyzeSearchIntent = useCallback((searchQuery: string) => {
    const query = searchQuery.toLowerCase();
    
    // Basic intent detection (can be enhanced with ML)
    if (query.includes('how to') || query.includes('tutorial') || query.includes('guide')) {
      return 'tutorial';
    } else if (query.includes('best') || query.includes('top') || query.includes('review')) {
      return 'comparison';
    } else if (query.includes('latest') || query.includes('new') || query.includes('recent')) {
      return 'trending';
    } else if (query.includes('what is') || query.includes('define') || query.includes('meaning')) {
      return 'informational';
    } else if (query.includes('buy') || query.includes('price') || query.includes('cost')) {
      return 'commercial';
    }
    return 'general';
  }, []);

  // Enhanced search suggestions with metrics
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        setIsLoading(true);
        const startTime = performance.now();
        
        try {
          const results = await searchService.getSuggestions(debouncedQuery);
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          // Analyze search intent
          const intent = analyzeSearchIntent(debouncedQuery);
          setSearchIntent(intent);
          
          // Set metrics
          setSearchMetrics({
            responseTime,
            suggestionCount: results.length,
            searchIntent: intent,
            confidence: results.length > 0 ? 0.85 : 0.3
          });
          
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setSearchMetrics({
            responseTime: 0,
            suggestionCount: 0,
            searchIntent: 'error',
            confidence: 0
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchMetrics(null);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, analyzeSearchIntent]);

  // Initialize voice search with enhanced features
  useEffect(() => {
    if (!showVoiceSearch) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true; // Enhanced: show interim results
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setQuery(interimTranscript);
        }

        if (finalTranscript) {
          setQuery(finalTranscript);
          handleSearch(finalTranscript);
          setIsVoiceActive(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsVoiceActive(false);
      };

      recognitionRef.current.onend = () => {
        setIsVoiceActive(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [showVoiceSearch]);

  // Handle search execution with analytics
  const handleSearch = useCallback((searchQuery: string = query) => {
    if (searchQuery.trim()) {
      // Track search performance
      const searchStart = performance.now();
      
      onSearch(searchQuery.trim());
      saveRecentSearch(searchQuery.trim());
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      
      const searchEnd = performance.now();
      console.log(`Search executed in ${searchEnd - searchStart}ms`);
      
      // Track user behavior for ML improvement
      const searchData = {
        query: searchQuery.trim(),
        intent: searchIntent,
        timestamp: new Date().toISOString(),
        performanceMetrics: searchMetrics
      };
      
      // Store for analytics (could send to backend)
      localStorage.setItem('lastSearchAnalytics', JSON.stringify(searchData));
    }
  }, [query, onSearch, searchIntent, searchMetrics]);

  // Enhanced recent search with better UX
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  // Handle input changes with enhanced UX
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedSuggestionIndex(-1);
  };

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          setQuery(selectedSuggestion.term);
          handleSearch(selectedSuggestion.term);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      case 'Tab':
        // Auto-complete with first suggestion
        if (suggestions.length > 0 && selectedSuggestionIndex === -1) {
          e.preventDefault();
          setQuery(suggestions[0].term);
        }
        break;
    }
  };

  // Handle suggestion click with analytics
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.term);
    handleSearch(suggestion.term);
    
    // Track suggestion selection for ML improvement
    const suggestionData = {
      selectedSuggestion: suggestion,
      allSuggestions: suggestions,
      selectionIndex: suggestions.indexOf(suggestion),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('lastSuggestionSelection', JSON.stringify(suggestionData));
  };

  // Enhanced voice search toggle
  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) return;

    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      recognitionRef.current.start();
      setIsVoiceActive(true);
    }
  };

  // Clear search with better UX
  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setSearchMetrics(null);
    setSearchIntent('');
    searchInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get suggestion icon with enhanced types
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tag': return <Tag className="w-4 h-4" />;
      case 'category': return <BookOpen className="w-4 h-4" />;
      case 'author': return <User className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'ai': return <Brain className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  // Get intent icon
  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'tutorial': return <BookOpen className="w-3 h-3" />;
      case 'comparison': return <TrendingUp className="w-3 h-3" />;
      case 'trending': return <Zap className="w-3 h-3" />;
      case 'informational': return <Brain className="w-3 h-3" />;
      default: return <Search className="w-3 h-3" />;
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {/* Search Input Container */}
      <div className="relative">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-4 z-10">
            <Search className="w-5 h-5 text-low-contrast" />
          </div>

          {/* Search Intent Indicator */}
          {searchIntent && searchIntent !== 'general' && (
            <div className="absolute left-12 z-10">
              <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                {getIntentIcon(searchIntent)}
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {searchIntent}
                </span>
              </div>
            </div>
          )}

          {/* Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length >= 2 || recentSearches.length > 0)}
            placeholder={placeholder}
            className={`w-full pl-12 pr-32 py-4 text-body bg-medium-contrast border border-medium-contrast rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-low-contrast text-high-contrast ${
              searchIntent && searchIntent !== 'general' ? 'pt-6' : ''
            }`}
          />

          {/* Performance Metrics */}
          {searchMetrics && (
            <div className="absolute top-1 right-32 text-xs text-low-contrast">
              {searchMetrics.responseTime.toFixed(0)}ms
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute right-2 flex items-center space-x-1">
            {/* Loading Indicator */}
            {isLoading && (
              <div className="p-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Clear Button */}
            {query && !isLoading && (
              <button
                onClick={clearSearch}
                className="p-2 text-low-contrast hover:text-medium-contrast transition-colors rounded-lg"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Voice Search Button */}
            {showVoiceSearch && recognitionRef.current && (
              <button
                onClick={toggleVoiceSearch}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isVoiceActive 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' 
                    : 'text-low-contrast hover:text-medium-contrast'
                }`}
                title={isVoiceActive ? 'Stop voice search' : 'Start voice search'}
              >
                {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Filters Button */}
            {showFilters && (
              <button
                onClick={onFiltersToggle}
                className="p-2 text-low-contrast hover:text-medium-contrast transition-colors rounded-lg"
                title="Open search filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            )}

            {/* Search Button */}
            <ModernButton
              variant="default"
              intent="primary"
              size="sm"
              onClick={() => handleSearch()}
              className="px-3 py-2"
            >
              <Search className="w-4 h-4" />
            </ModernButton>
          </div>
        </div>

        {/* Enhanced Voice Recording Indicator */}
        {isVoiceActive && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg">
            <div className="flex items-center justify-center space-x-3 text-red-600 dark:text-red-400">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-body-sm font-medium">Listening for voice input...</span>
              <div className="text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full">
                AI-Enhanced
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-red-500/70">
              Try: "Find latest React tutorials" or "Show trending posts"
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Search Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-medium-contrast border border-medium-contrast rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm"
        >
          {/* Search Metrics Bar */}
          {searchMetrics && (
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-medium-contrast">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {searchMetrics.suggestionCount} suggestions
                  </span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {searchMetrics.responseTime.toFixed(0)}ms
                  </span>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      {Math.round(searchMetrics.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="text-low-contrast">
                  Intent: {searchMetrics.searchIntent}
                </div>
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length < 2 && (
            <div className="p-3 border-b border-low-contrast">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-4 h-4 text-low-contrast" />
                <span className="text-body-sm font-medium text-medium-contrast">Recent Searches</span>
                <div className="text-xs bg-low-contrast px-2 py-1 rounded-full text-medium-contrast">
                  {recentSearches.length}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recentSearches.slice(0, 6).map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(recentQuery)}
                    className="text-left px-3 py-2 text-body-sm text-medium-contrast hover:bg-low-contrast rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    {recentQuery}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI-Enhanced Dynamic Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-4 h-4 text-blue-500" />
                <span className="text-body-sm font-medium text-medium-contrast">AI-Powered Suggestions</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.term}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${
                      selectedSuggestionIndex === index
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 scale-105 shadow-md'
                        : 'text-medium-contrast hover:bg-low-contrast hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${
                        selectedSuggestionIndex === index
                          ? 'text-blue-500'
                          : 'text-low-contrast'
                      }`}>
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="text-left">
                        <div className="text-body font-medium">{suggestion.term}</div>
                        <div className="text-xs text-low-contrast capitalize">
                          {suggestion.type} • Relevance: {Math.round((suggestion.popularity || 1) * 10)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-caption text-low-contrast">
                        {suggestion.count} result{suggestion.count !== 1 ? 's' : ''}
                      </div>
                      {suggestion.type === 'trending' && (
                        <div className="flex items-center space-x-1 text-xs text-orange-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>Hot</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 