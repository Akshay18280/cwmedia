import React from 'react';
import {
  Brain,
  Code,
  Database,
  Container,
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
} from 'lucide-react';
import { ModernCard } from '../components/ModernDesignSystem';
import { appConfig } from '@/config/appConfig';
import { ChatWindow } from '../components/ai/ChatWindow';
import { DocumentUpload } from '../components/ai/DocumentUpload';
import { ArchitectureDiagram } from '../components/ai/ArchitectureDiagram';

const techStack = [
  {
    icon: <Code className="w-8 h-8 text-white" />,
    title: 'Golang',
    description:
      'High-performance REST API handling document ingestion, chunking, and query orchestration.',
    color: 'bg-cyan-600',
  },
  {
    icon: <Database className="w-8 h-8 text-white" />,
    title: 'pgvector',
    description:
      'PostgreSQL extension for storing and querying high-dimensional vector embeddings with HNSW indexing.',
    color: 'bg-indigo-600',
  },
  {
    icon: <Container className="w-8 h-8 text-white" />,
    title: 'Docker',
    description:
      'Containerized services with Docker Compose for reproducible local and production environments.',
    color: 'bg-blue-500',
  },
  {
    icon: <Layers className="w-8 h-8 text-white" />,
    title: 'RAG Pipeline',
    description:
      'Retrieval-Augmented Generation pipeline that grounds LLM responses in your actual documents.',
    color: 'bg-gradient-flow',
  },
  {
    icon: <Cpu className="w-8 h-8 text-white" />,
    title: 'LLM APIs',
    description:
      'Pluggable LLM backend supporting OpenAI, Anthropic, and local models via a unified interface.',
    color: 'bg-holographic',
  },
];

const pipelineSteps = [
  {
    number: '01',
    icon: <FileText className="w-5 h-5" />,
    title: 'Document Upload',
    description: 'The user uploads a PDF, Markdown, or plain text file through the React UI.',
  },
  {
    number: '02',
    icon: <Scissors className="w-5 h-5" />,
    title: 'Text Extraction & Chunking',
    description:
      'The Golang API extracts raw text and splits it into 512-token chunks with 50-token overlap to preserve context across boundaries.',
  },
  {
    number: '03',
    icon: <Hash className="w-5 h-5" />,
    title: 'Embedding Generation',
    description:
      'Each chunk is converted into a 1536-dimensional vector using an embedding model (e.g. OpenAI text-embedding-ada-002).',
  },
  {
    number: '04',
    icon: <HardDrive className="w-5 h-5" />,
    title: 'Vector Storage',
    description:
      'Embeddings are stored in PostgreSQL via the pgvector extension with HNSW indexing for fast approximate nearest-neighbor lookups.',
  },
  {
    number: '05',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'User Asks a Question',
    description:
      'The user types a natural-language question in the chat interface. The question is sent to the API.',
  },
  {
    number: '06',
    icon: <Hash className="w-5 h-5" />,
    title: 'Query Embedding',
    description:
      'The question is embedded using the same model so it lives in the same vector space as the document chunks.',
  },
  {
    number: '07',
    icon: <Search className="w-5 h-5" />,
    title: 'Similarity Search',
    description:
      'pgvector performs a cosine-similarity search to retrieve the top-k most relevant document chunks.',
  },
  {
    number: '08',
    icon: <Zap className="w-5 h-5" />,
    title: 'Context Injection',
    description:
      'The retrieved chunks are injected into the LLM prompt as context, grounding the model in real document data.',
  },
  {
    number: '09',
    icon: <Brain className="w-5 h-5" />,
    title: 'Answer Generation',
    description:
      'The LLM generates a factual answer based on the provided context. The response streams back to the UI in real time.',
  },
];

