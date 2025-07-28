import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Calendar, User, Eye, Heart, MessageCircle, Filter, X } from 'lucide-react';
import { firebasePostsService } from '../services/firebase/posts.service';
import { searchService, SearchResult } from '../services/search/SearchService';
import { SearchBar } from '../components/search/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import { ModernCard, ModernButton } from '../components/ModernDesignSystem';
import LoadingSpinner from '../components/LoadingSpinner';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  featured: boolean;
  imageUrl?: string;
  tags: string[];
  categories: string[];
  views: number;
  likes: number;
  commentCount: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Available categories and tags
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Load posts and initialize search
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load posts
        const fetchedPosts = await firebasePostsService.getAllPosts();
        setPosts(fetchedPosts);

        // Extract categories and tags
        const allCategories = new Set<string>();
        const allTags = new Set<string>();

        fetchedPosts.forEach(post => {
          post.categories.forEach(cat => allCategories.add(cat));
          post.tags.forEach(tag => allTags.add(tag));
        });

        setCategories(Array.from(allCategories).sort());
        setTags(Array.from(allTags).sort());

        // Initialize search index
        await searchService.refreshIndex();

        // Check for search query in URL
        const urlQuery = searchParams.get('q');
        if (urlQuery) {
          setSearchQuery(urlQuery);
          setIsSearchMode(true);
        }

      } catch (error) {
        console.error('Error loading blog data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        setSearchLoading(true);
        setIsSearchMode(true);
        try {
          const results = await searchService.search(debouncedSearchQuery, {
            contentType: 'post',
            categories: selectedCategory ? [selectedCategory] : undefined,
            tags: selectedTag ? [selectedTag] : undefined,
            sortBy: 'relevance'
          });
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else if (debouncedSearchQuery.trim().length === 0) {
        setIsSearchMode(false);
        setSearchResults([]);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, selectedCategory, selectedTag]);

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('q', query);
      setSearchParams(newSearchParams);
    } else {
      setSearchParams({});
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchParams({});
  };

  // Filter posts by category/tag
  const filteredPosts = posts.filter(post => {
    if (selectedCategory && !post.categories.includes(selectedCategory)) {
      return false;
    }
    if (selectedTag && !post.tags.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get reading time estimate
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} min read`;
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(`/blog/${result.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-display mb-6 text-gradient-flow">
            Blog & Articles
          </h1>
          <p className="text-body-lg text-medium-contrast mb-8 max-w-2xl mx-auto">
            Discover cutting-edge insights, tutorials, and innovations in technology and development
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              onSearch={handleSearch}
              onFiltersToggle={() => navigate('/search')}
              placeholder="Search articles, tutorials, insights..."
              showVoiceSearch={true}
              showFilters={true}
              initialQuery={searchQuery}
            />
            
            {isSearchMode && (
              <div className="flex items-center justify-center mt-4">
                <ModernButton
                  variant="minimal"
                  intent="secondary"
                  size="sm"
                  icon={X}
                  iconPosition="left"
                  onClick={clearSearch}
                >
                  Clear Search
                </ModernButton>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {!isSearchMode && (categories.length > 0 || tags.length > 0) && (
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 justify-center">
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-body-sm font-medium text-medium-contrast">Categories:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg text-body-sm text-high-contrast focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tag Filter */}
              {tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-body-sm font-medium text-medium-contrast">Tags:</span>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg text-body-sm text-high-contrast focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Tags</option>
                    {tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters */}
              {(selectedCategory || selectedTag) && (
                <ModernButton
                  variant="minimal"
                  intent="secondary"
                  size="sm"
                  icon={X}
                  iconPosition="left"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedTag('');
                  }}
                >
                  Clear Filters
                </ModernButton>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {(loading || searchLoading) && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Search Results */}
        {isSearchMode && !searchLoading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title font-bold text-high-contrast">
                Search Results
              </h2>
              <span className="text-body-sm text-medium-contrast">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Search className="w-16 h-16 mx-auto mb-4 text-low-contrast" />
                  <h3 className="text-subtitle font-semibold text-high-contrast mb-2">
                    No articles found
                  </h3>
                  <p className="text-body text-medium-contrast">
                    Try adjusting your search terms or browse all articles below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {searchResults.map((result) => (
                  <ModernCard
                    key={result.id}
                    className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="space-y-4">
                      <div>
                        <Link
                          to={`/blog/${result.id}`}
                          className="text-body-lg font-semibold text-high-contrast hover:text-gradient-flow transition-colors line-clamp-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {result.title}
                        </Link>
                        <div className="flex items-center space-x-4 mt-2 text-body-sm text-low-contrast">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{result.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(result.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{result.views}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-body text-medium-contrast line-clamp-3">
                        {result.excerpt}
                      </p>

                      {result.highlights.length > 0 && (
                        <div className="border-t border-low-contrast pt-3">
                          <div
                            className="text-body-sm text-medium-contrast"
                            dangerouslySetInnerHTML={{
                              __html: result.highlights[0]
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/&lt;mark&gt;/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">')
                                .replace(/&lt;\/mark&gt;/g, '</mark>')
                            }}
                          />
                        </div>
                      )}

                      {(result.categories.length > 0 || result.tags.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {result.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-caption font-medium"
                            >
                              {category}
                            </span>
                          ))}
                          {result.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-caption font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </ModernCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regular Posts */}
        {!loading && !isSearchMode && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-title font-bold text-high-contrast">
                {selectedCategory || selectedTag ? 'Filtered Articles' : 'All Articles'}
              </h2>
              <span className="text-body-sm text-medium-contrast">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-medium-contrast">
                  No articles found with the current filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredPosts.map((post) => (
                  <ModernCard key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                    {post.imageUrl && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-body-sm text-low-contrast mb-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{post.author}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                          <span>{getReadingTime(post.content)}</span>
                        </div>

                        <Link
                          to={`/blog/${post.id}`}
                          className="text-body-lg font-semibold text-high-contrast hover:text-gradient-flow transition-colors line-clamp-2 block mb-3"
                        >
                          {post.title}
                        </Link>

                        <p className="text-body text-medium-contrast mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      </div>

                      {(post.categories.length > 0 || post.tags.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {post.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-caption font-medium"
                            >
                              {category}
                            </span>
                          ))}
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-caption font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-body-sm text-low-contrast">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}