export interface SourceChunk {
  chunk_id: string;
  document_filename: string;
  content: string;
  distance: number;
}

export interface QueryMetrics {
  total_ms: number;
  embed_ms: number;
  search_ms: number;
  llm_ms: number;
  chunks_found: number;
  prompt_tokens_approx: number;
}

export interface PipelineStep {
  step: string;
  status: 'idle' | 'started' | 'completed' | 'error';
  duration_ms?: number;
  chunks_found?: number;
}

// Research types
export interface ResearchEvent {
  type: 'planning' | 'plan_ready' | 'agent_start' | 'agent_progress' | 'agent_complete' |
        'extracting' | 'verifying' | 'verified' | 'synthesizing' | 'retry' |
        'report' | 'done' | 'error';
  agent_id?: string;
  agent?: string;
  data?: unknown;
  message?: string;
}

export interface ExtractedFact {
  category: string;
  claim: string;
  value?: string;
  unit?: string;
  timeframe?: string;
  confidence: number;
  source_count: number;
}

export interface VerifiedFact extends ExtractedFact {
  verified: boolean;
  confidence_score: number;
  confidence_label: 'high' | 'medium' | 'low';
  contradictions?: string[];
  agreeing_sources: number;
}

export interface VerificationResult {
  verified_facts: VerifiedFact[];
  overall_confidence: number;
  warnings?: string[];
}

export interface AgentResult {
  agent_id: string;
  agent_name: string;
  content: string;
  sources?: WebSearchResult[];
  facts?: ExtractedFact[];
  duration_ms: number;
  status: 'completed' | 'failed';
  error?: string;
}

export interface WebSearchResult {
  title: string;
  url?: string;
  content: string;
  score: number;
  confidence?: string;
  source?: string;
}

export interface DataPoint {
  label: string;
  value: number;
  unit?: string;
  category?: string;
}

export interface ReportSection {
  title: string;
  content: string;
  agent_id?: string;
}

export interface PromptRecord {
  phase: string;
  system: string;
  user: string;
}

export interface CompanyProfile {
  name: string;
  founded?: string;
  ceo?: string;
  headquarters?: string;
  employees?: string;
  industry?: string;
  market_cap?: string;
  stock_ticker?: string;
  website?: string;
  description?: string;
}

export interface FinancialMetric {
  label: string;
  value: number;
  unit: string;
  category: string;
  period?: string;
}

export interface CompetitorEntry {
  name: string;
  market_cap?: string;
  revenue?: string;
  strengths?: string;
  weaknesses?: string;
  market_share?: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface TimelineEvent {
  year: string;
  title: string;
  description?: string;
  category?: string;
}

export interface NewsItem {
  title: string;
  source?: string;
  date?: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  impact?: 'high' | 'medium' | 'low';
}

export interface ConfidenceScore {
  overall: number;
  source_count: number;
  reliability: 'high' | 'medium' | 'low';
  data_freshness?: string;
  label: string;
}

export interface ResearchReport {
  title: string;
  summary: string;
  sections: ReportSection[];
  key_findings: string[];
  data_points?: DataPoint[];
  company_profile?: CompanyProfile;
  financial_data?: FinancialMetric[];
  competitors?: CompetitorEntry[];
  swot_analysis?: SwotAnalysis;
  timeline?: TimelineEvent[];
  news_items?: NewsItem[];
  confidence_score?: ConfidenceScore;
  agent_results: AgentResult[];
  metrics: ResearchMetrics;
  verification?: VerificationResult;
  all_sources?: WebSearchResult[];
  research_prompts?: PromptRecord[];
  /** Set when research encountered an error but produced partial results */
  error?: string;
}

export interface ResearchMetrics {
  total_ms: number;
  planning_ms: number;
  research_ms: number;
  verification_ms: number;
  synthesis_ms: number;
  agents_used: number;
  total_sources: number;
  facts_extracted: number;
  web_searches: number;
  retry_count: number;
}

export interface ResearchAgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  duration_ms?: number;
  message?: string;
  sources?: number;
}
