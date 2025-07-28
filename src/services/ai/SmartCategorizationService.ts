/**
 * Smart Categorization Service
 * AI-powered content classification and automated tagging system
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

export interface ContentClassificationRequest {
  content: string;
  title?: string;
  existingTags?: string[];
  existingCategories?: string[];
  context?: ClassificationContext;
}

export interface ClassificationContext {
  contentType: 'blog' | 'video' | 'tutorial' | 'news' | 'review' | 'case-study';
  domain?: string; // e.g., 'technology', 'marketing', 'finance'
  targetAudience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language?: string;
}

export interface ClassificationResult {
  categories: CategoryPrediction[];
  tags: TagPrediction[];
  topics: TopicPrediction[];
  sentiment: SentimentAnalysis;
  complexity: ComplexityAnalysis;
  entities: EntityExtraction[];
  keyPhrases: KeyPhrase[];
  contentType: ContentTypeClassification;
  confidence: number;
  suggestions: ClassificationSuggestion[];
}

export interface CategoryPrediction {
  category: string;
  confidence: number;
  relevanceScore: number;
  reasoning: string;
  subcategories?: string[];
}

export interface TagPrediction {
  tag: string;
  confidence: number;
  relevance: number;
  frequency: number;
  type: 'primary' | 'secondary' | 'contextual';
  source: 'content' | 'title' | 'entities' | 'topics';
}

export interface TopicPrediction {
  topic: string;
  confidence: number;
  coverage: number; // How much of the content covers this topic
  keywords: string[];
  relatedTopics: string[];
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  emotions: EmotionScore[];
  confidence: number;
}

export interface EmotionScore {
  emotion: 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'trust' | 'anticipation' | 'disgust';
  score: number;
}

export interface ComplexityAnalysis {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number; // 1-10
  factors: ComplexityFactor[];
  readabilityMetrics: ReadabilityMetrics;
}

export interface ComplexityFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface ReadabilityMetrics {
  fleschScore: number;
  gradeLevel: number;
  averageSentenceLength: number;
  averageWordsPerSentence: number;
  syllableCount: number;
  difficultWords: string[];
}

export interface EntityExtraction {
  entity: string;
  type: 'person' | 'organization' | 'location' | 'technology' | 'concept' | 'product' | 'event';
  confidence: number;
  mentions: number;
  context: string[];
}

export interface KeyPhrase {
  phrase: string;
  importance: number;
  frequency: number;
  position: 'title' | 'beginning' | 'middle' | 'end';
  type: 'noun_phrase' | 'verb_phrase' | 'technical_term' | 'brand_name';
}

export interface ContentTypeClassification {
  primaryType: string;
  confidence: number;
  characteristics: string[];
  suggestedFormat: string;
}

export interface ClassificationSuggestion {
  type: 'category' | 'tag' | 'content_improvement' | 'seo_optimization';
  suggestion: string;
  reasoning: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface SmartTaggingOptions {
  maxTags?: number;
  includeSemanticTags?: boolean;
  includeTrendingTags?: boolean;
  customDictionary?: string[];
  excludePatterns?: string[];
  minConfidence?: number;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  parent?: string;
  children: string[];
  keywords: string[];
  description: string;
  examples: string[];
}

class SmartCategorizationService {
  private readonly API_ENDPOINT = '/api/ai/classification';
  private classificationCache = new Map<string, ClassificationResult>();
  private categoryHierarchy: Map<string, CategoryHierarchy> = new Map();
  private tagDictionary: Map<string, any> = new Map();
  
  // Pre-defined category structure
  private readonly DEFAULT_CATEGORIES: CategoryHierarchy[] = [
    {
      id: 'technology',
      name: 'Technology',
      children: ['web-development', 'mobile-development', 'ai-ml', 'devops', 'cybersecurity'],
      keywords: ['programming', 'software', 'development', 'code', 'algorithm'],
      description: 'Technology and software development content',
      examples: ['coding tutorials', 'tech reviews', 'development guides']
    },
    {
      id: 'web-development',
      name: 'Web Development',
      parent: 'technology',
      children: ['frontend', 'backend', 'fullstack'],
      keywords: ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'node.js'],
      description: 'Web development technologies and practices',
      examples: ['React tutorials', 'CSS guides', 'JavaScript tips']
    },
    {
      id: 'business',
      name: 'Business',
      children: ['marketing', 'finance', 'management', 'entrepreneurship', 'strategy'],
      keywords: ['business', 'company', 'profit', 'revenue', 'market', 'customer'],
      description: 'Business and entrepreneurship content',
      examples: ['business strategies', 'marketing guides', 'financial advice']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      parent: 'business',
      children: ['digital-marketing', 'content-marketing', 'seo', 'social-media'],
      keywords: ['marketing', 'advertising', 'campaign', 'brand', 'audience', 'engagement'],
      description: 'Marketing strategies and techniques',
      examples: ['SEO guides', 'social media strategies', 'content marketing tips']
    }
  ];

  constructor() {
    this.initializeCategoryHierarchy();
    this.loadTagDictionary();
  }

  /**
   * Classify content and generate categories, tags, and metadata
   */
  public async classifyContent(request: ContentClassificationRequest): Promise<ClassificationResult> {
    try {
      // Check cache
      const cacheKey = this.generateCacheKey(request);
      if (this.classificationCache.has(cacheKey)) {
        return this.classificationCache.get(cacheKey)!;
      }

      // Perform classification
      const [
        categories,
        tags,
        topics,
        sentiment,
        complexity,
        entities,
        keyPhrases,
        contentType
      ] = await Promise.all([
        this.classifyCategories(request),
        this.generateTags(request),
        this.extractTopics(request),
        this.analyzeSentiment(request.content),
        this.analyzeComplexity(request.content),
        this.extractEntities(request.content),
        this.extractKeyPhrases(request.content),
        this.classifyContentType(request)
      ]);

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(categories, tags, topics);

      // Generate suggestions
      const suggestions = this.generateSuggestions(request, {
        categories,
        tags,
        topics,
        entities,
        sentiment,
        complexity
      });

      const result: ClassificationResult = {
        categories,
        tags,
        topics,
        sentiment,
        complexity,
        entities,
        keyPhrases,
        contentType,
        confidence,
        suggestions
      };

      // Cache result
      this.classificationCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error classifying content:', error);
      throw new Error('Failed to classify content. Please try again.');
    }
  }

  /**
   * Generate smart tags for content
   */
  public async generateSmartTags(
    content: string,
    options: SmartTaggingOptions = {}
  ): Promise<TagPrediction[]> {
    try {
      const {
        maxTags = 10,
        includeSemanticTags = true,
        includeTrendingTags = false,
        customDictionary = [],
        excludePatterns = [],
        minConfidence = 0.3
      } = options;

      // Extract content-based tags
      const contentTags = await this.extractContentTags(content);
      
      // Extract semantic tags
      const semanticTags = includeSemanticTags 
        ? await this.extractSemanticTags(content)
        : [];

      // Extract trending tags
      const trendingTags = includeTrendingTags
        ? await this.extractTrendingTags(content)
        : [];

      // Combine and rank tags
      let allTags = [...contentTags, ...semanticTags, ...trendingTags];

      // Apply custom dictionary
      if (customDictionary.length > 0) {
        const customTags = this.matchCustomDictionary(content, customDictionary);
        allTags.push(...customTags);
      }

      // Filter by confidence and exclude patterns
      allTags = allTags
        .filter(tag => tag.confidence >= minConfidence)
        .filter(tag => !this.matchesExcludePattern(tag.tag, excludePatterns));

      // Remove duplicates and rank by relevance
      const uniqueTags = this.deduplicateTags(allTags);
      const rankedTags = this.rankTags(uniqueTags);

      return rankedTags.slice(0, maxTags);

    } catch (error) {
      console.error('Error generating smart tags:', error);
      throw error;
    }
  }

  /**
   * Automatically categorize content based on existing taxonomy
   */
  public async autoCategorize(
    content: string,
    availableCategories?: string[]
  ): Promise<CategoryPrediction[]> {
    try {
      const categories = availableCategories || Array.from(this.categoryHierarchy.keys());
      const predictions: CategoryPrediction[] = [];

      for (const categoryId of categories) {
        const category = this.categoryHierarchy.get(categoryId);
        if (!category) continue;

        const relevance = this.calculateCategoryRelevance(content, category);
        
        if (relevance.score > 0.3) {
          predictions.push({
            category: category.name,
            confidence: relevance.confidence,
            relevanceScore: relevance.score,
            reasoning: relevance.reasoning,
            subcategories: this.findRelevantSubcategories(content, category)
          });
        }
      }

      return predictions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

    } catch (error) {
      console.error('Error auto-categorizing content:', error);
      throw error;
    }
  }

  /**
   * Suggest content improvements based on classification
   */
  public async suggestContentImprovements(
    content: string,
    currentCategories: string[],
    currentTags: string[]
  ): Promise<{
    missingCategories: CategoryPrediction[];
    suggestedTags: TagPrediction[];
    contentGaps: string[];
    optimizationTips: string[];
  }> {
    try {
      const classification = await this.classifyContent({
        content,
        existingCategories: currentCategories,
        existingTags: currentTags
      });

      // Find missing categories
      const missingCategories = classification.categories.filter(cat =>
        !currentCategories.some(current => 
          current.toLowerCase() === cat.category.toLowerCase()
        )
      );

      // Find additional relevant tags
      const suggestedTags = classification.tags.filter(tag =>
        !currentTags.some(current => 
          current.toLowerCase() === tag.tag.toLowerCase()
        )
      ).slice(0, 5);

      // Identify content gaps
      const contentGaps = this.identifyContentGaps(classification);

      // Generate optimization tips
      const optimizationTips = this.generateOptimizationTips(classification);

      return {
        missingCategories,
        suggestedTags,
        contentGaps,
        optimizationTips
      };

    } catch (error) {
      console.error('Error suggesting content improvements:', error);
      throw error;
    }
  }

  // Private classification methods

  private async classifyCategories(request: ContentClassificationRequest): Promise<CategoryPrediction[]> {
    const predictions: CategoryPrediction[] = [];
    const content = `${request.title || ''} ${request.content}`.toLowerCase();

    for (const [categoryId, category] of this.categoryHierarchy) {
      const relevance = this.calculateCategoryRelevance(content, category);
      
      if (relevance.score > 0.2) {
        predictions.push({
          category: category.name,
          confidence: relevance.confidence,
          relevanceScore: relevance.score,
          reasoning: relevance.reasoning,
          subcategories: this.findRelevantSubcategories(content, category)
        });
      }
    }

    return predictions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  private async generateTags(request: ContentClassificationRequest): Promise<TagPrediction[]> {
    const content = request.content.toLowerCase();
    const title = (request.title || '').toLowerCase();
    const tags: TagPrediction[] = [];

    // Extract noun phrases
    const nounPhrases = this.extractNounPhrases(content);
    nounPhrases.forEach((phrase, index) => {
      tags.push({
        tag: phrase,
        confidence: 0.8 - (index * 0.1),
        relevance: this.calculateTagRelevance(phrase, content),
        frequency: this.countOccurrences(phrase, content),
        type: 'primary',
        source: 'content'
      });
    });

    // Extract technical terms
    const technicalTerms = this.extractTechnicalTerms(content);
    technicalTerms.forEach(term => {
      tags.push({
        tag: term,
        confidence: 0.9,
        relevance: 0.8,
        frequency: this.countOccurrences(term, content),
        type: 'secondary',
        source: 'content'
      });
    });

    // Extract from title
    if (title) {
      const titleTerms = this.extractImportantTerms(title);
      titleTerms.forEach(term => {
        tags.push({
          tag: term,
          confidence: 0.95,
          relevance: 1.0,
          frequency: 1,
          type: 'primary',
          source: 'title'
        });
      });
    }

    return this.deduplicateTags(tags)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15);
  }

  private async extractTopics(request: ContentClassificationRequest): Promise<TopicPrediction[]> {
    const content = request.content;
    const topics: TopicPrediction[] = [];

    // Use TF-IDF-like approach to identify main topics
    const terms = this.extractTerms(content);
    const termFrequency = this.calculateTermFrequency(terms);
    const topTerms = Object.entries(termFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    for (const [term, frequency] of topTerms) {
      const relatedTopics = this.findRelatedTopics(term);
      const coverage = this.calculateTopicCoverage(term, content);
      
      topics.push({
        topic: term,
        confidence: Math.min(0.9, frequency / 10),
        coverage,
        keywords: this.extractTopicKeywords(term, content),
        relatedTopics
      });
    }

    return topics;
  }

  private async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    // Simplified sentiment analysis - in production, use ML models
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'love', 'like', 'enjoy', 'happy', 'satisfied', 'pleased', 'delighted'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing', 'hate',
      'dislike', 'frustrated', 'angry', 'upset', 'sad', 'worried', 'concerned'
    ];

    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      overall = 'positive';
      score = Math.min(1, (positiveCount - negativeCount) / words.length * 100);
    } else if (negativeCount > positiveCount) {
      overall = 'negative';
      score = Math.max(-1, (negativeCount - positiveCount) / words.length * -100);
    }

    return {
      overall,
      score,
      emotions: this.analyzeEmotions(content),
      confidence: Math.abs(score) > 0.1 ? 0.7 : 0.3
    };
  }

  private async analyzeComplexity(content: string): Promise<ComplexityAnalysis> {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const avgSentenceLength = words.length / sentences.length;
    const syllableCount = this.countSyllables(content);
    const avgSyllablesPerWord = syllableCount / words.length;
    
    // Calculate complexity factors
    const factors: ComplexityFactor[] = [
      {
        factor: 'Sentence Length',
        impact: avgSentenceLength > 20 ? 0.3 : 0.1,
        description: `Average sentence length: ${avgSentenceLength.toFixed(1)} words`
      },
      {
        factor: 'Vocabulary Complexity',
        impact: avgSyllablesPerWord > 1.5 ? 0.4 : 0.2,
        description: `Average syllables per word: ${avgSyllablesPerWord.toFixed(1)}`
      },
      {
        factor: 'Technical Terms',
        impact: this.countTechnicalTerms(content) / words.length,
        description: `Technical term density: ${((this.countTechnicalTerms(content) / words.length) * 100).toFixed(1)}%`
      }
    ];

    const complexityScore = factors.reduce((sum, factor) => sum + factor.impact, 0) * 10;
    
    let level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
    if (complexityScore > 7) level = 'expert';
    else if (complexityScore > 5) level = 'advanced';
    else if (complexityScore > 3) level = 'intermediate';

    return {
      level,
      score: Math.min(10, complexityScore),
      factors,
      readabilityMetrics: this.calculateReadabilityMetrics(content)
    };
  }

  private async extractEntities(content: string): Promise<EntityExtraction[]> {
    const entities: EntityExtraction[] = [];
    
    // Extract potential entities using patterns
    const patterns = {
      technology: /\b(React|Vue|Angular|Node\.js|Python|JavaScript|TypeScript|Docker|Kubernetes|AWS|Azure|GCP)\b/gi,
      organization: /\b(Google|Microsoft|Apple|Amazon|Facebook|Meta|Netflix|Spotify|Slack|GitHub)\b/gi,
      person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
      location: /\b(New York|London|Paris|Tokyo|San Francisco|Silicon Valley|Seattle|Austin)\b/gi
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern) || [];
      const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];
      
      uniqueMatches.forEach(match => {
        const mentions = (content.match(new RegExp(match, 'gi')) || []).length;
        entities.push({
          entity: match,
          type: type as any,
          confidence: 0.8,
          mentions,
          context: this.extractEntityContext(match, content)
        });
      });
    }

    return entities.sort((a, b) => b.mentions - a.mentions);
  }

  private async extractKeyPhrases(content: string): Promise<KeyPhrase[]> {
    const phrases: KeyPhrase[] = [];
    
    // Extract 2-3 word phrases
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      
      if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
        const frequency = this.countOccurrences(phrase, content);
        const importance = this.calculatePhraseImportance(phrase, content);
        const position = this.determinePhrasePosition(phrase, content);
        
        if (frequency > 1 && importance > 0.3) {
          phrases.push({
            phrase,
            importance,
            frequency,
            position,
            type: this.classifyPhraseType(phrase)
          });
        }
      }
    }

    return phrases
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }

  private async classifyContentType(request: ContentClassificationRequest): Promise<ContentTypeClassification> {
    const content = request.content.toLowerCase();
    const title = (request.title || '').toLowerCase();
    
    // Content type indicators
    const indicators = {
      tutorial: ['how to', 'step by step', 'guide', 'tutorial', 'learn', 'follow these steps'],
      review: ['review', 'rating', 'pros and cons', 'comparison', 'vs', 'better than'],
      news: ['breaking', 'announcement', 'released', 'launched', 'today', 'recently'],
      'case-study': ['case study', 'example', 'implementation', 'project', 'success story'],
      blog: ['opinion', 'thoughts', 'believe', 'think', 'experience', 'journey']
    };

    let bestMatch = 'blog';
    let maxScore = 0;

    for (const [type, terms] of Object.entries(indicators)) {
      const score = terms.reduce((sum, term) => {
        const titleMatches = (title.match(new RegExp(term, 'g')) || []).length * 2;
        const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
        return sum + titleMatches + contentMatches;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = type;
      }
    }

    return {
      primaryType: bestMatch,
      confidence: Math.min(0.95, maxScore / 10),
      characteristics: this.getContentCharacteristics(content),
      suggestedFormat: this.suggestContentFormat(bestMatch)
    };
  }

  // Helper methods

  private calculateCategoryRelevance(content: string, category: CategoryHierarchy): {
    score: number;
    confidence: number;
    reasoning: string;
  } {
    let score = 0;
    let matches: string[] = [];

    // Check keyword matches
    for (const keyword of category.keywords) {
      const occurrences = (content.match(new RegExp(keyword, 'gi')) || []).length;
      if (occurrences > 0) {
        score += occurrences * 0.1;
        matches.push(keyword);
      }
    }

    // Check example matches
    for (const example of category.examples) {
      if (content.includes(example.toLowerCase())) {
        score += 0.2;
        matches.push(example);
      }
    }

    const confidence = Math.min(0.95, score);
    const reasoning = `Matched keywords: ${matches.join(', ')}`;

    return { score, confidence, reasoning };
  }

  private findRelevantSubcategories(content: string, category: CategoryHierarchy): string[] {
    const subcategories: string[] = [];
    
    for (const childId of category.children) {
      const child = this.categoryHierarchy.get(childId);
      if (child) {
        const relevance = this.calculateCategoryRelevance(content, child);
        if (relevance.score > 0.3) {
          subcategories.push(child.name);
        }
      }
    }

    return subcategories;
  }

  private extractNounPhrases(content: string): string[] {
    // Simplified noun phrase extraction
    const words = content.split(/\s+/);
    const phrases: string[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join(' ');
      if (this.isNounPhrase(phrase)) {
        phrases.push(phrase);
      }
    }

    return [...new Set(phrases)];
  }

  private extractTechnicalTerms(content: string): string[] {
    const technicalPatterns = [
      /\b[A-Z][a-z]+\.[a-z]+\b/g, // API patterns (e.g., React.Component)
      /\b[a-z]+\([^)]*\)\b/g, // Function calls
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\w+\-\w+\b/g // Hyphenated terms
    ];

    const terms: string[] = [];
    
    for (const pattern of technicalPatterns) {
      const matches = content.match(pattern) || [];
      terms.push(...matches);
    }

    return [...new Set(terms)];
  }

  private extractImportantTerms(text: string): string[] {
    const words = text.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)$/i.test(word));
    
    return [...new Set(words)];
  }

  private calculateTagRelevance(tag: string, content: string): number {
    const occurrences = this.countOccurrences(tag, content);
    const position = content.toLowerCase().indexOf(tag.toLowerCase());
    const contentLength = content.length;
    
    let relevance = Math.min(1, occurrences * 0.1);
    
    // Boost relevance if tag appears early in content
    if (position < contentLength * 0.2) {
      relevance += 0.2;
    }
    
    return Math.min(1, relevance);
  }

  private countOccurrences(term: string, text: string): number {
    return (text.toLowerCase().match(new RegExp(term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }

  private deduplicateTags(tags: TagPrediction[]): TagPrediction[] {
    const seen = new Set<string>();
    const unique: TagPrediction[] = [];

    for (const tag of tags) {
      const normalizedTag = tag.tag.toLowerCase().trim();
      if (!seen.has(normalizedTag)) {
        seen.add(normalizedTag);
        unique.push(tag);
      }
    }

    return unique;
  }

  private rankTags(tags: TagPrediction[]): TagPrediction[] {
    return tags.sort((a, b) => {
      const scoreA = a.confidence * 0.4 + a.relevance * 0.4 + (a.frequency / 10) * 0.2;
      const scoreB = b.confidence * 0.4 + b.relevance * 0.4 + (b.frequency / 10) * 0.2;
      return scoreB - scoreA;
    });
  }

  private calculateOverallConfidence(
    categories: CategoryPrediction[],
    tags: TagPrediction[],
    topics: TopicPrediction[]
  ): number {
    const avgCategoryConfidence = categories.length > 0 
      ? categories.reduce((sum, cat) => sum + cat.confidence, 0) / categories.length 
      : 0;
    
    const avgTagConfidence = tags.length > 0
      ? tags.reduce((sum, tag) => sum + tag.confidence, 0) / tags.length
      : 0;
    
    const avgTopicConfidence = topics.length > 0
      ? topics.reduce((sum, topic) => sum + topic.confidence, 0) / topics.length
      : 0;

    return (avgCategoryConfidence + avgTagConfidence + avgTopicConfidence) / 3;
  }

  private generateSuggestions(
    request: ContentClassificationRequest,
    classification: any
  ): ClassificationSuggestion[] {
    const suggestions: ClassificationSuggestion[] = [];

    // Category suggestions
    if (classification.categories.length === 0) {
      suggestions.push({
        type: 'category',
        suggestion: 'Add at least one category to improve content discoverability',
        reasoning: 'No categories were automatically detected',
        confidence: 0.9,
        impact: 'high'
      });
    }

    // Tag suggestions
    if (classification.tags.length < 3) {
      suggestions.push({
        type: 'tag',
        suggestion: 'Add more relevant tags to improve content reach',
        reasoning: 'More tags help with content discovery and SEO',
        confidence: 0.8,
        impact: 'medium'
      });
    }

    // SEO suggestions
    if (classification.complexity.level === 'expert') {
      suggestions.push({
        type: 'content_improvement',
        suggestion: 'Consider simplifying language for broader audience appeal',
        reasoning: 'Content complexity may limit audience reach',
        confidence: 0.7,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  // Additional helper methods
  private initializeCategoryHierarchy(): void {
    for (const category of this.DEFAULT_CATEGORIES) {
      this.categoryHierarchy.set(category.id, category);
    }
  }

  private loadTagDictionary(): void {
    // Load tag dictionary for enhanced tagging
  }

  private generateCacheKey(request: ContentClassificationRequest): string {
    return `classification_${JSON.stringify(request).substring(0, 100)}`;
  }

  private async extractContentTags(content: string): Promise<TagPrediction[]> {
    return this.extractNounPhrases(content).map(phrase => ({
      tag: phrase,
      confidence: 0.7,
      relevance: this.calculateTagRelevance(phrase, content),
      frequency: this.countOccurrences(phrase, content),
      type: 'primary' as const,
      source: 'content' as const
    }));
  }

  private async extractSemanticTags(content: string): Promise<TagPrediction[]> {
    // Simplified semantic tag extraction
    const semanticTerms = this.extractTechnicalTerms(content);
    return semanticTerms.map(term => ({
      tag: term,
      confidence: 0.8,
      relevance: 0.7,
      frequency: this.countOccurrences(term, content),
      type: 'secondary' as const,
      source: 'content' as const
    }));
  }

  private async extractTrendingTags(content: string): Promise<TagPrediction[]> {
    // In production, integrate with trending topics APIs
    const trendingTopics = ['AI', 'Machine Learning', 'Cloud Computing', 'Sustainability'];
    return trendingTopics
      .filter(topic => content.toLowerCase().includes(topic.toLowerCase()))
      .map(topic => ({
        tag: topic,
        confidence: 0.6,
        relevance: 0.8,
        frequency: this.countOccurrences(topic, content),
        type: 'contextual' as const,
        source: 'content' as const
      }));
  }

  private matchCustomDictionary(content: string, dictionary: string[]): TagPrediction[] {
    return dictionary
      .filter(term => content.toLowerCase().includes(term.toLowerCase()))
      .map(term => ({
        tag: term,
        confidence: 0.9,
        relevance: 1.0,
        frequency: this.countOccurrences(term, content),
        type: 'primary' as const,
        source: 'content' as const
      }));
  }

  private matchesExcludePattern(tag: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => 
      new RegExp(pattern, 'i').test(tag)
    );
  }

  // Implement remaining utility methods...
  private extractTerms(content: string): string[] { return content.split(/\s+/); }
  private calculateTermFrequency(terms: string[]): Record<string, number> { 
    const freq: Record<string, number> = {};
    terms.forEach(term => freq[term] = (freq[term] || 0) + 1);
    return freq;
  }
  private findRelatedTopics(term: string): string[] { return []; }
  private calculateTopicCoverage(term: string, content: string): number { return 0.5; }
  private extractTopicKeywords(term: string, content: string): string[] { return []; }
  private analyzeEmotions(content: string): EmotionScore[] { return []; }
  private countSyllables(text: string): number { return text.length / 4; }
  private countTechnicalTerms(content: string): number { return 0; }
  private calculateReadabilityMetrics(content: string): ReadabilityMetrics {
    return {
      fleschScore: 70,
      gradeLevel: 8,
      averageSentenceLength: 15,
      averageWordsPerSentence: 15,
      syllableCount: 100,
      difficultWords: []
    };
  }
  private extractEntityContext(entity: string, content: string): string[] { return []; }
  private calculatePhraseImportance(phrase: string, content: string): number { return 0.5; }
  private determinePhrasePosition(phrase: string, content: string): 'title' | 'beginning' | 'middle' | 'end' { return 'middle'; }
  private classifyPhraseType(phrase: string): 'noun_phrase' | 'verb_phrase' | 'technical_term' | 'brand_name' { return 'noun_phrase'; }
  private getContentCharacteristics(content: string): string[] { return []; }
  private suggestContentFormat(type: string): string { return 'article'; }
  private isNounPhrase(phrase: string): boolean { return true; }
  private identifyContentGaps(classification: ClassificationResult): string[] { return []; }
  private generateOptimizationTips(classification: ClassificationResult): string[] { return []; }
}

// Export singleton instance
export const smartCategorizationService = new SmartCategorizationService(); 