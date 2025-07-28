/**
 * SEO Analysis Service
 * Automated SEO analysis and optimization recommendations using AI
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

export interface SEOAnalysisRequest {
  content: string;
  targetKeywords: string[];
  url?: string;
  title?: string;
  metaDescription?: string;
  headers?: string[];
  images?: SEOImage[];
  competitors?: string[];
}

export interface SEOImage {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
}

export interface SEOAnalysisResult {
  overallScore: number; // 0-100
  analysis: SEOAnalysis;
  recommendations: SEORecommendation[];
  opportunities: SEOOpportunity[];
  technicalIssues: TechnicalIssue[];
  competitorAnalysis?: CompetitorAnalysis;
  keywordAnalysis: KeywordAnalysis;
  contentOptimization: ContentOptimization;
}

export interface LocalSEOAnalysis {
  score: number;
  businessListing: boolean;
  localKeywords: string[];
  reviews: number;
  citations: number;
}

export interface SEOAnalysis {
  onPage: OnPageSEOAnalysis;
  technical: TechnicalSEOAnalysis;
  content: ContentSEOAnalysis;
  userExperience: UserExperienceAnalysis;
  mobile: MobileSEOAnalysis;
  localSEO?: LocalSEOAnalysis;
}

export interface OnPageSEOAnalysis {
  score: number;
  title: TitleAnalysis;
  metaDescription: MetaDescriptionAnalysis;
  headers: HeaderAnalysis;
  internalLinks: LinkAnalysis;
  images: ImageSEOAnalysis;
  urlStructure: URLAnalysis;
}

export interface TitleAnalysis {
  score: number;
  length: number;
  hasTargetKeyword: boolean;
  keywordPosition: number;
  isClickWorthy: boolean;
  issues: string[];
  suggestions: string[];
  alternatives: string[];
}

export interface MetaDescriptionAnalysis {
  score: number;
  length: number;
  hasTargetKeyword: boolean;
  hasCallToAction: boolean;
  isCompelling: boolean;
  issues: string[];
  suggestions: string[];
  alternatives: string[];
}

export interface HeaderAnalysis {
  score: number;
  h1Count: number;
  h1HasKeyword: boolean;
  headerStructure: HeaderStructureItem[];
  keywordDistribution: number;
  issues: string[];
  suggestions: string[];
}

export interface HeaderStructureItem {
  level: number;
  text: string;
  hasKeyword: boolean;
  length: number;
}

export interface LinkAnalysis {
  score: number;
  internalLinkCount: number;
  externalLinkCount: number;
  anchorTextOptimization: number;
  brokenLinks: string[];
  suggestions: string[];
}

export interface ImageSEOAnalysis {
  score: number;
  totalImages: number;
  imagesWithAlt: number;
  altTextOptimization: number;
  imageFileNames: string[];
  issues: string[];
  suggestions: string[];
}

export interface URLAnalysis {
  score: number;
  length: number;
  hasKeywords: boolean;
  isClean: boolean;
  issues: string[];
  suggestions: string[];
}

export interface TechnicalSEOAnalysis {
  score: number;
  pageSpeed: PageSpeedAnalysis;
  crawlability: CrawlabilityAnalysis;
  'structured Data': StructuredDataAnalysis;
  security: SecurityAnalysis;
  indexability: IndexabilityAnalysis;
}

export interface PageSpeedAnalysis {
  score: number;
  loadTime: number;
  coreWebVitals: CoreWebVitals;
  optimizationSuggestions: string[];
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
}

export interface ContentSEOAnalysis {
  score: number;
  wordCount: number;
  readabilityScore: number;
  keywordDensity: Record<string, number>;
  semanticKeywords: string[];
  contentDepth: number;
  uniqueness: number;
  topicCoverage: number;
  contentGaps: string[];
}

export interface UserExperienceAnalysis {
  score: number;
  readability: ReadabilityAnalysis;
  engagement: EngagementAnalysis;
  navigation: NavigationAnalysis;
  accessibility: AccessibilityAnalysis;
}

export interface ReadabilityAnalysis {
  score: number;
  fleschScore: number;
  averageSentenceLength: number;
  averageWordsPerSentence: number;
  complexWords: number;
  suggestions: string[];
}

export interface EngagementAnalysis {
  score: number;
  estimatedTimeOnPage: number;
  bounceRatePrediction: number;
  engagementElements: string[];
  suggestions: string[];
}

export interface MobileSEOAnalysis {
  score: number;
  mobileOptimization: MobileOptimizationAnalysis;
  pageSpeenMobile: number;
  usabilityIssues: string[];
  suggestions: string[];
}

export interface SEORecommendation {
  type: 'critical' | 'important' | 'moderate' | 'minor';
  category: 'content' | 'technical' | 'on-page' | 'user-experience' | 'mobile';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  implementation: ImplementationGuide;
  expectedImprovement: number; // estimated score improvement
}

export interface ImplementationGuide {
  steps: string[];
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tools?: string[];
  examples?: string[];
}

export interface SEOOpportunity {
  title: string;
  description: string;
  potentialTrafficIncrease: number;
  competitorGap: boolean;
  keywords: string[];
  actionItems: string[];
  priority: number;
}

export interface TechnicalIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  issue: string;
  location?: string;
  solution: string;
  impact: string;
}

export interface CompetitorAnalysis {
  competitors: CompetitorSEOData[];
  gaps: string[];
  opportunities: string[];
  benchmarks: SEOBenchmarks;
}

export interface CompetitorSEOData {
  url: string;
  seoScore: number;
  targetKeywords: string[];
  contentLength: number;
  backlinks: number;
  domainAuthority: number;
  topicsCovered: string[];
}

export interface SEOBenchmarks {
  averageContentLength: number;
  averageSEOScore: number;
  commonKeywords: string[];
  topPerformingContent: string[];
}

export interface KeywordAnalysis {
  primaryKeyword: KeywordMetrics;
  secondaryKeywords: KeywordMetrics[];
  semanticKeywords: KeywordMetrics[];
  missingKeywords: string[];
  overOptimized: string[];
  opportunities: KeywordOpportunity[];
}

export interface KeywordMetrics {
  keyword: string;
  density: number;
  frequency: number;
  prominence: number;
  distribution: number;
  competition: 'low' | 'medium' | 'high';
  searchVolume?: number;
  difficulty?: number;
  trend?: 'rising' | 'stable' | 'declining';
}

export interface KeywordOpportunity {
  keyword: string;
  opportunity: 'underused' | 'missing' | 'overused';
  potentialImprovement: number;
  suggestion: string;
}

export interface ContentOptimization {
  suggestions: ContentSuggestion[];
  missingTopics: string[];
  contentGaps: string[];
  lengthRecommendation: {
    current: number;
    recommended: number;
    reasoning: string;
  };
  structureImprovements: string[];
}

export interface ContentSuggestion {
  type: 'add' | 'modify' | 'remove' | 'restructure';
  section: string;
  current?: string;
  suggested: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
}

class SEOAnalysisService {
  private readonly AI_ENDPOINT = '/api/ai/seo-analysis';
  private analysisCache = new Map<string, SEOAnalysisResult>();
  private keywordDatabase = new Map<string, any>();

  // SEO scoring weights
  private readonly SCORING_WEIGHTS = {
    onPage: 0.25,
    technical: 0.20,
    content: 0.25,
    userExperience: 0.15,
    mobile: 0.15
  };

  constructor() {
    this.loadKeywordDatabase();
  }

  /**
   * Perform comprehensive SEO analysis
   */
  public async analyzeSEO(request: SEOAnalysisRequest): Promise<SEOAnalysisResult> {
    try {
      // Check cache
      const cacheKey = this.generateCacheKey(request);
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey)!;
      }

      // Perform analysis
      const [
        onPageAnalysis,
        technicalAnalysis,
        contentAnalysis,
        userExperienceAnalysis,
        mobileAnalysis,
        keywordAnalysis,
        competitorAnalysis
      ] = await Promise.all([
        this.analyzeOnPage(request),
        this.analyzeTechnical(request),
        this.analyzeContent(request),
        this.analyzeUserExperience(request),
        this.analyzeMobile(request),
        this.analyzeKeywords(request),
        request.competitors ? this.analyzeCompetitors(request) : Promise.resolve(undefined)
      ]);

      // Calculate overall score
      const overallScore = this.calculateOverallScore({
        onPage: onPageAnalysis,
        technical: technicalAnalysis,
        content: contentAnalysis,
        userExperience: userExperienceAnalysis,
        mobile: mobileAnalysis
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        onPage: onPageAnalysis,
        technical: technicalAnalysis,
        content: contentAnalysis,
        userExperience: userExperienceAnalysis,
        mobile: mobileAnalysis
      });

      // Identify opportunities
      const opportunities = this.identifyOpportunities(keywordAnalysis, competitorAnalysis);

      // Detect technical issues
      const technicalIssues = this.detectTechnicalIssues(technicalAnalysis);

      // Generate content optimization suggestions
      const contentOptimization = this.generateContentOptimization(request, contentAnalysis, keywordAnalysis);

      const result: SEOAnalysisResult = {
        overallScore,
        analysis: {
          onPage: onPageAnalysis,
          technical: technicalAnalysis,
          content: contentAnalysis,
          userExperience: userExperienceAnalysis,
          mobile: mobileAnalysis
        },
        recommendations,
        opportunities,
        technicalIssues,
        competitorAnalysis,
        keywordAnalysis,
        contentOptimization
      };

      // Cache result
      this.analysisCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error performing SEO analysis:', error);
      throw new Error('Failed to analyze SEO. Please try again.');
    }
  }

  /**
   * Analyze keyword performance and opportunities
   */
  public async analyzeKeywordPerformance(
    content: string,
    keywords: string[]
  ): Promise<{
    performance: Record<string, KeywordMetrics>;
    suggestions: KeywordOpportunity[];
    relatedKeywords: string[];
  }> {
    try {
      const performance: Record<string, KeywordMetrics> = {};
      
      for (const keyword of keywords) {
        performance[keyword] = this.analyzeKeywordInContent(keyword, content);
      }

      const suggestions = this.generateKeywordSuggestions(performance, content);
      const relatedKeywords = await this.findRelatedKeywords(keywords);

      return {
        performance,
        suggestions,
        relatedKeywords
      };

    } catch (error) {
      console.error('Error analyzing keyword performance:', error);
      throw error;
    }
  }

  /**
   * Generate SEO-optimized content suggestions
   */
  public async generateSEOContentSuggestions(
    topic: string,
    targetKeywords: string[],
    contentType: 'blog' | 'landing-page' | 'product-page' | 'category-page'
  ): Promise<{
    title: string[];
    metaDescription: string[];
    headers: string[];
    contentOutline: string[];
    internalLinkSuggestions: string[];
  }> {
    try {
      const [titles, metaDescriptions, headers, outline, linkSuggestions] = await Promise.all([
        this.generateSEOTitles(topic, targetKeywords),
        this.generateMetaDescriptions(topic, targetKeywords),
        this.generateSEOHeaders(topic, targetKeywords),
        this.generateContentOutline(topic, targetKeywords, contentType),
        this.suggestInternalLinks(topic, targetKeywords)
      ]);

      return {
        title: titles,
        metaDescription: metaDescriptions,
        headers,
        contentOutline: outline,
        internalLinkSuggestions: linkSuggestions
      };

    } catch (error) {
      console.error('Error generating SEO content suggestions:', error);
      throw error;
    }
  }

  /**
   * Perform real-time SEO optimization check
   */
  public async performRealTimeOptimization(
    content: string,
    targetKeyword: string
  ): Promise<{
    score: number;
    issues: string[];
    quickFixes: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const quickFixes: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Keyword density check
    const density = this.calculateKeywordDensity(content, [targetKeyword])[targetKeyword] || 0;
    
    if (density < 0.5) {
      issues.push(`Keyword "${targetKeyword}" density too low (${density.toFixed(1)}%)`);
      quickFixes.push(`Add "${targetKeyword}" 2-3 more times naturally`);
      score -= 15;
    } else if (density > 3) {
      issues.push(`Keyword "${targetKeyword}" density too high (${density.toFixed(1)}%)`);
      quickFixes.push(`Reduce "${targetKeyword}" usage to avoid keyword stuffing`);
      score -= 20;
    }

    // Content length check
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push(`Content too short (${wordCount} words)`);
      quickFixes.push('Add more detailed explanations and examples');
      score -= 25;
    }

    // Readability check
    const readabilityScore = this.calculateReadabilityScore(content);
    if (readabilityScore < 60) {
      warnings.push('Content may be difficult to read');
      quickFixes.push('Use shorter sentences and simpler words');
      score -= 10;
    }

    // Header check
    if (!content.includes('#') && !content.match(/<h[1-6]>/i)) {
      issues.push('No headers found');
      quickFixes.push('Add headers to structure your content');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      quickFixes,
      warnings
    };
  }

  // Private analysis methods

  private async analyzeOnPage(request: SEOAnalysisRequest): Promise<OnPageSEOAnalysis> {
    const titleAnalysis = this.analyzeTitleTag(request.title || '', request.targetKeywords);
    const metaAnalysis = this.analyzeMetaDescription(request.metaDescription || '', request.targetKeywords);
    const headerAnalysis = this.analyzeHeaders(request.content, request.targetKeywords);
    const linkAnalysis = this.analyzeLinks(request.content);
    const imageAnalysis = this.analyzeImages(request.images || []);
    const urlAnalysis = this.analyzeURL(request.url || '');

    const scores = [
      titleAnalysis.score,
      metaAnalysis.score,
      headerAnalysis.score,
      linkAnalysis.score,
      imageAnalysis.score,
      urlAnalysis.score
    ];

    return {
      score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      title: titleAnalysis,
      metaDescription: metaAnalysis,
      headers: headerAnalysis,
      internalLinks: linkAnalysis,
      images: imageAnalysis,
      urlStructure: urlAnalysis
    };
  }

  private async analyzeTechnical(request: SEOAnalysisRequest): Promise<TechnicalSEOAnalysis> {
    // In production, these would make actual API calls to testing services
    const pageSpeed: PageSpeedAnalysis = {
      score: 85,
      loadTime: 2.3,
      coreWebVitals: {
        lcp: 2.1,
        fid: 95,
        cls: 0.08,
        fcp: 1.2
      },
      optimizationSuggestions: [
        'Optimize images for web',
        'Minify CSS and JavaScript',
        'Enable browser caching',
        'Use a Content Delivery Network (CDN)'
      ]
    };

    const crawlability: CrawlabilityAnalysis = {
      score: 90,
      robotsTxt: true,
      xmlSitemap: true,
      internalLinkStructure: 85,
      issues: []
    };

    const structuredData: StructuredDataAnalysis = {
      score: 70,
      hasStructuredData: false,
      schemaTypes: [],
      validationErrors: [],
      suggestions: [
        'Add Article schema markup',
        'Include Organization schema',
        'Add BreadcrumbList schema'
      ]
    };

    const security: SecurityAnalysis = {
      score: 95,
      hasSSL: true,
      mixedContent: false,
      securityHeaders: true,
      issues: []
    };

    const indexability: IndexabilityAnalysis = {
      score: 88,
      isIndexable: true,
      metaRobots: 'index, follow',
      canonicalTag: true,
      duplicateContent: false,
      issues: []
    };

    return {
      score: (pageSpeed.score + crawlability.score + structuredData.score + security.score + indexability.score) / 5,
      pageSpeed,
      crawlability,
      'structured Data': structuredData,
      security,
      indexability
    };
  }

  private async analyzeContent(request: SEOAnalysisRequest): Promise<ContentSEOAnalysis> {
    const wordCount = request.content.split(/\s+/).length;
    const readabilityScore = this.calculateReadabilityScore(request.content);
    const keywordDensity = this.calculateKeywordDensity(request.content, request.targetKeywords);
    const semanticKeywords = await this.extractSemanticKeywords(request.content, request.targetKeywords);
    
    return {
      score: this.calculateContentScore(wordCount, readabilityScore, keywordDensity),
      wordCount,
      readabilityScore,
      keywordDensity,
      semanticKeywords,
      contentDepth: this.assessContentDepth(request.content),
      uniqueness: 85, // Would use plagiarism detection in production
      topicCoverage: this.assessTopicCoverage(request.content, request.targetKeywords),
      contentGaps: this.identifyContentGaps(request.content, request.targetKeywords)
    };
  }

  private async analyzeUserExperience(request: SEOAnalysisRequest): Promise<UserExperienceAnalysis> {
    const readability = this.analyzeReadability(request.content);
    
    return {
      score: readability.score,
      readability,
      engagement: {
        score: 75,
        estimatedTimeOnPage: Math.ceil(request.content.split(/\s+/).length / 200), // 200 words per minute
        bounceRatePrediction: 45,
        engagementElements: this.identifyEngagementElements(request.content),
        suggestions: [
          'Add more interactive elements',
          'Include call-to-action buttons',
          'Use bullet points for better readability'
        ]
      },
      navigation: {
        score: 80,
        breadcrumbs: false,
        internalLinks: (request.content.match(/\[.*?\]\(.*?\)/g) || []).length,
        suggestions: ['Add breadcrumb navigation', 'Include more internal links']
      },
      accessibility: {
        score: 85,
        altTexts: (request.images || []).filter(img => img.alt).length,
        headingStructure: 90,
        colorContrast: 95,
        issues: []
      }
    };
  }

  private async analyzeMobile(request: SEOAnalysisRequest): Promise<MobileSEOAnalysis> {
    return {
      score: 88,
      mobileOptimization: {
        score: 90,
        responsive: true,
        touchFriendly: true,
        fastLoading: true,
        readableText: true
      },
      pageSpeenMobile: 82,
      usabilityIssues: [],
      suggestions: [
        'Optimize tap targets for mobile',
        'Improve mobile page speed',
        'Test on various mobile devices'
      ]
    };
  }

  private async analyzeKeywords(request: SEOAnalysisRequest): Promise<KeywordAnalysis> {
    const primaryKeyword = request.targetKeywords[0];
    const secondaryKeywords = request.targetKeywords.slice(1);
    
    const primaryMetrics = this.analyzeKeywordInContent(primaryKeyword, request.content);
    const secondaryMetrics = secondaryKeywords.map(kw => this.analyzeKeywordInContent(kw, request.content));
    const semanticKeywords = await this.extractSemanticKeywords(request.content, request.targetKeywords);
    
    return {
      primaryKeyword: primaryMetrics,
      secondaryKeywords: secondaryMetrics,
      semanticKeywords: semanticKeywords.map(kw => this.analyzeKeywordInContent(kw, request.content)),
      missingKeywords: await this.findMissingKeywords(request.content, request.targetKeywords),
      overOptimized: this.findOverOptimizedKeywords(request.content, request.targetKeywords),
      opportunities: this.generateKeywordOpportunities(request.content, request.targetKeywords)
    };
  }

  private async analyzeCompetitors(request: SEOAnalysisRequest): Promise<CompetitorAnalysis> {
    if (!request.competitors) return { competitors: [], gaps: [], opportunities: [], benchmarks: {
      averageContentLength: 0,
      averageSEOScore: 0,
      commonKeywords: [],
      topPerformingContent: []
    }};

    // In production, this would crawl competitor websites
    const competitors: CompetitorSEOData[] = request.competitors.map((url, index) => ({
      url,
      seoScore: 75 + Math.random() * 20,
      targetKeywords: request.targetKeywords,
      contentLength: 1200 + Math.random() * 800,
      backlinks: Math.floor(Math.random() * 1000),
      domainAuthority: 60 + Math.random() * 30,
      topicsCovered: ['SEO', 'Marketing', 'Content Strategy']
    }));

    return {
      competitors,
      gaps: ['Long-form content', 'Video integration', 'Local SEO'],
      opportunities: ['Target long-tail keywords', 'Create comprehensive guides', 'Improve technical SEO'],
      benchmarks: {
        averageContentLength: competitors.reduce((sum, c) => sum + c.contentLength, 0) / competitors.length,
        averageSEOScore: competitors.reduce((sum, c) => sum + c.seoScore, 0) / competitors.length,
        commonKeywords: request.targetKeywords,
        topPerformingContent: ['How-to guides', 'Case studies', 'Industry reports']
      }
    };
  }

  // Helper methods for specific analysis

  private analyzeTitleTag(title: string, keywords: string[]): TitleAnalysis {
    const length = title.length;
    const hasTargetKeyword = keywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()));
    const keywordPosition = keywords.reduce((pos, kw) => {
      const index = title.toLowerCase().indexOf(kw.toLowerCase());
      return index !== -1 && (pos === -1 || index < pos) ? index : pos;
    }, -1);

    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (length < 30) {
      score -= 20;
      issues.push('Title too short');
      suggestions.push('Expand title to 50-60 characters');
    } else if (length > 60) {
      score -= 15;
      issues.push('Title too long');
      suggestions.push('Shorten title to under 60 characters');
    }

    if (!hasTargetKeyword) {
      score -= 30;
      issues.push('Missing target keyword');
      suggestions.push('Include primary keyword in title');
    }

    if (keywordPosition > 30) {
      score -= 10;
      suggestions.push('Move keyword closer to the beginning');
    }

    return {
      score: Math.max(0, score),
      length,
      hasTargetKeyword,
      keywordPosition,
      isClickWorthy: this.assessClickworthiness(title),
      issues,
      suggestions,
      alternatives: this.generateTitleAlternatives(title, keywords)
    };
  }

  private analyzeMetaDescription(description: string, keywords: string[]): MetaDescriptionAnalysis {
    const length = description.length;
    const hasTargetKeyword = keywords.some(kw => description.toLowerCase().includes(kw.toLowerCase()));
    const hasCallToAction = /\b(learn|discover|find|get|try|start|download|buy|shop|contact)\b/i.test(description);

    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (length < 120) {
      score -= 20;
      issues.push('Meta description too short');
      suggestions.push('Expand to 150-160 characters');
    } else if (length > 160) {
      score -= 15;
      issues.push('Meta description too long');
      suggestions.push('Shorten to under 160 characters');
    }

    if (!hasTargetKeyword) {
      score -= 25;
      issues.push('Missing target keyword');
      suggestions.push('Include primary keyword');
    }

    if (!hasCallToAction) {
      score -= 15;
      suggestions.push('Add a compelling call-to-action');
    }

    return {
      score: Math.max(0, score),
      length,
      hasTargetKeyword,
      hasCallToAction,
      isCompelling: hasCallToAction && hasTargetKeyword,
      issues,
      suggestions,
      alternatives: this.generateMetaDescriptionAlternatives(description, keywords)
    };
  }

  private analyzeHeaders(content: string, keywords: string[]): HeaderAnalysis {
    const headers = this.extractHeaders(content);
    const h1Count = headers.filter(h => h.level === 1).length;
    const h1HasKeyword = headers.some(h => h.level === 1 && 
      keywords.some(kw => h.text.toLowerCase().includes(kw.toLowerCase())));

    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (h1Count === 0) {
      score -= 40;
      issues.push('Missing H1 tag');
      suggestions.push('Add an H1 header with target keyword');
    } else if (h1Count > 1) {
      score -= 20;
      issues.push('Multiple H1 tags found');
      suggestions.push('Use only one H1 tag per page');
    }

    if (!h1HasKeyword) {
      score -= 25;
      issues.push('H1 missing target keyword');
      suggestions.push('Include primary keyword in H1');
    }

    return {
      score: Math.max(0, score),
      h1Count,
      h1HasKeyword,
      headerStructure: headers,
      keywordDistribution: this.calculateHeaderKeywordDistribution(headers, keywords),
      issues,
      suggestions
    };
  }

  private analyzeKeywordInContent(keyword: string, content: string): KeywordMetrics {
    const keywordLower = keyword.toLowerCase();
    const contentLower = content.toLowerCase();
    const words = content.split(/\s+/);
    const occurrences = (contentLower.match(new RegExp(keywordLower.replace(/\s+/g, '\\s+'), 'g')) || []).length;
    
    const density = (occurrences / words.length) * 100;
    const prominence = this.calculateKeywordProminence(keyword, content);
    const distribution = this.calculateKeywordDistribution(keyword, content);

    return {
      keyword,
      density,
      frequency: occurrences,
      prominence,
      distribution,
      competition: this.estimateKeywordCompetition(keyword),
      searchVolume: this.estimateSearchVolume(keyword),
      difficulty: this.estimateKeywordDifficulty(keyword),
      trend: 'stable'
    };
  }

  // Utility methods
  private calculateKeywordDensity(content: string, keywords: string[]): Record<string, number> {
    const words = content.split(/\s+/).length;
    const density: Record<string, number> = {};
    
    for (const keyword of keywords) {
      const occurrences = (content.toLowerCase().match(new RegExp(keyword.toLowerCase().replace(/\s+/g, '\\s+'), 'g')) || []).length;
      density[keyword] = (occurrences / words) * 100;
    }
    
    return density;
  }

  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    // Flesch Reading Ease Score
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]+/g, 'a')
      .length || 1;
  }

  private extractHeaders(content: string): HeaderStructureItem[] {
    const markdownHeaders = content.match(/^#{1,6}\s+.+$/gm) || [];
    const htmlHeaders = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    
    const headers: HeaderStructureItem[] = [];
    
    // Process Markdown headers
    markdownHeaders.forEach(header => {
      const level = (header.match(/^#+/) || [''])[0].length;
      const text = header.replace(/^#+\s*/, '').trim();
      headers.push({
        level,
        text,
        hasKeyword: false, // Will be calculated later
        length: text.length
      });
    });
    
    // Process HTML headers
    htmlHeaders.forEach(header => {
      const level = parseInt((header.match(/<h(\d)/) || ['', '1'])[1]);
      const text = header.replace(/<[^>]*>/g, '').trim();
      headers.push({
        level,
        text,
        hasKeyword: false,
        length: text.length
      });
    });
    
    return headers.sort((a, b) => a.level - b.level);
  }

  private calculateOverallScore(analysis: Omit<SEOAnalysis, 'localSEO'>): number {
    return Math.round(
      analysis.onPage.score * this.SCORING_WEIGHTS.onPage +
      analysis.technical.score * this.SCORING_WEIGHTS.technical +
      analysis.content.score * this.SCORING_WEIGHTS.content +
      analysis.userExperience.score * this.SCORING_WEIGHTS.userExperience +
      analysis.mobile.score * this.SCORING_WEIGHTS.mobile
    );
  }

  private generateRecommendations(analysis: Omit<SEOAnalysis, 'localSEO'>): SEORecommendation[] {
    const recommendations: SEORecommendation[] = [];

    // On-page recommendations
    if (analysis.onPage.score < 80) {
      recommendations.push({
        type: 'important',
        category: 'on-page',
        title: 'Optimize On-Page Elements',
        description: 'Improve title tags, meta descriptions, and header structure',
        impact: 'high',
        effort: 'low',
        priority: 9,
        implementation: {
          steps: [
            'Review and optimize title tags',
            'Improve meta descriptions',
            'Restructure headers with keywords'
          ],
          timeEstimate: '2-4 hours',
          difficulty: 'easy'
        },
        expectedImprovement: 15
      });
    }

    // Content recommendations
    if (analysis.content.score < 75) {
      recommendations.push({
        type: 'critical',
        category: 'content',
        title: 'Enhance Content Quality',
        description: 'Improve content length, keyword usage, and readability',
        impact: 'high',
        effort: 'medium',
        priority: 10,
        implementation: {
          steps: [
            'Expand content to minimum 800 words',
            'Improve keyword distribution',
            'Enhance readability with shorter sentences'
          ],
          timeEstimate: '4-8 hours',
          difficulty: 'medium'
        },
        expectedImprovement: 20
      });
    }

    // Technical recommendations
    if (analysis.technical.score < 85) {
      recommendations.push({
        type: 'important',
        category: 'technical',
        title: 'Fix Technical SEO Issues',
        description: 'Improve page speed, add structured data, and fix crawlability issues',
        impact: 'medium',
        effort: 'high',
        priority: 7,
        implementation: {
          steps: [
            'Optimize images and assets',
            'Add schema markup',
            'Improve site structure'
          ],
          timeEstimate: '1-2 days',
          difficulty: 'hard'
        },
        expectedImprovement: 12
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private identifyOpportunities(
    keywordAnalysis: KeywordAnalysis,
    competitorAnalysis?: CompetitorAnalysis
  ): SEOOpportunity[] {
    const opportunities: SEOOpportunity[] = [];

    // Keyword opportunities
    if (keywordAnalysis.missingKeywords.length > 0) {
      opportunities.push({
        title: 'Target Missing Keywords',
        description: `Opportunity to rank for ${keywordAnalysis.missingKeywords.length} related keywords`,
        potentialTrafficIncrease: 25,
        competitorGap: false,
        keywords: keywordAnalysis.missingKeywords,
        actionItems: [
          'Research keyword search volumes',
          'Create content targeting these keywords',
          'Optimize existing content'
        ],
        priority: 8
      });
    }

    // Competitor gap opportunities
    if (competitorAnalysis) {
      opportunities.push({
        title: 'Competitor Content Gaps',
        description: 'Create content that competitors are missing',
        potentialTrafficIncrease: 35,
        competitorGap: true,
        keywords: competitorAnalysis.gaps,
        actionItems: [
          'Analyze competitor content strategies',
          'Create unique, comprehensive content',
          'Target underserved search queries'
        ],
        priority: 9
      });
    }

    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  private detectTechnicalIssues(technicalAnalysis: TechnicalSEOAnalysis): TechnicalIssue[] {
    const issues: TechnicalIssue[] = [];

    if (technicalAnalysis.pageSpeed.score < 80) {
      issues.push({
        severity: 'warning',
        category: 'Performance',
        issue: 'Page speed below optimal threshold',
        solution: 'Optimize images, minify CSS/JS, enable compression',
        impact: 'May affect user experience and search rankings'
      });
    }

    if (!technicalAnalysis['structured Data'].hasStructuredData) {
      issues.push({
        severity: 'info',
        category: 'Structured Data',
        issue: 'Missing structured data markup',
        solution: 'Add relevant schema.org markup',
        impact: 'Missing rich snippets opportunities'
      });
    }

    return issues;
  }

  private generateContentOptimization(
    request: SEOAnalysisRequest,
    contentAnalysis: ContentSEOAnalysis,
    keywordAnalysis: KeywordAnalysis
  ): ContentOptimization {
    const suggestions: ContentSuggestion[] = [];

    // Length recommendation
    if (contentAnalysis.wordCount < 800) {
      suggestions.push({
        type: 'add',
        section: 'Content Body',
        suggested: 'Expand content with more detailed explanations, examples, and related information',
        reasoning: 'Longer content typically performs better in search results',
        impact: 'high'
      });
    }

    // Keyword optimization
    if (keywordAnalysis.primaryKeyword.density < 0.5) {
      suggestions.push({
        type: 'modify',
        section: 'Keyword Usage',
        suggested: `Increase usage of "${keywordAnalysis.primaryKeyword.keyword}" naturally throughout content`,
        reasoning: 'Low keyword density may impact relevance signals',
        impact: 'medium'
      });
    }

    return {
      suggestions,
      missingTopics: contentAnalysis.contentGaps,
      contentGaps: ['Related case studies', 'Industry statistics', 'Expert quotes'],
      lengthRecommendation: {
        current: contentAnalysis.wordCount,
        recommended: Math.max(800, contentAnalysis.wordCount + 200),
        reasoning: 'Comprehensive content performs better in search results'
      },
      structureImprovements: [
        'Add table of contents for long content',
        'Use more descriptive subheadings',
        'Include bullet points and lists for better readability'
      ]
    };
  }

  // Additional helper methods...
  private async generateSEOTitles(topic: string, keywords: string[]): Promise<string[]> {
    return [
      `${keywords[0]} Guide: ${topic}`,
      `How to ${topic} - ${keywords[0]} Tips`,
      `${topic}: Complete ${keywords[0]} Strategy`
    ];
  }

  private async generateMetaDescriptions(topic: string, keywords: string[]): Promise<string[]> {
    return [
      `Learn ${topic} with our comprehensive ${keywords[0]} guide. Get actionable tips and strategies.`,
      `Discover the best ${keywords[0]} techniques for ${topic}. Start improving your results today.`
    ];
  }

  private async generateSEOHeaders(topic: string, keywords: string[]): Promise<string[]> {
    return [
      `What is ${keywords[0]}?`,
      `${keywords[0]} Best Practices`,
      `How to Implement ${keywords[0]}`,
      `${keywords[0]} Tools and Resources`
    ];
  }

  private async generateContentOutline(topic: string, keywords: string[], contentType: string): Promise<string[]> {
    return [
      `Introduction to ${topic}`,
      `${keywords[0]} Fundamentals`,
      `Step-by-step ${keywords[0]} Process`,
      'Common Mistakes to Avoid',
      'Tools and Resources',
      `${keywords[0]} Case Studies`,
      'Conclusion and Next Steps'
    ];
  }

  private async suggestInternalLinks(topic: string, keywords: string[]): Promise<string[]> {
    return [
      'Related blog posts on SEO',
      'Category pages for digital marketing',
      'Resource pages and tools'
    ];
  }

  // More utility methods...
  private loadKeywordDatabase(): void {
    // Load keyword data for analysis
  }

  private generateCacheKey(request: SEOAnalysisRequest): string {
    return `seo_${JSON.stringify(request).substring(0, 100)}`;
  }

  private assessClickworthiness(title: string): boolean {
    const clickWorthyWords = ['guide', 'tips', 'how to', 'best', 'ultimate', 'complete', 'step by step'];
    return clickWorthyWords.some(word => title.toLowerCase().includes(word));
  }

  private generateTitleAlternatives(title: string, keywords: string[]): string[] {
    return [
      `${keywords[0]}: ${title}`,
      `How to ${title}`,
      `${title} Guide`
    ];
  }

  private generateMetaDescriptionAlternatives(description: string, keywords: string[]): string[] {
    return [
      `${description} Learn more about ${keywords[0]}.`,
      `Discover ${keywords[0]} strategies. ${description}`
    ];
  }

  private analyzeLinks(content: string): LinkAnalysis {
    const internalLinks = (content.match(/\[.*?\]\((?!http).*?\)/g) || []).length;
    const externalLinks = (content.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length;
    
    return {
      score: Math.min(100, (internalLinks * 10) + (externalLinks * 5)),
      internalLinkCount: internalLinks,
      externalLinkCount: externalLinks,
      anchorTextOptimization: 70,
      brokenLinks: [],
      suggestions: internalLinks < 3 ? ['Add more internal links'] : []
    };
  }

  private analyzeImages(images: SEOImage[]): ImageSEOAnalysis {
    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim()).length;
    
    return {
      score: images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100,
      totalImages: images.length,
      imagesWithAlt,
      altTextOptimization: images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100,
      imageFileNames: images.map(img => img.src),
      issues: images.length - imagesWithAlt > 0 ? ['Some images missing alt text'] : [],
      suggestions: images.length - imagesWithAlt > 0 ? ['Add descriptive alt text to all images'] : []
    };
  }

  private analyzeURL(url: string): URLAnalysis {
    const length = url.length;
    const hasKeywords = true; // Simplified
    const isClean = !url.includes('?') && !url.includes('#');
    
    return {
      score: 85,
      length,
      hasKeywords,
      isClean,
      issues: length > 100 ? ['URL too long'] : [],
      suggestions: length > 100 ? ['Shorten URL'] : []
    };
  }

  private analyzeReadability(content: string): ReadabilityAnalysis {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const averageSentenceLength = words / sentences;
    const fleschScore = this.calculateReadabilityScore(content);
    
    return {
      score: fleschScore,
      fleschScore,
      averageSentenceLength,
      averageWordsPerSentence: averageSentenceLength,
      complexWords: Math.floor(words * 0.1), // Simplified
      suggestions: fleschScore < 60 ? ['Use shorter sentences', 'Simplify vocabulary'] : []
    };
  }

  // Additional implementation methods...
  private calculateContentScore(wordCount: number, readabilityScore: number, keywordDensity: Record<string, number>): number {
    let score = 0;
    
    // Word count scoring
    if (wordCount >= 800) score += 30;
    else if (wordCount >= 500) score += 20;
    else score += 10;
    
    // Readability scoring
    score += Math.min(30, readabilityScore * 0.3);
    
    // Keyword density scoring
    const densityValues = Object.values(keywordDensity);
    const avgDensity = densityValues.reduce((sum, d) => sum + d, 0) / densityValues.length;
    if (avgDensity >= 0.5 && avgDensity <= 2.5) score += 30;
    else score += 15;
    
    // Content structure scoring
    score += 10; // Base score for having content
    
    return Math.min(100, score);
  }

  private assessContentDepth(content: string): number {
    const sections = content.split(/#{1,6}/).length - 1;
    const examples = (content.match(/for example|such as|like|including/gi) || []).length;
    const questions = (content.match(/\?/g) || []).length;
    
    return Math.min(10, sections + examples + questions);
  }

  private assessTopicCoverage(content: string, keywords: string[]): number {
    let coverage = 0;
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        coverage += 1;
      }
    }
    return (coverage / keywords.length) * 100;
  }

  private identifyContentGaps(content: string, keywords: string[]): string[] {
    const gaps: string[] = [];
    
    // Check for common content elements
    if (!content.includes('example')) gaps.push('Add practical examples');
    if (!content.includes('tip')) gaps.push('Include actionable tips');
    if (content.split(/\s+/).length < 1000) gaps.push('Expand content length');
    
    return gaps;
  }

  private identifyEngagementElements(content: string): string[] {
    const elements: string[] = [];
    
    if (content.includes('?')) elements.push('Questions to engage readers');
    if (content.includes('!')) elements.push('Exclamations for emphasis');
    if (content.match(/\*.*?\*/)) elements.push('Bold/italic text for emphasis');
    if (content.includes('```')) elements.push('Code examples');
    
    return elements;
  }

  private calculateKeywordProminence(keyword: string, content: string): number {
    const firstOccurrence = content.toLowerCase().indexOf(keyword.toLowerCase());
    if (firstOccurrence === -1) return 0;
    
    const contentLength = content.length;
    return 100 - (firstOccurrence / contentLength) * 100;
  }

  private calculateKeywordDistribution(keyword: string, content: string): number {
    const sections = content.split(/\n\n/);
    const sectionsWithKeyword = sections.filter(section => 
      section.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    return sections.length > 0 ? (sectionsWithKeyword / sections.length) * 100 : 0;
  }

  private calculateHeaderKeywordDistribution(headers: HeaderStructureItem[], keywords: string[]): number {
    const headersWithKeywords = headers.filter(header =>
      keywords.some(kw => header.text.toLowerCase().includes(kw.toLowerCase()))
    ).length;
    
    return headers.length > 0 ? (headersWithKeywords / headers.length) * 100 : 0;
  }

  private estimateKeywordCompetition(keyword: string): 'low' | 'medium' | 'high' {
    // Simplified estimation - in production, use keyword research tools
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const hasCommonWords = commonWords.some(word => keyword.toLowerCase().includes(word));
    
    if (keyword.split(' ').length > 3) return 'low';
    if (hasCommonWords) return 'high';
    return 'medium';
  }

  private estimateSearchVolume(keyword: string): number {
    // Simplified estimation - in production, use keyword research APIs
    const words = keyword.split(' ').length;
    if (words === 1) return Math.floor(Math.random() * 10000) + 1000;
    if (words === 2) return Math.floor(Math.random() * 5000) + 500;
    return Math.floor(Math.random() * 1000) + 100;
  }

  private estimateKeywordDifficulty(keyword: string): number {
    // Simplified estimation (1-100 scale)
    const words = keyword.split(' ').length;
    if (words > 3) return Math.floor(Math.random() * 30) + 10; // Long-tail: easier
    if (words === 1) return Math.floor(Math.random() * 40) + 60; // Single word: harder
    return Math.floor(Math.random() * 50) + 25; // 2-3 words: medium
  }

  private async extractSemanticKeywords(content: string, targetKeywords: string[]): Promise<string[]> {
    // Simplified semantic keyword extraction
    const semanticMap: Record<string, string[]> = {
      'seo': ['search engine optimization', 'ranking', 'serp', 'organic traffic', 'keywords'],
      'marketing': ['promotion', 'advertising', 'branding', 'campaign', 'audience'],
      'content': ['blog', 'article', 'writing', 'publishing', 'editorial']
    };
    
    const semanticKeywords: string[] = [];
    for (const keyword of targetKeywords) {
      const related = semanticMap[keyword.toLowerCase()] || [];
      semanticKeywords.push(...related.filter(kw => content.toLowerCase().includes(kw)));
    }
    
    return [...new Set(semanticKeywords)];
  }

  private async findMissingKeywords(content: string, targetKeywords: string[]): Promise<string[]> {
    // Find related keywords that could be added
    const relatedKeywords = ['optimization', 'strategy', 'best practices', 'guide', 'tips'];
    return relatedKeywords.filter(kw => !content.toLowerCase().includes(kw));
  }

  private findOverOptimizedKeywords(content: string, targetKeywords: string[]): string[] {
    const overOptimized: string[] = [];
    const density = this.calculateKeywordDensity(content, targetKeywords);
    
    for (const [keyword, dens] of Object.entries(density)) {
      if (dens > 3) {
        overOptimized.push(keyword);
      }
    }
    
    return overOptimized;
  }

  private generateKeywordOpportunities(content: string, targetKeywords: string[]): KeywordOpportunity[] {
    const opportunities: KeywordOpportunity[] = [];
    const density = this.calculateKeywordDensity(content, targetKeywords);
    
    for (const [keyword, dens] of Object.entries(density)) {
      if (dens < 0.5) {
        opportunities.push({
          keyword,
          opportunity: 'underused',
          potentialImprovement: 15,
          suggestion: `Increase usage of "${keyword}" in content`
        });
      } else if (dens > 3) {
        opportunities.push({
          keyword,
          opportunity: 'overused',
          potentialImprovement: 10,
          suggestion: `Reduce frequency of "${keyword}" to avoid keyword stuffing`
        });
      }
    }
    
    return opportunities;
  }

  private generateKeywordSuggestions(performance: Record<string, KeywordMetrics>, content: string): KeywordOpportunity[] {
    const suggestions: KeywordOpportunity[] = [];
    
    for (const [keyword, metrics] of Object.entries(performance)) {
      if (metrics.density < 0.5) {
        suggestions.push({
          keyword,
          opportunity: 'underused',
          potentialImprovement: 20,
          suggestion: `Add "${keyword}" naturally in 2-3 more places`
        });
      }
    }
    
    return suggestions;
  }

  private async findRelatedKeywords(keywords: string[]): Promise<string[]> {
    // In production, use keyword research APIs
    const related: string[] = [];
    
    for (const keyword of keywords) {
      related.push(`${keyword} guide`, `${keyword} tips`, `best ${keyword}`);
    }
    
    return related;
  }
}

// Add missing interfaces
interface CrawlabilityAnalysis {
  score: number;
  robotsTxt: boolean;
  xmlSitemap: boolean;
  internalLinkStructure: number;
  issues: string[];
}

interface StructuredDataAnalysis {
  score: number;
  hasStructuredData: boolean;
  schemaTypes: string[];
  validationErrors: string[];
  suggestions: string[];
}

interface SecurityAnalysis {
  score: number;
  hasSSL: boolean;
  mixedContent: boolean;
  securityHeaders: boolean;
  issues: string[];
}

interface IndexabilityAnalysis {
  score: number;
  isIndexable: boolean;
  metaRobots: string;
  canonicalTag: boolean;
  duplicateContent: boolean;
  issues: string[];
}

interface NavigationAnalysis {
  score: number;
  breadcrumbs: boolean;
  internalLinks: number;
  suggestions: string[];
}

interface AccessibilityAnalysis {
  score: number;
  altTexts: number;
  headingStructure: number;
  colorContrast: number;
  issues: string[];
}

interface MobileOptimizationAnalysis {
  score: number;
  responsive: boolean;
  touchFriendly: boolean;
  fastLoading: boolean;
  readableText: boolean;
}

// Export singleton instance
export const seoAnalysisService = new SEOAnalysisService(); 