import React from 'react';
import {
  Brain,
  Code,
  Database,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  Search,
  MessageSquare,
  Scissors,
  Hash,
  HardDrive,
  Zap,
  ExternalLink,
  Github,
  Shield,
  ArrowRight,
  Terminal,
  Eye,
  Activity,
  FlaskConical,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ModernCard } from '../components/ModernDesignSystem';
import { appConfig } from '@/config/appConfig';
import { ChatWindow } from '../components/ai/ChatWindow';
import { DocumentUpload } from '../components/ai/DocumentUpload';
import { ArchitectureDiagram } from '../components/ai/ArchitectureDiagram';
import { ModelMetadataPanel } from '../components/ai/ModelMetadataPanel';
import { EngineeringChallenges } from '../components/ai/EngineeringChallenges';
import { PerformanceNotes } from '../components/ai/PerformanceNotes';
import { SafetyNotes } from '../components/ai/SafetyNotes';
import { UseCases } from '../components/ai/UseCases';
import { ApiPlayground } from '../components/ai/ApiPlayground';
import { ChunkBrowser } from '../components/ai/ChunkBrowser';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/ai/ScrollReveal';

/* ─── Section Header ────────────────────────────────────── */
const SectionHeader: React.FC<{
  badge?: string;
  title: string;
  subtitle?: string;
}> = ({ badge, title, subtitle }) => (
  <ScrollReveal className="text-center mb-12">
    {badge && (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-primary mb-4">
        <span className="w-6 h-px bg-accent-primary/60" />
        {badge}
        <span className="w-6 h-px bg-accent-primary/60" />
      </span>
    )}
    <h2 className="text-headline font-bold text-gradient-flow mb-3">{title}</h2>
    {subtitle && (
      <p className="text-body text-medium-contrast max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
  </ScrollReveal>
);

/* ─── Tech Stack Data ───────────────────────────────────── */
const techStack = [
  {
    icon: <Code className="w-6 h-6" />,
    title: 'Go + Gin',
    description: 'High-performance REST API with SSE streaming, concurrent document processing, and sub-millisecond routing.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'pgvector',
    description: 'PostgreSQL extension for 512-dim vector embeddings with HNSW cosine indexing and full SQL compatibility.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: <Hash className="w-6 h-6" />,
    title: 'Local Embeddings',
    description: 'Zero-cost SHA256 n-gram hash embeddings. 512 dimensions, deterministic, no API calls required.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: 'RAG Pipeline',
    description: 'Full retrieval-augmented generation with SSE streaming, source citations, and prompt transparency.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'Gemini 2.5 Flash',
    description: 'Google\'s free-tier LLM. Temperature 0.3, streaming via SSE, 1024 max tokens for factual accuracy.',
    color: 'from-emerald-500 to-cyan-500',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '$0/month',
    description: 'Entire system runs at zero cost. Local embeddings, Gemini free tier, PostgreSQL. No paid APIs.',
    color: 'from-green-500 to-emerald-600',
  },
];

/* ─── Pipeline Steps Data ───────────────────────────────── */
const pipelineSteps = [
  { number: '01', icon: <FileText className="w-5 h-5" />, title: 'Upload', description: 'PDF, Markdown, or plain text uploaded via React UI.' },
  { number: '02', icon: <Scissors className="w-5 h-5" />, title: 'Chunk', description: '512-token chunks with 50-token overlap for context preservation.' },
  { number: '03', icon: <Hash className="w-5 h-5" />, title: 'Embed', description: '512-dim vectors via local SHA256 n-gram hash — zero cost.' },
  { number: '04', icon: <HardDrive className="w-5 h-5" />, title: 'Store', description: 'HNSW-indexed pgvector for fast approximate nearest-neighbor search.' },
  { number: '05', icon: <MessageSquare className="w-5 h-5" />, title: 'Query', description: 'Natural language question embedded in the same vector space.' },
  { number: '06', icon: <Search className="w-5 h-5" />, title: 'Search', description: 'Cosine-distance retrieval of the top-5 most relevant chunks.' },
  { number: '07', icon: <Zap className="w-5 h-5" />, title: 'Context', description: 'Retrieved chunks injected into prompt with system constraints.' },
  { number: '08', icon: <Brain className="w-5 h-5" />, title: 'Generate', description: 'Gemini 2.5 Flash streams a grounded answer via SSE.' },
];

/* ─── Capability cards for hero ─────────────────────────── */
const capabilities = [
  { icon: <Eye className="w-5 h-5" />, label: 'Source Transparency', desc: 'Inspect every retrieved chunk' },
  { icon: <Activity className="w-5 h-5" />, label: 'Live Pipeline', desc: 'Watch each RAG stage execute' },
  { icon: <FlaskConical className="w-5 h-5" />, label: 'Research Mode', desc: 'Multi-agent deep analysis' },
  { icon: <Users className="w-5 h-5" />, label: 'Parallel Agents', desc: '5 specialized AI researchers' },
];

/* ─── Main Component ────────────────────────────────────── */
export default function AiLab() {
  if (!appConfig.features.aiLab) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center px-4">
          <Brain className="w-16 h-16 text-low-contrast mx-auto mb-6" />
          <h1 className="text-headline font-bold text-high-contrast mb-4">AI Lab is currently disabled.</h1>
          <p className="text-body-lg text-medium-contrast">Check back soon — this feature is under development.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28" aria-label="AI Lab Hero">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-cyan-500/8 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-primary/20 bg-accent-primary/5 text-accent-primary text-xs font-semibold tracking-wide uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              RAG + Multi-Agent Research
            </div>
          </motion.div>

          <motion.h1
            className="text-display text-gradient-flow mb-6 !leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          >
            AI Research Copilot
          </motion.h1>

          <motion.p
            className="text-body-lg text-medium-contrast max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Upload documents, ask questions, or launch deep research with parallel AI agents.
            Built with Go, pgvector, and Gemini 2.5 Flash — running at $0/month.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-body-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
            >
              Try the Demo
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-medium-contrast text-medium-contrast text-body-sm font-medium hover:text-high-contrast hover:border-high-contrast transition-all"
            >
              View Architecture
            </a>
          </motion.div>

          {/* Capability badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-medium-contrast/40 bg-medium-contrast/20 backdrop-blur-sm"
              >
                <span className="text-accent-primary">{cap.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-high-contrast leading-tight">{cap.label}</p>
                  <p className="text-[10px] text-low-contrast">{cap.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* ━━━ LIVE DEMO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="demo" className="mb-24 scroll-mt-20" aria-label="Interactive AI Demo">
          <SectionHeader
            badge="Try It Live"
            title="Interactive Demo"
            subtitle="Ask questions about indexed documents, or toggle Research Mode for multi-agent deep analysis with structured reports, data visualization, and source transparency."
          />
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <ChatWindow />
            </div>
          </ScrollReveal>
        </section>

        {/* ━━━ DOCUMENT MANAGEMENT ━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-24" aria-label="Document Management">
          <SectionHeader
            badge="Knowledge Base"
            title="Documents & Chunks"
            subtitle="Upload documents to build your knowledge base, then browse the indexed chunks that power similarity search."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScrollReveal delay={0}>
              <ModernCard variant="glass" padding="lg" className="h-full">
                <h3 className="text-body font-semibold text-high-contrast mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-primary" />
                  Upload Documents
                </h3>
                <DocumentUpload />
              </ModernCard>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <ModernCard variant="glass" padding="lg" className="h-full">
                <h3 className="text-body font-semibold text-high-contrast mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent-primary" />
                  Indexed Chunks
                </h3>
                <ChunkBrowser />
              </ModernCard>
            </ScrollReveal>
          </div>
        </section>

        {/* ━━━ ARCHITECTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="architecture" className="mb-24 scroll-mt-20" aria-label="System Architecture">
          <SectionHeader
            badge="System Design"
            title="Architecture"
            subtitle="An 8-node pipeline from user input to streamed AI response. Click any node to see implementation details."
          />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start max-w-5xl mx-auto">
            <ScrollReveal className="lg:col-span-3">
              <ModernCard variant="glass" padding="lg">
                <ArchitectureDiagram />
              </ModernCard>
            </ScrollReveal>
            <ScrollReveal delay={0.15} className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <h3 className="text-title font-bold text-high-contrast">How it works</h3>
                <p className="text-body-sm text-medium-contrast leading-relaxed">
                  Documents are chunked into 512-token segments and embedded as 512-dimensional vectors
                  using local hash-based embeddings. Stored in pgvector with HNSW indexing.
                </p>
                <p className="text-body-sm text-medium-contrast leading-relaxed">
                  Queries are embedded in the same vector space, cosine search retrieves the top-5 chunks,
                  and Gemini 2.5 Flash streams a grounded answer via SSE with full source transparency.
                </p>
              </div>
              <ModelMetadataPanel />
            </ScrollReveal>
          </div>
        </section>

        {/* ━━━ HOW IT WORKS — PIPELINE ━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-24" aria-label="RAG Pipeline Steps">
          <SectionHeader
            badge="Pipeline"
            title="How It Works"
            subtitle="The complete RAG pipeline from document upload to streamed answer, in 8 steps."
          />
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {pipelineSteps.map((step) => (
              <StaggerItem key={step.number}>
                <div className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/20 backdrop-blur-sm p-4 h-full hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-accent-primary/60 group-hover:text-accent-primary transition-colors">
                      {step.number}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
                      {step.icon}
                    </div>
                  </div>
                  <h4 className="text-body-sm font-semibold text-high-contrast mb-1">{step.title}</h4>
                  <p className="text-xs text-medium-contrast leading-relaxed">{step.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* ━━━ ENGINEERING DEPTH ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-24" aria-label="Engineering Details">
          <SectionHeader
            badge="Deep Dive"
            title="Engineering Challenges"
            subtitle="Key technical decisions, trade-offs, and lessons learned building this RAG system."
          />
          <ScrollReveal>
            <div className="max-w-3xl mx-auto">
              <EngineeringChallenges />
            </div>
          </ScrollReveal>
        </section>

        {/* ━━━ PERFORMANCE + SAFETY (side by side) ━━━━━━━ */}
        <section className="mb-24" aria-label="Performance and Safety">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <ScrollReveal>
                <h3 className="text-title font-bold text-high-contrast mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Performance
                </h3>
                <p className="text-body-sm text-medium-contrast mb-6">
                  Optimizations across every pipeline stage.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <PerformanceNotes />
              </ScrollReveal>
            </div>
            <div>
              <ScrollReveal>
                <h3 className="text-title font-bold text-high-contrast mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  AI Safety
                </h3>
                <p className="text-body-sm text-medium-contrast mb-6">
                  Built-in guardrails for reliable responses.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <SafetyNotes />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ━━━ TECH STACK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-24" aria-label="Technology Stack">
          <SectionHeader
            badge="Stack"
            title="Technologies"
            subtitle="Every component chosen for performance, zero cost, and production readiness."
          />
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {techStack.map((tech) => (
              <StaggerItem key={tech.title}>
                <div className="rounded-xl border border-medium-contrast/40 bg-medium-contrast/20 backdrop-blur-sm p-5 hover:border-medium-contrast/60 hover:-translate-y-0.5 transition-all h-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {tech.icon}
                  </div>
                  <h3 className="text-body font-semibold text-high-contrast mb-1.5">{tech.title}</h3>
                  <p className="text-body-sm text-medium-contrast leading-relaxed">{tech.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* ━━━ USE CASES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-24" aria-label="Use Cases">
          <SectionHeader
            badge="Applications"
            title="Real-World Use Cases"
            subtitle="How this RAG architecture can be deployed across industries."
          />
          <ScrollReveal>
            <div className="max-w-4xl mx-auto">
              <UseCases />
            </div>
          </ScrollReveal>
        </section>

        {/* ━━━ API PLAYGROUND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="mb-24" aria-label="API Playground">
          <SectionHeader
            badge="Developer Tools"
            title="API Playground"
            subtitle="Test backend endpoints directly from the browser. Requires a running Go backend."
          />
          <ScrollReveal>
            <div className="max-w-5xl mx-auto">
              <ApiPlayground />
            </div>
          </ScrollReveal>
        </section>

        {/* ━━━ PORTFOLIO SHOWCASE ━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section aria-label="Portfolio Showcase">
          <SectionHeader
            badge="Showcase"
            title="Project Summary"
            subtitle="End-to-end GenAI engineering — from system design to production-ready implementation."
          />
          <ScrollReveal>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl border border-medium-contrast/40 bg-gradient-to-br from-medium-contrast/20 via-medium-contrast/10 to-transparent backdrop-blur-sm p-6 sm:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left */}
                  <div className="space-y-5">
                    <h3 className="text-title font-bold text-high-contrast">AI Research Copilot</h3>
                    <p className="text-medium-contrast leading-relaxed">
                      A full-stack RAG system with multi-agent research capabilities. Upload documents for Q&A,
                      or launch deep research with 5 parallel AI agents that produce structured reports with data visualization.
                    </p>

                    <ul className="space-y-2.5 text-body-sm text-medium-contrast" role="list">
                      {[
                        'Multi-agent research: 5 parallel agents (Overview, Market, Technical, Trends, Risk)',
                        'Go REST API with SSE streaming for both RAG and research pipelines',
                        'pgvector HNSW indexing for sub-millisecond similarity search',
                        'Structured reports with key findings, data charts, and agent performance',
                        'Zero-cost: local embeddings + Gemini free tier ($0/month)',
                        'Live pipeline visualization, source citations, and prompt transparency',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2.5" role="listitem">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-3 pt-3">
                      <a
                        href="https://github.com/akshayverma"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-body-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
                      >
                        <Github className="w-4 h-4" />
                        View Source
                      </a>
                      <a
                        href="#demo"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-medium-contrast text-medium-contrast text-body-sm font-medium hover:text-high-contrast hover:border-high-contrast transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Try Demo
                      </a>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="space-y-5">
                    <h4 className="text-body font-semibold text-high-contrast">Technologies</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Frontend', items: 'React, TypeScript, Vite, Tailwind, Framer Motion' },
                        { label: 'Backend', items: 'Go (Gin), REST API + SSE streaming' },
                        { label: 'Database', items: 'PostgreSQL + pgvector, HNSW cosine indexing' },
                        { label: 'AI / ML', items: 'Gemini 2.5 Flash, multi-agent orchestration, local embeddings (512d)' },
                        { label: 'DevOps', items: 'Vercel (frontend), local PostgreSQL' },
                      ].map((row) => (
                        <div key={row.label} className="flex gap-3">
                          <span className="text-xs font-semibold text-accent-primary w-16 flex-shrink-0 pt-0.5">
                            {row.label}
                          </span>
                          <span className="text-body-sm text-medium-contrast">{row.items}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-medium-contrast/40 bg-low-contrast/30 p-4">
                      <p className="text-[11px] text-medium-contrast leading-relaxed font-mono">
                        Chat: User → React UI → Go API → Embed → pgvector → Top-5 chunks → Gemini → SSE answer
                        Research: Query → Planner → 5 Parallel Agents → Synthesis → Structured Report
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </div>
  );
}
