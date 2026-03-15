/**
 * ChatGPT Integration Service
 * Advanced AI writing assistance and content generation using OpenAI API
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { appConfig } from '@/config/appConfig';

export interface WritingAssistanceRequest {
  type: WritingAssistanceType;
  context: WritingContext;
  userInput: string;
  options?: WritingOptions;
}

export interface WritingContext {
  contentType: 'blog' | 'video-description' | 'social-post' | 'email' | 'seo-content' | 'technical-doc';
  audience: 'general' | 'technical' | 'business' | 'academic' | 'casual';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational' | 'humorous';
  purpose: 'inform' | 'persuade' | 'entertain' | 'educate' | 'sell' | 'explain';
  targetLength?: number;
  keywords?: string[];
  existingContent?: string;
}

export interface WritingOptions {
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo';
  temperature?: number; // 0-1, creativity level
  maxTokens?: number;
  includeOutline?: boolean;
  includeSEO?: boolean;
  includeMetadata?: boolean;
  language?: string;
  style?: 'formal' | 'informal' | 'academic' | 'journalistic' | 'creative';
}

export type WritingAssistanceType = 
  | 'generate_content'
  | 'improve_writing'
  | 'generate_ideas'
  | 'create_outline'
  | 'write_summary'
  | 'expand_content'
  | 'rewrite_content'
  | 'generate_title'
  | 'generate_meta_description'
  | 'generate_tags'
  | 'proofread'
  | 'translate'
  | 'change_tone'
  | 'create_social_posts'
  | 'generate_email_subject'
  | 'create_call_to_action';

export interface WritingAssistanceResponse {
  originalRequest: WritingAssistanceRequest;
  generatedContent: string;
  suggestions: WritingSuggestion[];
  metadata: ContentMetadata;
  usage: TokenUsage;
  quality: QualityMetrics;
  alternatives?: string[];
}

export interface WritingSuggestion {
  type: 'improvement' | 'alternative' | 'expansion' | 'correction' | 'seo';
  description: string;
  originalText?: string;
  suggestedText: string;
  confidence: number;
  reasoning: string;
}

export interface ContentMetadata {
  wordCount: number;
  readingTime: number; // minutes
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: number; // 1-10
  keywords: string[];
  topics: string[];
  seoScore?: number;
  readabilityScore?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface QualityMetrics {
  clarity: number; // 1-10
  engagement: number; // 1-10
  originality: number; // 1-10
  accuracy: number; // 1-10
  seoOptimization: number; // 1-10
  overall: number; // 1-10
}

export interface ContentIdeaRequest {
  topic?: string;
  keywords?: string[];
  contentType: 'blog' | 'video' | 'social' | 'email-campaign';
  audience: string;
  industry?: string;
  trendingTopics?: string[];
  competitorAnalysis?: string[];
}

export interface ContentIdea {
  title: string;
  description: string;
  outline: string[];
  keywords: string[];
  estimatedLength: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  trendingScore: number;
  seoValue: number;
  engagementPotential: number;
}

export interface WritingTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  examples: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'select' | 'multi-select';
  description: string;
  required: boolean;
  options?: string[];
  default?: string;
}

class ChatGPTIntegrationService {
  private readonly API_KEY = appConfig.ai.openaiApiKey;
  private readonly API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  private readonly ORGANIZATION_ID = appConfig.ai.openaiOrgId;
  
  private requestCache = new Map<string, WritingAssistanceResponse>();
  private rateLimitTracker = new Map<string, number[]>();
  private usageTracker = { totalTokens: 0, totalCost: 0 };

  // Template library
  private templates: WritingTemplate[] = [
    {
      id: 'blog_post',
      name: 'Blog Post',
      category: 'Content Creation',
      description: 'Complete blog post with introduction, body, and conclusion',
      template: `Write a comprehensive blog post about {{topic}} for {{audience}}. 
        
        Structure:
        1. Compelling introduction with hook
        2. {{sections}} main sections with detailed explanations
        3. Practical examples and actionable insights
        4. Strong conclusion with call-to-action
        
        Requirements:
        - Tone: {{tone}}
        - Length: {{length}} words
        - Include SEO keywords: {{keywords}}
        - Target audience: {{audience}}`,
      variables: [
        { name: 'topic', type: 'text', description: 'Main topic', required: true },
        { name: 'audience', type: 'select', description: 'Target audience', required: true, 
          options: ['beginners', 'professionals', 'general public', 'technical experts'] },
        { name: 'tone', type: 'select', description: 'Writing tone', required: true,
          options: ['professional', 'casual', 'friendly', 'authoritative'] },
        { name: 'sections', type: 'number', description: 'Number of main sections', required: true, default: '3' },
        { name: 'length', type: 'number', description: 'Target word count', required: true, default: '1000' },
        { name: 'keywords', type: 'text', description: 'SEO keywords (comma-separated)', required: false }
      ],
      examples: []
    },
    {
      id: 'video_description',
      name: 'Video Description',
      category: 'Video Content',
      description: 'Engaging video description with SEO optimization',
      template: `Create an engaging video description for "{{title}}" that:
        
        1. Starts with a compelling hook that summarizes the value
        2. Provides a detailed overview of what viewers will learn
        3. Includes relevant timestamps for key sections
        4. Contains a strong call-to-action
        5. Incorporates SEO keywords naturally: {{keywords}}
        
        Style: {{tone}}
        Target audience: {{audience}}
        Video length: {{duration}} minutes`,
      variables: [
        { name: 'title', type: 'text', description: 'Video title', required: true },
        { name: 'audience', type: 'text', description: 'Target audience', required: true },
        { name: 'tone', type: 'select', description: 'Tone', required: true,
          options: ['professional', 'casual', 'enthusiastic', 'educational'] },
        { name: 'duration', type: 'number', description: 'Video duration in minutes', required: true },
        { name: 'keywords', type: 'text', description: 'SEO keywords', required: false }
      ],
      examples: []
    }
  ];

  constructor() {
    this.validateConfiguration();
    this.initializeRateLimiting();
  }

  /**
   * Generate content using AI writing assistance
   */
  public async generateContent(request: WritingAssistanceRequest): Promise<WritingAssistanceResponse> {
    try {
      // Check rate limits
      this.checkRateLimit();

      // Check cache
      const cacheKey = this.generateCacheKey(request);
      if (this.requestCache.has(cacheKey)) {
        return this.requestCache.get(cacheKey)!;
      }

      // Prepare prompt based on request type
      const prompt = this.buildPrompt(request);

      // Make API request
      const response = await this.callOpenAIAPI(prompt, request.options);

      // Process response
      const processedResponse = await this.processResponse(response, request);

      // Cache result
      this.requestCache.set(cacheKey, processedResponse);

      // Track usage
      this.trackUsage(processedResponse.usage);

      return processedResponse;

    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  /**
   * Get content ideas and suggestions
   */
  public async generateContentIdeas(request: ContentIdeaRequest): Promise<ContentIdea[]> {
    try {
      const prompt = this.buildIdeaPrompt(request);
      
      const apiResponse = await this.callOpenAIAPI(prompt, {
        model: 'gpt-4-turbo',
        temperature: 0.8,
        maxTokens: 2000
      });

      return this.parseContentIdeas(apiResponse.choices[0].message.content);

    } catch (error) {
      console.error('Error generating content ideas:', error);
      throw new Error('Failed to generate content ideas.');
    }
  }

  /**
   * Improve existing content
   */
  public async improveContent(
    content: string,
    improvementType: 'clarity' | 'engagement' | 'seo' | 'tone' | 'structure',
    context: WritingContext
  ): Promise<WritingAssistanceResponse> {
    const request: WritingAssistanceRequest = {
      type: 'improve_writing',
      context,
      userInput: content,
      options: {
        temperature: 0.3,
        includeMetadata: true
      }
    };

    const prompt = this.buildImprovementPrompt(content, improvementType, context);
    
    try {
      const response = await this.callOpenAIAPI(prompt, request.options);
      return this.processResponse(response, request);
    } catch (error) {
      console.error('Error improving content:', error);
      throw error;
    }
  }

  /**
   * Generate multiple variations of content
   */
  public async generateVariations(
    content: string,
    variationType: 'tone' | 'length' | 'audience' | 'format',
    count: number = 3
  ): Promise<string[]> {
    try {
      const prompt = `Generate ${count} different variations of the following content, 
        varying the ${variationType}:
        
        Original: ${content}
        
        Requirements:
        - Maintain the core message and key information
        - Make each variation distinct in ${variationType}
        - Keep variations appropriate and professional
        - Return only the variations, numbered 1-${count}`;

      const response = await this.callOpenAIAPI(prompt, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1500
      });

      return this.parseVariations(response.choices[0].message.content, count);

    } catch (error) {
      console.error('Error generating variations:', error);
      throw error;
    }
  }

  /**
   * Real-time writing assistance
   */
  public async getRealTimeAssistance(
    partialContent: string,
    cursorPosition: number,
    context: WritingContext
  ): Promise<{
    suggestions: string[];
    autoComplete: string;
    improvements: WritingSuggestion[];
  }> {
    try {
      const contentBefore = partialContent.substring(0, cursorPosition);
      const contentAfter = partialContent.substring(cursorPosition);

      const prompt = `Provide real-time writing assistance for this partially written content:

        Content before cursor: "${contentBefore}"
        Content after cursor: "${contentAfter}"
        
        Context: ${JSON.stringify(context)}
        
        Provide:
        1. 3 auto-completion suggestions for the current position
        2. 1 sentence continuation from current position
        3. Any grammar or style improvements for the existing text
        
        Format as JSON with keys: suggestions, autoComplete, improvements`;

      const response = await this.callOpenAIAPI(prompt, {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 500
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Error getting real-time assistance:', error);
      return {
        suggestions: [],
        autoComplete: '',
        improvements: []
      };
    }
  }

  /**
   * Generate SEO-optimized content
   */
  public async generateSEOContent(
    topic: string,
    keywords: string[],
    contentType: 'title' | 'meta_description' | 'content' | 'headers'
  ): Promise<{
    content: string;
    seoScore: number;
    keywordDensity: Record<string, number>;
    suggestions: string[];
  }> {
    try {
      const prompt = this.buildSEOPrompt(topic, keywords, contentType);
      
      const response = await this.callOpenAIAPI(prompt, {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1000
      });

      const content = response.choices[0].message.content;
      
      return {
        content,
        seoScore: this.calculateSEOScore(content, keywords),
        keywordDensity: this.calculateKeywordDensity(content, keywords),
        suggestions: this.generateSEOSuggestions(content, keywords)
      };

    } catch (error) {
      console.error('Error generating SEO content:', error);
      throw error;
    }
  }

  /**
   * Translate content while maintaining tone and style
   */
  public async translateContent(
    content: string,
    targetLanguage: string,
    preserveTone: boolean = true
  ): Promise<{
    translation: string;
    confidence: number;
    alternatives: string[];
  }> {
    try {
      const prompt = `Translate the following content to ${targetLanguage}:
        
        Content: ${content}
        
        Requirements:
        ${preserveTone ? '- Preserve the original tone and style' : '- Adapt tone for target culture'}
        - Maintain professional quality
        - Keep the same structure and formatting
        - Provide natural, fluent translation
        - Include cultural adaptations where appropriate
        
        Also provide 2 alternative translations with different approaches.
        
        Format as JSON: { translation: string, alternatives: string[] }`;

      const response = await this.callOpenAIAPI(prompt, {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        ...result,
        confidence: this.calculateTranslationConfidence(content, result.translation)
      };

    } catch (error) {
      console.error('Error translating content:', error);
      throw error;
    }
  }

  /**
   * Apply writing template with variables
   */
  public async applyTemplate(
    templateId: string,
    variables: Record<string, string>
  ): Promise<WritingAssistanceResponse> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Replace template variables
    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const request: WritingAssistanceRequest = {
      type: 'generate_content',
      context: {
        contentType: templateId.includes('blog') ? 'blog' : 'technical-doc',
        audience: variables.audience || 'general',
        tone: variables.tone as any || 'professional',
        purpose: 'inform'
      },
      userInput: prompt,
      options: {
        model: 'gpt-4',
        temperature: 0.6,
        includeMetadata: true,
        includeSEO: true
      }
    };

    return this.generateContent(request);
  }

  /**
   * Get available templates
   */
  public getTemplates(category?: string): WritingTemplate[] {
    return category 
      ? this.templates.filter(t => t.category === category)
      : this.templates;
  }

  /**
   * Analyze content quality and provide insights
   */
  public async analyzeContent(content: string): Promise<{
    quality: QualityMetrics;
    insights: string[];
    recommendations: WritingSuggestion[];
    metadata: ContentMetadata;
  }> {
    try {
      const prompt = `Analyze the following content and provide comprehensive insights:

        Content: ${content}
        
        Provide analysis in JSON format:
        {
          "quality": {
            "clarity": number (1-10),
            "engagement": number (1-10),
            "originality": number (1-10),
            "accuracy": number (1-10),
            "seoOptimization": number (1-10),
            "overall": number (1-10)
          },
          "insights": [
            "Key insight 1",
            "Key insight 2",
            "Key insight 3"
          ],
          "recommendations": [
            {
              "type": "improvement",
              "description": "Specific recommendation",
              "suggestedText": "Suggested improvement",
              "confidence": number (0-1),
              "reasoning": "Why this improvement helps"
            }
          ]
        }`;

      const response = await this.callOpenAIAPI(prompt, {
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 1500
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        ...analysis,
        metadata: this.extractContentMetadata(content)
      };

    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  }

  // Private helper methods

  private async callOpenAIAPI(prompt: string, options?: WritingOptions): Promise<any> {
    // Feature guard: skip if OpenAI integration is disabled
    if (!appConfig.features.enableOpenAI || !this.API_KEY) {
      throw new Error('OpenAI integration is not enabled. Provide an API key and enable the feature flag.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    };

    if (this.ORGANIZATION_ID) {
      (headers as any)['OpenAI-Organization'] = this.ORGANIZATION_ID;
    }

    const body = {
      model: options?.model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert writing assistant and content creator. Provide high-quality, engaging, and professional content that meets the user\'s specific requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private buildPrompt(request: WritingAssistanceRequest): string {
    const { type, context, userInput, options } = request;

    let basePrompt = '';

    switch (type) {
      case 'generate_content':
        basePrompt = `Create ${context.contentType} content about: ${userInput}
          
          Requirements:
          - Audience: ${context.audience}
          - Tone: ${context.tone}
          - Purpose: ${context.purpose}
          ${context.targetLength ? `- Target length: ${context.targetLength} words` : ''}
          ${context.keywords ? `- Include keywords: ${context.keywords.join(', ')}` : ''}
          ${options?.style ? `- Style: ${options.style}` : ''}
          
          Make it engaging, well-structured, and professional.`;
        break;

      case 'improve_writing':
        basePrompt = `Improve the following content while maintaining its core message:
          
          Original content: ${userInput}
          
          Improvements needed for ${context.contentType}:
          - Enhance clarity and readability
          - Improve engagement and flow
          - Optimize for ${context.audience} audience
          - Maintain ${context.tone} tone
          ${context.keywords ? `- Better integrate keywords: ${context.keywords.join(', ')}` : ''}`;
        break;

      case 'generate_ideas':
        basePrompt = `Generate creative content ideas related to: ${userInput}
          
          Context:
          - Content type: ${context.contentType}
          - Target audience: ${context.audience}
          - Purpose: ${context.purpose}
          
          Provide 5-7 unique ideas with brief descriptions.`;
        break;

      case 'create_outline':
        basePrompt = `Create a detailed outline for: ${userInput}
          
          Structure for ${context.contentType}:
          - Target audience: ${context.audience}
          - Tone: ${context.tone}
          - Purpose: ${context.purpose}
          ${context.targetLength ? `- Target length: ${context.targetLength} words` : ''}
          
          Include main sections, subsections, and key points.`;
        break;

      default:
        basePrompt = `Help with ${type.replace('_', ' ')} for: ${userInput}
          
          Context: ${JSON.stringify(context)}`;
    }

    return basePrompt;
  }

  private buildIdeaPrompt(request: ContentIdeaRequest): string {
    return `Generate creative and engaging content ideas:
      
      ${request.topic ? `Topic: ${request.topic}` : ''}
      ${request.keywords ? `Keywords to incorporate: ${request.keywords.join(', ')}` : ''}
      
      Content Details:
      - Type: ${request.contentType}
      - Audience: ${request.audience}
      ${request.industry ? `- Industry: ${request.industry}` : ''}
      ${request.trendingTopics ? `- Trending topics to consider: ${request.trendingTopics.join(', ')}` : ''}
      
      For each idea, provide:
      1. Compelling title
      2. Brief description (2-3 sentences)
      3. Main outline points
      4. Target keywords
      5. Estimated length
      6. Difficulty level
      7. SEO and engagement potential (1-10)
      
      Generate 5-7 diverse ideas in JSON format.`;
  }

  private buildImprovementPrompt(
    content: string,
    improvementType: string,
    context: WritingContext
  ): string {
    const improvements = {
      clarity: 'Make the content clearer, easier to understand, and better structured',
      engagement: 'Increase reader engagement with better hooks, examples, and compelling language',
      seo: 'Optimize for search engines while maintaining readability and natural flow',
      tone: `Adjust the tone to be more ${context.tone} while preserving the message`,
      structure: 'Improve the overall structure, flow, and organization of the content'
    };

    return `Improve the following content focusing on ${improvementType}:
      
      Original content: ${content}
      
      Improvement focus: ${improvements[improvementType as keyof typeof improvements]}
      
      Context:
      - Content type: ${context.contentType}
      - Audience: ${context.audience}
      - Desired tone: ${context.tone}
      - Purpose: ${context.purpose}
      ${context.keywords ? `- Important keywords: ${context.keywords.join(', ')}` : ''}
      
      Provide the improved version and explain the key changes made.`;
  }

  private buildSEOPrompt(topic: string, keywords: string[], contentType: string): string {
    switch (contentType) {
      case 'title':
        return `Generate 5 SEO-optimized titles for content about: ${topic}
          
          Keywords to include: ${keywords.join(', ')}
          
          Requirements:
          - 50-60 characters for optimal SEO
          - Include primary keyword naturally
          - Compelling and click-worthy
          - Professional and credible`;

      case 'meta_description':
        return `Write an SEO-optimized meta description for: ${topic}
          
          Keywords: ${keywords.join(', ')}
          
          Requirements:
          - 150-160 characters
          - Include primary keyword
          - Compelling call-to-action
          - Accurately describes content`;

      case 'headers':
        return `Generate SEO-optimized H2 and H3 headers for content about: ${topic}
          
          Keywords to distribute: ${keywords.join(', ')}
          
          Create a hierarchical structure with 6-8 headers that:
          - Include keywords naturally
          - Are descriptive and useful
          - Follow logical content flow`;

      default:
        return `Create SEO-optimized content about: ${topic}
          
          Target keywords: ${keywords.join(', ')}
          
          Requirements:
          - Natural keyword integration
          - High-quality, valuable content
          - Proper keyword density (1-2%)
          - Engaging and informative`;
    }
  }

  private async processResponse(
    apiResponse: any,
    request: WritingAssistanceRequest
  ): Promise<WritingAssistanceResponse> {
    const content = apiResponse.choices[0].message.content;
    
    return {
      originalRequest: request,
      generatedContent: content,
      suggestions: await this.generateSuggestions(content, request.context),
      metadata: this.extractContentMetadata(content),
      usage: {
        promptTokens: apiResponse.usage.prompt_tokens,
        completionTokens: apiResponse.usage.completion_tokens,
        totalTokens: apiResponse.usage.total_tokens,
        estimatedCost: this.calculateCost(apiResponse.usage.total_tokens, request.options?.model || 'gpt-4')
      },
      quality: await this.assessQuality(content, request.context)
    };
  }

  private extractContentMetadata(content: string): ContentMetadata {
    const words = content.split(/\s+/).length;
    const readingSpeed = 200; // words per minute
    
    return {
      wordCount: words,
      readingTime: Math.ceil(words / readingSpeed),
      sentiment: this.analyzeSentiment(content),
      complexity: this.calculateComplexity(content),
      keywords: this.extractKeywords(content),
      topics: this.extractTopics(content),
      readabilityScore: this.calculateReadabilityScore(content)
    };
  }

  private async generateSuggestions(content: string, context: WritingContext): Promise<WritingSuggestion[]> {
    // Analyze content and generate improvement suggestions
    const suggestions: WritingSuggestion[] = [];
    
    // SEO suggestions
    if (context.keywords) {
      const keywordDensity = this.calculateKeywordDensity(content, context.keywords);
      for (const [keyword, density] of Object.entries(keywordDensity)) {
        if (density < 0.5) {
          suggestions.push({
            type: 'seo',
            description: `Consider including "${keyword}" more frequently`,
            suggestedText: `Integrate "${keyword}" naturally in 1-2 more places`,
            confidence: 0.7,
            reasoning: 'Low keyword density may impact SEO performance'
          });
        }
      }
    }

    return suggestions;
  }

  private async assessQuality(content: string, context: WritingContext): Promise<QualityMetrics> {
    // Simplified quality assessment - in production, use more sophisticated analysis
    const metrics = {
      clarity: this.assessClarity(content),
      engagement: this.assessEngagement(content),
      originality: 0.8, // Would use plagiarism detection in production
      accuracy: 0.9, // Would use fact-checking APIs in production
      seoOptimization: context.keywords ? this.calculateSEOScore(content, context.keywords) / 10 : 0.7,
      overall: 0
    };

    metrics.overall = (metrics.clarity + metrics.engagement + metrics.originality + 
                     metrics.accuracy + metrics.seoOptimization) / 5;

    return metrics;
  }

  // Utility methods for content analysis
  private calculateSEOScore(content: string, keywords: string[]): number {
    let score = 0;
    const contentLower = content.toLowerCase();
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
      const density = occurrences / content.split(/\s+/).length;
      
      if (density >= 0.01 && density <= 0.03) {
        score += 2; // Optimal density
      } else if (density > 0 && density < 0.01) {
        score += 1; // Too low
      }
    }
    
    return Math.min(10, score);
  }

  private calculateKeywordDensity(content: string, keywords: string[]): Record<string, number> {
    const words = content.split(/\s+/).length;
    const density: Record<string, number> = {};
    
    for (const keyword of keywords) {
      const occurrences = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      density[keyword] = (occurrences / words) * 100;
    }
    
    return density;
  }

  private generateSEOSuggestions(content: string, keywords: string[]): string[] {
    const suggestions: string[] = [];
    const density = this.calculateKeywordDensity(content, keywords);
    
    for (const [keyword, dens] of Object.entries(density)) {
      if (dens < 1) {
        suggestions.push(`Increase "${keyword}" usage for better SEO optimization`);
      } else if (dens > 3) {
        suggestions.push(`Reduce "${keyword}" frequency to avoid keyword stuffing`);
      }
    }
    
    return suggestions;
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis - in production, use ML models
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateComplexity(content: string): number {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Simple complexity based on sentence length
    if (avgWordsPerSentence < 10) return Math.min(10, 3);
    if (avgWordsPerSentence < 15) return Math.min(10, 5);
    if (avgWordsPerSentence < 20) return Math.min(10, 7);
    return Math.min(10, 9);
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractTopics(content: string): string[] {
    // Simplified topic extraction
    const commonTopics = [
      'technology', 'business', 'marketing', 'design', 'development', 
      'science', 'health', 'education', 'finance', 'travel'
    ];
    
    return commonTopics.filter(topic => 
      content.toLowerCase().includes(topic)
    );
  }

  private calculateReadabilityScore(content: string): number {
    // Flesch Reading Ease approximation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]+/g, 'a')
      .length || 1;
  }

  private assessClarity(content: string): number {
    const readabilityScore = this.calculateReadabilityScore(content);
    return Math.min(10, (readabilityScore / 10));
  }

  private assessEngagement(content: string): number {
    let score = 5; // Base score
    
    // Check for engagement elements
    if (content.includes('?')) score += 1; // Questions engage readers
    if (content.includes('!')) score += 0.5; // Exclamations show energy
    if (content.match(/\b(you|your)\b/gi)) score += 1; // Direct address
    if (content.match(/\b(imagine|consider|think)\b/gi)) score += 0.5; // Thought-provoking
    
    return Math.min(10, score);
  }

  private calculateTranslationConfidence(original: string, translation: string): number {
    // Simple confidence based on length ratio
    const lengthRatio = translation.length / original.length;
    if (lengthRatio >= 0.8 && lengthRatio <= 1.2) return 0.9;
    if (lengthRatio >= 0.6 && lengthRatio <= 1.4) return 0.7;
    return 0.5;
  }

  private parseContentIdeas(response: string): ContentIdea[] {
    try {
      // Parse JSON response or extract structured data
      const ideas = JSON.parse(response);
      return Array.isArray(ideas) ? ideas : [ideas];
    } catch {
      // Fallback parsing for non-JSON responses
      return [{
        title: 'Generated Content Idea',
        description: response.substring(0, 200),
        outline: ['Introduction', 'Main Content', 'Conclusion'],
        keywords: [],
        estimatedLength: 1000,
        difficulty: 'intermediate',
        trendingScore: 0.5,
        seoValue: 0.5,
        engagementPotential: 0.5
      }];
    }
  }

  private parseVariations(response: string, count: number): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    const variations: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      const variation = lines.find(line => line.startsWith(`${i}.`));
      if (variation) {
        variations.push(variation.substring(2).trim());
      }
    }
    
    return variations.length > 0 ? variations : [response];
  }

  private calculateCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
      'gpt-4-turbo': 0.01 / 1000, // $0.01 per 1K tokens
      'gpt-3.5-turbo': 0.002 / 1000 // $0.002 per 1K tokens
    };
    
    return tokens * (pricing[model as keyof typeof pricing] || pricing['gpt-4']);
  }

  private validateConfiguration(): void {
    if (!this.API_KEY) {
      throw new Error('OpenAI API key is required. Please set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  private initializeRateLimiting(): void {
    // Clean up rate limit tracker every hour
    setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [key, timestamps] of this.rateLimitTracker) {
        const recentRequests = timestamps.filter(t => t > oneHourAgo);
        if (recentRequests.length === 0) {
          this.rateLimitTracker.delete(key);
        } else {
          this.rateLimitTracker.set(key, recentRequests);
        }
      }
    }, 60 * 60 * 1000);
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const userKey = 'default'; // In production, use actual user ID
    
    const userRequests = this.rateLimitTracker.get(userKey) || [];
    const recentRequests = userRequests.filter(t => t > oneHourAgo);
    
    if (recentRequests.length >= 100) { // 100 requests per hour limit
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    recentRequests.push(now);
    this.rateLimitTracker.set(userKey, recentRequests);
  }

  private trackUsage(usage: TokenUsage): void {
    this.usageTracker.totalTokens += usage.totalTokens;
    this.usageTracker.totalCost += usage.estimatedCost;
  }

  private generateCacheKey(request: WritingAssistanceRequest): string {
    return `ai_${request.type}_${JSON.stringify(request.context)}_${request.userInput.substring(0, 50)}`;
  }

  public getUsageStats(): { totalTokens: number; totalCost: number } {
    return { ...this.usageTracker };
  }
}

// Export singleton instance
export const chatGPTIntegrationService = new ChatGPTIntegrationService(); 