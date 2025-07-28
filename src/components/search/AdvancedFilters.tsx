/**
 * Advanced Search Filters Component
 * Provides comprehensive filtering options for search results
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, BookOpen, Filter, RotateCcw } from 'lucide-react';
import { SearchFilters } from '../../services/search/SearchService';
import { searchService } from '../../services/search/SearchService';
import { ModernButton, ModernCard } from '../ModernDesignSystem';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

interface FilterOptions {
  categories: string[];
  tags: string[];
  authors: string[];
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onFiltersChange,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    tags: [],
    authors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoading(true);
      try {
        const options = await searchService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadFilterOptions();
    }
  }, [isOpen]);

  // Handle filter updates
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  // Handle category selection
  const handleCategoryChange = (category: string, checked: boolean) => {
    const categories = filters.categories || [];
    if (checked) {
      updateFilters({ categories: [...categories, category] });
    } else {
      updateFilters({ categories: categories.filter(c => c !== category) });
    }
  };

  // Handle tag selection
  const handleTagChange = (tag: string, checked: boolean) => {
    const tags = filters.tags || [];
    if (checked) {
      updateFilters({ tags: [...tags, tag] });
    } else {
      updateFilters({ tags: tags.filter(t => t !== tag) });
    }
  };

  // Handle author selection
  const handleAuthorChange = (author: string, checked: boolean) => {
    const authors = filters.authors || [];
    if (checked) {
      updateFilters({ authors: [...authors, author] });
    } else {
      updateFilters({ authors: authors.filter(a => a !== author) });
    }
  };

  // Handle date range change
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const dateRange = filters.dateRange || { start: new Date(), end: new Date() };
    const newDate = new Date(value);
    
    if (type === 'start') {
      updateFilters({ dateRange: { ...dateRange, start: newDate } });
    } else {
      updateFilters({ dateRange: { ...dateRange, end: newDate } });
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.authors?.length) count += filters.authors.length;
    if (filters.dateRange) count += 1;
    if (filters.contentType && filters.contentType !== 'all') count += 1;
    return count;
  };

  // Quick date range presets
  const datePresets = [
    { label: 'Last Week', days: 7 },
    { label: 'Last Month', days: 30 },
    { label: 'Last 3 Months', days: 90 },
    { label: 'Last Year', days: 365 }
  ];

  const applyDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    updateFilters({ dateRange: { start, end } });
  };

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <ModernCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-medium-contrast">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-gradient-flow" />
            <h2 className="text-title font-bold text-high-contrast">Advanced Search Filters</h2>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-caption font-medium">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <ModernButton
              variant="minimal"
              intent="secondary"
              size="sm"
              onClick={clearAllFilters}
              icon={RotateCcw}
              iconPosition="left"
            >
              Clear All
            </ModernButton>
            <button
              onClick={onClose}
              className="p-2 text-low-contrast hover:text-medium-contrast transition-colors rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-medium-contrast">Loading filter options...</p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Content Type Filter */}
            <div>
              <h3 className="text-subtitle font-semibold text-high-contrast mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                Content Type
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'all', label: 'All Content' },
                  { value: 'post', label: 'Posts Only' },
                  { value: 'comment', label: 'Comments Only' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      value={option.value}
                      checked={filters.contentType === option.value || (!filters.contentType && option.value === 'all')}
                      onChange={(e) => updateFilters({ contentType: e.target.value as any })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-body text-medium-contrast">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h3 className="text-subtitle font-semibold text-high-contrast mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-500" />
                Date Range
              </h3>
              
              {/* Quick Presets */}
              <div className="mb-4">
                <p className="text-body-sm text-medium-contrast mb-2">Quick presets:</p>
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <ModernButton
                      key={preset.label}
                      variant="minimal"
                      intent="secondary"
                      size="xs"
                      onClick={() => applyDatePreset(preset.days)}
                    >
                      {preset.label}
                    </ModernButton>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.start ? formatDateForInput(filters.dateRange.start) : ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.end ? formatDateForInput(filters.dateRange.end) : ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                  />
                </div>
              </div>
            </div>

            {/* Categories Filter */}
            {filterOptions.categories.length > 0 && (
              <div>
                <h3 className="text-subtitle font-semibold text-high-contrast mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                  Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filterOptions.categories.map((category) => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(category) || false}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-body-sm text-medium-contrast truncate">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {filterOptions.tags.length > 0 && (
              <div>
                <h3 className="text-subtitle font-semibold text-high-contrast mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-orange-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.tags.map((tag) => (
                    <label
                      key={tag}
                      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full cursor-pointer transition-all ${
                        filters.tags?.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600'
                          : 'bg-low-contrast text-medium-contrast border border-medium-contrast hover:bg-medium-contrast'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.tags?.includes(tag) || false}
                        onChange={(e) => handleTagChange(tag, e.target.checked)}
                        className="sr-only"
                      />
                      <Tag className="w-3 h-3" />
                      <span className="text-body-sm font-medium">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Authors Filter */}
            {filterOptions.authors.length > 0 && (
              <div>
                <h3 className="text-subtitle font-semibold text-high-contrast mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-500" />
                  Authors
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filterOptions.authors.map((author) => (
                    <label key={author} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.authors?.includes(author) || false}
                        onChange={(e) => handleAuthorChange(author, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-body-sm text-medium-contrast truncate">{author}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sorting Options */}
            <div>
              <h3 className="text-subtitle font-semibold text-high-contrast mb-4">Sort Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy || 'relevance'}
                    onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date Published</option>
                    <option value="popularity">Popularity</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => updateFilters({ sortOrder: e.target.value as any })}
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-low-contrast border-t border-medium-contrast">
          <p className="text-body-sm text-medium-contrast">
            {getActiveFilterCount() > 0 
              ? `${getActiveFilterCount()} filter${getActiveFilterCount() !== 1 ? 's' : ''} applied`
              : 'No filters applied'
            }
          </p>
          <div className="flex items-center space-x-3">
            <ModernButton
              variant="minimal"
              intent="secondary"
              onClick={onClose}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="default"
              intent="primary"
              onClick={onClose}
            >
              Apply Filters
            </ModernButton>
          </div>
        </div>
      </ModernCard>
    </div>
  );
}; 