export default function AiLab() {
  if (!appConfig.features.aiLab) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center px-4">
          <Brain className="w-16 h-16 text-low-contrast mx-auto mb-6" />
          <h1 className="text-headline font-bold text-high-contrast mb-4">
            AI Lab is currently disabled.
          </h1>
          <p className="text-body-lg text-medium-contrast">
            Check back soon — this feature is under development.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 text-accent-primary text-body-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            GenAI Project
          </div>
          <h1 className="text-display mb-6 text-gradient-flow">AI Knowledge Copilot</h1>
          <p className="text-body-lg text-medium-contrast max-w-3xl mx-auto">
            A Retrieval-Augmented Generation (RAG) system that allows users to upload documents and
            chat with them using AI.
          </p>
        </div>

        {/* Architecture Section */}
        <section className="mb-20">
          <h2 className="text-headline font-bold text-center mb-12 text-gradient-flow">
            Architecture
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ModernCard variant="neumorphic" padding="lg">
              <ArchitectureDiagram />
            </ModernCard>
            <div className="space-y-4">
              <h3 className="text-title font-bold text-high-contrast">How it works</h3>
              <p className="text-medium-contrast leading-relaxed">
                When a user uploads a document, the Golang API chunks the text into segments and
                generates vector embeddings using an embedding model. These embeddings are stored in
                PostgreSQL via the pgvector extension.
              </p>
              <p className="text-medium-contrast leading-relaxed">
                At query time, the user&apos;s question is embedded, a similarity search finds the
                most relevant document chunks, and they&apos;re passed as context to the LLM —
                producing an answer grounded in the uploaded content.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works — 9-Step Pipeline */}
        <section className="mb-20">
          <h2 className="text-headline font-bold text-center mb-4 text-gradient-flow">
            How It Works
          </h2>
          <p className="text-body text-medium-contrast text-center mb-12 max-w-2xl mx-auto">
            The full RAG pipeline from document upload to answer generation, broken down step by
            step.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelineSteps.map((step) => (
              <ModernCard key={step.number} variant="glass" padding="md" hover>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent-primary">{step.number}</span>
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mt-1">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-body font-semibold text-high-contrast mb-1">
                      {step.title}
                    </h4>
                    <p className="text-body-sm text-medium-contrast leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </section>

        {/* Interactive Chat Demo */}
        <section className="mb-20">
          <h2 className="text-headline font-bold text-center mb-4 text-gradient-flow">
            Interactive Demo
          </h2>
          <p className="text-body text-medium-contrast text-center mb-10 max-w-2xl mx-auto">
            Try the chat interface below. Responses are simulated in this demo — connect a backend
            to enable live RAG queries.
          </p>
          <div className="max-w-3xl mx-auto">
            <ChatWindow />
          </div>
        </section>

        {/* Document Upload Section */}
        <section className="mb-20">
          <h2 className="text-headline font-bold text-center mb-4 text-gradient-flow">
            Document Upload
          </h2>
          <p className="text-body text-medium-contrast text-center mb-10 max-w-2xl mx-auto">
            Upload PDF, Markdown, or plain text files to build your knowledge base. Uploads require
            a running backend with the document-ingestion pipeline.
          </p>
          <div className="max-w-2xl mx-auto">
            <ModernCard variant="glass" padding="lg">
              <DocumentUpload />
            </ModernCard>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="mb-20">
          <h2 className="text-headline font-bold text-center mb-12 text-gradient-flow">
            Tech Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techStack.map((tech) => (
              <ModernCard
                key={tech.title}
                variant="default"
                padding="lg"
                hover
                className="text-center"
              >
                <div
                  className={`w-16 h-16 ${tech.color} rounded-full mx-auto mb-6 flex items-center justify-center`}
                >
                  {tech.icon}
                </div>
                <h3 className="text-body-lg font-bold mb-2 text-high-contrast">{tech.title}</h3>
                <p className="text-medium-contrast text-body-sm">{tech.description}</p>
              </ModernCard>
            ))}
          </div>
        </section>

        {/* Portfolio Showcase */}
        <section>
          <h2 className="text-headline font-bold text-center mb-4 text-gradient-flow">
            Portfolio Showcase
          </h2>
          <p className="text-body text-medium-contrast text-center mb-12 max-w-2xl mx-auto">
            This project demonstrates end-to-end GenAI engineering — from frontend design to
            backend RAG orchestration.
          </p>

          <div className="max-w-4xl mx-auto">
            <ModernCard variant="neumorphic" padding="lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left — summary */}
                <div className="space-y-5">
                  <h3 className="text-title font-bold text-high-contrast">
                    AI Knowledge Copilot
                  </h3>
                  <p className="text-medium-contrast leading-relaxed">
                    A full-stack Retrieval-Augmented Generation system that lets users upload
                    documents and ask questions answered by an LLM grounded in their own data.
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-body font-semibold text-high-contrast">Key highlights</h4>
                    <ul className="space-y-2 text-body-sm text-medium-contrast">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                        Go REST API with concurrent document processing
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                        pgvector HNSW indexing for sub-millisecond similarity search
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                        Pluggable LLM providers (OpenAI, Anthropic, local)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                        Streaming chat UI with real-time health monitoring
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                        Docker Compose for one-command deployment
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href="https://github.com/akshayverma"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-flow text-white text-body-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Github className="w-4 h-4" />
                      View on GitHub
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-medium-contrast text-medium-contrast text-body-sm font-medium hover:text-high-contrast hover:border-high-contrast transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  </div>
                </div>

                {/* Right — tech breakdown */}
                <div className="space-y-5">
                  <h4 className="text-body font-semibold text-high-contrast">Technologies Used</h4>

                  <div className="space-y-4">
                    {[
                      { label: 'Frontend', items: 'React, TypeScript, Vite, Tailwind CSS' },
                      { label: 'Backend', items: 'Go (net/http), REST API, Docker' },
                      {
                        label: 'Database',
                        items: 'PostgreSQL + pgvector, HNSW indexing',
                      },
                      {
                        label: 'AI / ML',
                        items: 'OpenAI Embeddings, GPT-4 / Claude, RAG pipeline',
                      },
                      { label: 'DevOps', items: 'Docker Compose, GitHub Actions, Vercel' },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="text-body-sm font-medium text-high-contrast">{row.label}</p>
                        <p className="text-body-sm text-medium-contrast">{row.items}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-medium-contrast bg-low-contrast/50 p-4">
                    <h4 className="text-body-sm font-semibold text-high-contrast mb-2">
                      Architecture summary
                    </h4>
                    <p className="text-xs text-medium-contrast leading-relaxed font-mono">
                      User → React UI → Go API → Embed query → pgvector cosine search → Top-k
                      chunks → LLM prompt → Streamed answer
                    </p>
                  </div>
                </div>
              </div>
            </ModernCard>
          </div>
        </section>
      </div>
    </div>
  );
}
