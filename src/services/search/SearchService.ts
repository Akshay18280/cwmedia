/**
 * Advanced Search Service for Carelwave Media
 * Provides full-text search, filtering, autocomplete, and analytics
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  authors?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  contentType?: 'post' | 'comment' | 'all';
  sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  type: 'post' | 'comment';
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  categories: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  comments: number;
  relevanceScore: number;
  matchedTerms: string[];
  highlights: string[];
}

export interface SearchSuggestion {
  term: string;
  type: 'query' | 'tag' | 'category' | 'author' | 'trending' | 'ai';
  count: number;
  popularity: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  topQueries: Array<{ query: string; count: number; lastSearched: Date }>;
  topFilters: Array<{ filter: string; count: number }>;
  averageResultsPerSearch: number;
  popularContent: Array<{ id: string; title: string; searchHits: number }>;
  searchTrends: Array<{ date: string; searches: number }>;
}

class SearchService {
  private searchIndex: Map<string, SearchResult> = new Map();
  private isIndexed = false;
  private readonly SEARCH_ANALYTICS_DOC = 'search_analytics';
  private readonly MIN_QUERY_LENGTH = 2;
  private readonly MAX_SUGGESTIONS = 10;
  private readonly MAX_RESULTS = 50;

  /**
   * Initialize search index with all searchable content
   */
  async initializeIndex(): Promise<void> {
    if (this.isIndexed) return;

    try {
      console.log('Initializing search index...');
      
      // Index all posts
      await this.indexPosts();
      
      // Index all comments (if comments collection exists)
      await this.indexComments();
      
      this.isIndexed = true;
      console.log(`Search index initialized with ${this.searchIndex.size} items`);
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      throw error;
    }
  }

  /**
   * Index all posts for search
   */
  private async indexPosts(): Promise<void> {
    try {
      const postsQuery = query(collection(db, 'posts'), where('published', '==', true));
      const postsSnapshot = await getDocs(postsQuery);
      
      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        const searchResult: SearchResult = {
          id: doc.id,
          type: 'post',
          title: data.title || '',
          content: data.content || '',
          excerpt: data.excerpt || this.generateExcerpt(data.content || ''),
          author: data.author || 'Anonymous',
          authorId: data.authorId || '',
          categories: Array.isArray(data.categories) ? data.categories : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          views: data.views || 0,
          likes: data.likes || 0,
          comments: data.commentCount || 0,
          relevanceScore: 0,
          matchedTerms: [],
          highlights: []
        };
        
        this.searchIndex.set(doc.id, searchResult);
      });
    } catch (error) {
      console.error('Error indexing posts:', error);
    }
  }

  /**
   * Index all comments for search
   */
  private async indexComments(): Promise<void> {
    try {
      const commentsQuery = query(collection(db, 'comments'), where('approved', '==', true));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      commentsSnapshot.forEach((doc) => {
        const data = doc.data();
        const searchResult: SearchResult = {
          id: doc.id,
          type: 'comment',
          title: `Comment on: ${data.postTitle || 'Post'}`,
          content: data.content || '',
          excerpt: this.generateExcerpt(data.content || ''),
          author: data.author || 'Anonymous',
          authorId: data.authorId || '',
          categories: [],
          tags: [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          views: 0,
          likes: data.likes || 0,
          comments: 0,
          relevanceScore: 0,
          matchedTerms: [],
          highlights: []
        };
        
        this.searchIndex.set(`comment_${doc.id}`, searchResult);
      });
    } catch (error) {
      console.error('Error indexing comments:', error);
    }
  }

  /**
   * Perform full-text search with advanced filtering
   */
  async search(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
    await this.initializeIndex();
    
    if (query.length < this.MIN_QUERY_LENGTH) {
      return [];
    }

    // Track search analytics
    await this.trackSearch(query, filters);

    const searchTerms = this.tokenizeQuery(query);
    const results: SearchResult[] = [];

    // Search through index
    for (const [id, item] of this.searchIndex) {
      if (filters.contentType && filters.contentType !== 'all' && item.type !== filters.contentType) {
        continue;
      }

      const relevanceScore = this.calculateRelevance(item, searchTerms);
      if (relevanceScore > 0) {
        const result = {
          ...item,
          relevanceScore,
          matchedTerms: this.getMatchedTerms(item, searchTerms),
          highlights: this.generateHighlights(item, searchTerms)
        };
        
        if (this.passesFilters(result, filters)) {
          results.push(result);
        }
      }
    }

    // Sort results
    this.sortResults(results, filters.sortBy || 'relevance', filters.sortOrder || 'desc');

    // Return limited results
    return results.slice(0, this.MAX_RESULTS);
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < this.MIN_QUERY_LENGTH) {
      return [];
    }

    await this.initializeIndex();
    
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Get suggestions from existing content
    const termCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const authorCounts = new Map<string, number>();

    for (const [id, item] of this.searchIndex) {
      // Extract terms from title and content
      const allText = `${item.title} ${item.content}`.toLowerCase();
      const words = this.tokenizeQuery(allText);
      
      words.forEach(word => {
        if (word.includes(queryLower) && word.length > this.MIN_QUERY_LENGTH) {
          termCounts.set(word, (termCounts.get(word) || 0) + 1);
        }
      });

      // Check categories
      item.categories.forEach(category => {
        if (category.toLowerCase().includes(queryLower)) {
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        }
      });

      // Check tags
      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });

      // Check authors
      if (item.author.toLowerCase().includes(queryLower)) {
        authorCounts.set(item.author, (authorCounts.get(item.author) || 0) + 1);
      }
    }

    // Convert to suggestions
    [...termCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([term, count]) => {
        suggestions.push({
          term,
          type: 'query',
          count,
          popularity: count
        });
      });

    [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([category, count]) => {
        suggestions.push({
          term: category,
          type: 'category',
          count,
          popularity: count
        });
      });

    [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([tag, count]) => {
        suggestions.push({
          term: tag,
          type: 'tag',
          count,
          popularity: count
        });
      });

    [...authorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([author, count]) => {
        suggestions.push({
          term: author,
          type: 'author',
          count,
          popularity: count
        });
      });

    return suggestions
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, this.MAX_SUGGESTIONS);
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(): Promise<SearchAnalytics> {
    try {
      const analyticsDoc = await getDoc(doc(db, 'analytics', this.SEARCH_ANALYTICS_DOC));
      
      if (analyticsDoc.exists()) {
        const data = analyticsDoc.data();
        return {
          totalSearches: data.totalSearches || 0,
          topQueries: data.topQueries || [],
          topFilters: data.topFilters || [],
          averageResultsPerSearch: data.averageResultsPerSearch || 0,
          popularContent: data.popularContent || [],
          searchTrends: data.searchTrends || []
        };
      }

      return {
        totalSearches: 0,
        topQueries: [],
        topFilters: [],
        averageResultsPerSearch: 0,
        popularContent: [],
        searchTrends: []
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<{
    categories: string[];
    tags: string[];
    authors: string[];
  }> {
    await this.initializeIndex();

    const categories = new Set<string>();
    const tags = new Set<string>();
    const authors = new Set<string>();

    for (const [id, item] of this.searchIndex) {
      item.categories.forEach(cat => categories.add(cat));
      item.tags.forEach(tag => tags.add(tag));
      authors.add(item.author);
    }

    return {
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      authors: Array.from(authors).sort()
    };
  }

  /**
   * Force refresh of search index
   */
  async refreshIndex(): Promise<void> {
    this.searchIndex.clear();
    this.isIndexed = false;
    await this.initializeIndex();
  }

  // Private helper methods

  private tokenizeQuery(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);
    return stopWords.has(word);
  }

  private calculateRelevance(item: SearchResult, searchTerms: string[]): number {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    const excerptLower = item.excerpt.toLowerCase();

    searchTerms.forEach(term => {
      // Title matches (highest weight)
      if (titleLower.includes(term)) {
        score += titleLower === term ? 100 : 50;
      }

      // Exact phrase in title
      if (titleLower.startsWith(term)) {
        score += 30;
      }

      // Content matches
      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 5;

      // Excerpt matches
      if (excerptLower.includes(term)) {
        score += 10;
      }

      // Category and tag matches
      item.categories.forEach(cat => {
        if (cat.toLowerCase().includes(term)) {
          score += 20;
        }
      });

      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(term)) {
          score += 15;
        }
      });

      // Author match
      if (item.author.toLowerCase().includes(term)) {
        score += 10;
      }
    });

    // Boost score based on content popularity
    score += Math.log(item.views + 1) * 2;
    score += Math.log(item.likes + 1) * 3;
    score += Math.log(item.comments + 1) * 2;

    return score;
  }

  private getMatchedTerms(item: SearchResult, searchTerms: string[]): string[] {
    const matched: string[] = [];
    const allText = `${item.title} ${item.content} ${item.categories.join(' ')} ${item.tags.join(' ')} ${item.author}`.toLowerCase();

    searchTerms.forEach(term => {
      if (allText.includes(term)) {
        matched.push(term);
      }
    });

    return matched;
  }

  private generateHighlights(item: SearchResult, searchTerms: string[]): string[] {
    const highlights: string[] = [];
    const content = item.content;
    const maxHighlightLength = 150;

    searchTerms.forEach(term => {
      const regex = new RegExp(`(.{0,50})(${term})(.{0,50})`, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          if (match.length > maxHighlightLength) {
            match = match.substring(0, maxHighlightLength) + '...';
          }
          highlights.push(match.replace(new RegExp(term, 'gi'), `<mark>$&</mark>`));
        });
      }
    });

    return highlights;
  }

  private passesFilters(result: SearchResult, filters: SearchFilters): boolean {
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.some(cat => result.categories.includes(cat))) {
        return false;
      }
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => result.tags.includes(tag))) {
        return false;
      }
    }

    // Author filter
    if (filters.authors && filters.authors.length > 0) {
      if (!filters.authors.includes(result.author)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const itemDate = result.createdAt;
      if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private sortResults(results: SearchResult[], sortBy: string, sortOrder: string): void {
    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'popularity':
          comparison = (a.views + a.likes) - (b.views + b.likes);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = a.relevanceScore - b.relevanceScore;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private generateExcerpt(content: string): string {
    const maxLength = 200;
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    
    if (stripped.length <= maxLength) {
      return stripped;
    }

    const truncated = stripped.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  private async trackSearch(query: string, filters: SearchFilters): Promise<void> {
    const analyticsRef = doc(db, 'analytics', this.SEARCH_ANALYTICS_DOC);
    
    try {
      // Update total searches
      await updateDoc(analyticsRef, {
        totalSearches: increment(1),
        [`topQueries.${query}.count`]: increment(1),
        [`topQueries.${query}.lastSearched`]: new Date()
      });

      // Track filter usage
      Object.keys(filters).forEach(async (filterKey) => {
        if (filters[filterKey as keyof SearchFilters]) {
          await updateDoc(analyticsRef, {
            [`topFilters.${filterKey}.count`]: increment(1)
          });
        }
      });

    } catch (error) {
      // Create document if it doesn't exist
      try {
        await setDoc(analyticsRef, {
          totalSearches: 1,
          topQueries: { [query]: { count: 1, lastSearched: new Date() } },
          topFilters: {},
          averageResultsPerSearch: 0,
          popularContent: [],
          searchTrends: []
        });
      } catch (createError) {
        console.error('Error tracking search:', createError);
      }
    }
  }
}

// Export singleton instance
export const searchService = new SearchService(); 