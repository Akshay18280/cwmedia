import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, Mail, GraduationCap, ChevronRight, Sparkles, Code, Monitor, Brain } from 'lucide-react';

interface Job {
  title: string;
  icon: React.ReactNode;
  location: string;
  type: string;
  about: string;
  responsibilities: string[];
  requiredSkills: string[];
  niceToHave: string[];
  whatYouLearn: string[];
}

const jobs: Job[] = [
  {
    title: "Software Developer Intern",
    icon: <Code className="w-6 h-6" />,
    location: "Remote / Indore, India",
    type: "Internship · 6 months",
    about: "Join our backend engineering team to build scalable microservices powering CWMedia's AI research platform. You'll work with Go, PostgreSQL, and cloud infrastructure to deliver production-grade APIs and data pipelines.",
    responsibilities: [
      "Design and implement RESTful APIs and SSE streaming endpoints using Go and Gin framework",
      "Build and optimize PostgreSQL queries with pgvector for semantic search and embeddings storage",
      "Develop rate-limiting, retry logic, and circuit-breaker patterns for external API integrations",
      "Write unit and integration tests to maintain code quality and reliability",
      "Collaborate on infrastructure provisioning and deployment workflows",
      "Participate in code reviews and contribute to engineering best practices"
    ],
    requiredSkills: [
      "Proficiency in Go (Golang) or strong willingness to learn with prior experience in any compiled language",
      "Solid understanding of REST API design, HTTP protocols, and JSON",
      "Working knowledge of SQL and relational databases (PostgreSQL preferred)",
      "Familiarity with Git version control and collaborative development workflows",
      "Understanding of data structures, algorithms, and software design principles",
      "Strong debugging and problem-solving skills"
    ],
    niceToHave: [
      "Experience with Docker, containerized deployments, or cloud platforms (AWS, GCP)",
      "Familiarity with Terraform or infrastructure-as-code tools",
      "Exposure to CI/CD pipelines (GitHub Actions, Jenkins, Azure DevOps)",
      "Knowledge of event-driven architecture or message queues (SQS, SNS, Redis)"
    ],
    whatYouLearn: [
      "Production Go microservices architecture with rate limiting and distributed systems patterns",
      "AI backend integration — connecting LLM APIs, managing embeddings, and orchestrating multi-agent workflows",
      "Database optimization with PostgreSQL and pgvector for vector similarity search",
      "End-to-end deployment on Vercel and cloud infrastructure"
    ]
  },
  {
    title: "Frontend Developer Intern",
    icon: <Monitor className="w-6 h-6" />,
    location: "Remote / Indore, India",
    type: "Internship · 6 months",
    about: "Shape the user experience of CWMedia's AI research platform. You'll build interactive React components, real-time streaming UIs, and responsive layouts that make complex AI-powered research accessible and delightful.",
    responsibilities: [
      "Build and maintain React components using TypeScript with strict type safety",
      "Implement real-time streaming interfaces for AI research results using SSE",
      "Create responsive, accessible layouts with Tailwind CSS and Framer Motion animations",
      "Develop state management solutions using Zustand with persistence middleware",
      "Integrate with backend APIs and handle loading, error, and empty states gracefully",
      "Optimize bundle size, lazy loading, and Core Web Vitals performance"
    ],
    requiredSkills: [
      "Strong proficiency in React and modern JavaScript (ES6+)",
      "Working knowledge of TypeScript including interfaces, generics, and type guards",
      "Experience with HTML5, CSS3, and responsive design principles",
      "Familiarity with Tailwind CSS or utility-first CSS frameworks",
      "Understanding of component lifecycle, hooks, and state management patterns",
      "Experience with Git version control"
    ],
    niceToHave: [
      "Experience with Vite, Zustand, or React Router v6",
      "Familiarity with Framer Motion or CSS animations",
      "Knowledge of data visualization libraries (Recharts, D3.js)",
      "Experience with Firebase Authentication or OAuth integrations"
    ],
    whatYouLearn: [
      "Production React architecture with lazy loading, error boundaries, and real-time streaming UIs",
      "Building design systems with Tailwind CSS, dark mode, and semantic theming tokens",
      "State management patterns with Zustand, including persistence and derived state",
      "Integrating AI-powered features — chat interfaces, report viewers, knowledge graphs, and PDF export"
    ]
  },
  {
    title: "GenAI Developer Intern",
    icon: <Brain className="w-6 h-6" />,
    location: "Remote / Indore, India",
    type: "Internship · 6 months",
    about: "Pioneer the AI core of CWMedia's research platform. You'll design and implement multi-agent systems, prompt engineering strategies, and retrieval-augmented generation pipelines that power intelligent research analysis and fact verification.",
    responsibilities: [
      "Design and optimize prompts for Google Gemini and other LLM APIs for research tasks",
      "Build and refine multi-agent orchestration pipelines with parallel execution and error handling",
      "Implement RAG (Retrieval-Augmented Generation) pipelines using vector embeddings and pgvector",
      "Develop fact verification and source credibility scoring systems",
      "Create evaluation frameworks to measure AI output quality, accuracy, and relevance",
      "Research and integrate new AI capabilities — financial data enrichment, knowledge graphs, structured reporting"
    ],
    requiredSkills: [
      "Proficiency in Python or TypeScript for AI/ML application development",
      "Hands-on experience with LLM APIs (Google Gemini, OpenAI, or similar)",
      "Strong understanding of prompt engineering techniques and best practices",
      "Basic knowledge of embeddings, vector databases, and semantic search concepts",
      "Familiarity with Git version control and API integration patterns",
      "Analytical mindset with ability to evaluate and iterate on AI outputs"
    ],
    niceToHave: [
      "Experience building RAG pipelines or multi-agent AI systems",
      "Familiarity with LangChain, LlamaIndex, or similar AI orchestration frameworks",
      "Knowledge of web scraping and data extraction techniques",
      "Understanding of evaluation metrics for generative AI (BLEU, ROUGE, human eval)"
    ],
    whatYouLearn: [
      "Production multi-agent AI architecture with 6+ specialized agents working in parallel",
      "RAG pipeline design at scale — chunking strategies, embedding optimization, and retrieval tuning",
      "AI verification systems — cross-referencing sources, confidence scoring, and hallucination detection",
      "End-to-end AI product development from prompt design to user-facing streaming interfaces"
    ]
  }
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-high-contrast">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-body-sm font-medium text-indigo-400">We're Hiring</span>
            </div>
            <h1 className="text-display font-bold text-high-contrast mb-4">
              Build the Future of AI Research
            </h1>
            <p className="text-body-lg text-medium-contrast max-w-2xl mx-auto mb-6">
              Join Carelwave Media and help shape an AI-powered research intelligence platform used by thousands.
              We're looking for passionate engineers in their final semester ready to make an impact.
            </p>
            <div className="flex items-center justify-center gap-4 text-body-sm text-medium-contrast">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Final-semester B.Tech / B.E. students
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Remote / Indore, India
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-8">
          {jobs.map((job, idx) => (
            <div key={idx} className="bg-medium-contrast rounded-2xl border border-low-contrast overflow-hidden shadow-lg">
              {/* Job Header */}
              <div className="px-8 py-6 border-b border-low-contrast">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                      {job.icon}
                    </div>
                    <div>
                      <h2 className="text-body-lg font-bold text-high-contrast">{job.title}</h2>
                      <div className="flex items-center gap-3 mt-1 text-body-sm text-medium-contrast">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href="mailto:akshayvermajan28@gmail.com?subject=Application: {job.title} — CWMedia"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-body-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Apply Now
                  </a>
                </div>
              </div>

              {/* Job Body */}
              <div className="px-8 py-6 space-y-6">
                {/* About */}
                <div>
                  <h3 className="text-body font-semibold text-high-contrast mb-2">About the Role</h3>
                  <p className="text-body-sm text-medium-contrast leading-relaxed">{job.about}</p>
                </div>

                {/* Responsibilities */}
                <div>
                  <h3 className="text-body font-semibold text-high-contrast mb-3">Key Responsibilities</h3>
                  <ul className="space-y-2">
                    {job.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start text-body-sm text-medium-contrast">
                        <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-body font-semibold text-high-contrast mb-3">Required Skills</h3>
                    <ul className="space-y-2">
                      {job.requiredSkills.map((item, i) => (
                        <li key={i} className="flex items-start text-body-sm text-medium-contrast">
                          <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-body font-semibold text-high-contrast mb-3">Nice to Have</h3>
                    <ul className="space-y-2">
                      {job.niceToHave.map((item, i) => (
                        <li key={i} className="flex items-start text-body-sm text-medium-contrast">
                          <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* What You'll Learn */}
                <div className="bg-low-contrast/30 rounded-xl p-5">
                  <h3 className="text-body font-semibold text-high-contrast mb-3">What You'll Learn</h3>
                  <ul className="space-y-2">
                    {job.whatYouLearn.map((item, i) => (
                      <li key={i} className="flex items-start text-body-sm text-high-contrast">
                        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility */}
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <p className="text-body-sm text-medium-contrast">
                    <span className="font-semibold text-high-contrast">Eligibility:</span> Final-semester B.Tech / B.E. students (2025 graduating batch). All branches welcome.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How to Apply */}
        <div className="mt-12 text-center bg-medium-contrast rounded-2xl border border-low-contrast p-8">
          <h2 className="text-body-lg font-bold text-high-contrast mb-3">How to Apply</h2>
          <p className="text-body-sm text-medium-contrast mb-6 max-w-xl mx-auto">
            Send your resume and a brief cover letter explaining which role excites you and why.
            Include links to your GitHub, portfolio, or any relevant projects.
          </p>
          <a
            href="mailto:akshayvermajan28@gmail.com?subject=Internship Application — CWMedia"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-body font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <Mail className="w-5 h-5" />
            akshayvermajan28@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}
