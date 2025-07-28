/**
 * Advanced Search Bar Component
 * Features: Real-time autocomplete, voice search, search suggestions
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Mic, MicOff, Filter, Clock, Tag, User, BookOpen } from 'lucide-react';
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

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFiltersToggle,
  placeholder = "Search posts, comments, tags...",
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

  // Handle search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        try {
          const results = await searchService.getSuggestions(debouncedQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Initialize voice search
  useEffect(() => {
    if (!showVoiceSearch) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
        setIsVoiceActive(false);
      };

      recognitionRef.current.onerror = () => {
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

  // Handle search execution
  const handleSearch = useCallback((searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      saveRecentSearch(searchQuery.trim());
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [query, onSearch]);

  // Save recent search
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedSuggestionIndex(-1);
  };

  // Handle key navigation
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
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.term);
    handleSearch(suggestion.term);
  };

  // Handle voice search toggle
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

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
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

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tag': return <Tag className="w-4 h-4" />;
      case 'category': return <BookOpen className="w-4 h-4" />;
      case 'author': return <User className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
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

          {/* Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length >= 2 || recentSearches.length > 0)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-4 text-body bg-medium-contrast border border-medium-contrast rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-low-contrast text-high-contrast"
          />

          {/* Action Buttons */}
          <div className="absolute right-2 flex items-center space-x-1">
            {/* Clear Button */}
            {query && (
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
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
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

        {/* Voice Recording Indicator */}
        {isVoiceActive && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-body-sm font-medium">Listening for voice input...</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-medium-contrast border border-medium-contrast rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length < 2 && (
            <div className="p-3 border-b border-low-contrast">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-low-contrast" />
                <span className="text-body-sm font-medium text-medium-contrast">Recent Searches</span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(recentQuery)}
                    className="w-full text-left px-3 py-2 text-body-sm text-medium-contrast hover:bg-low-contrast rounded-lg transition-colors"
                  >
                    {recentQuery}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.term}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      selectedSuggestionIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-medium-contrast hover:bg-low-contrast'
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
                      <span className="text-body">{suggestion.term}</span>
                      <span className="text-caption text-low-contrast">
                        {suggestion.type}
                      </span>
                    </div>
                    <span className="text-caption text-low-contrast">
                      {suggestion.count} result{suggestion.count !== 1 ? 's' : ''}
                    </span>
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