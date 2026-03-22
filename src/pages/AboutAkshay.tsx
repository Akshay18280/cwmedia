import React, { useEffect, useState } from 'react';
import { Award, Code, Globe, BookOpen, Heart, Users, Target, Zap, Star, MapPin, Mail, Phone, Linkedin, Github, Brain, Briefcase, GraduationCap, ChevronDown, Monitor, Server, Rocket } from 'lucide-react';

export default function AboutAkshay() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [expandedExp, setExpandedExp] = useState<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const professionalTimeline = [
    {
      period: "September 2025 – Present",
      role: "SDE-1, Software Development Engineer",
      company: "CSG International",
      location: "Bangalore, India",
      type: "Telecom Product Company",
      highlights: [
        "Designed Golang microservices for ASCENDON telecom charging platform processing 2M+ usage events daily",
        "Built Daily Charging aggregation system for large-scale telecom billing pipelines",
        "Reduced cloud infrastructure cost by 50% through AWS architecture optimization",
        "Developed observability dashboards using CloudWatch, Cloudability, and Grafana",
        "Automated DevOps workflows using Golang, Python, Bash, Azure DevOps, and Jira",
        "Built utilities for telecom CDR reprocessing ensuring billing data integrity",
        "Accelerated engineering development using AI coding assistants such as Cursor AI",
        "Delivered telecom features including Usage Event Refund, IOD Travel SIM, and Normalization Gap"
      ]
    },
    {
      period: "July 2022 – August 2025",
      role: "SDE-Grad, Software Development Engineer",
      company: "CSG International",
      location: "Bangalore, India",
      type: "Telecom Product Company",
      highlights: [
        "Designed Golang microservices for ASCENDON telecom charging platform processing 2M+ usage events daily",
        "Enhanced search events logic, rate, revoke & reprocess using metadata as per client requirements",
        "Contributed and mentored new engineers & interns, providing guidance and code reviews",
        "Developed Multi BU Infrastructure helping cut costs by more than 50%",
        "Proficient in production support, E2E testing, and DevOps activities using Grafana, CloudWatch AWS services"
      ]
    },
    {
      period: "December 2021 – July 2022",
      role: "SDE Intern",
      company: "CSG International",
      location: "Bangalore, India",
      type: "Telecom Product Company",
      highlights: [
        "Developed Golang microservices for offline telecom rating systems",
        "Built REST APIs supporting large-scale CDR processing pipelines",
        "Integrated AWS services including S3, Lambda, and DynamoDB",
        "Collaborated in Agile teams using Jira to support production telecom systems"
      ]
    }
  ];

  const technicalSkills: Record<string, string[]> = {
    "Languages": ["Golang", "TypeScript", "JavaScript", "Python", "SQL", "Bash"],
    "Frontend": ["React", "Tailwind CSS", "Vite", "Zustand", "Recharts", "Framer Motion"],
    "Backend & APIs": ["Go/Gin", "REST APIs", "SSE Streaming", "pgvector", "Distributed Systems"],
    "Cloud & Infrastructure": ["AWS (Lambda, ECS, EC2, S3, RDS, DynamoDB, SQS, SNS, CloudWatch)", "Terraform", "Docker"],
    "Databases & Caching": ["PostgreSQL", "Redis", "ElastiCache", "Firebase Firestore"],
    "AI & ML": ["Google Gemini", "Multi-Agent Systems", "RAG Pipelines", "Cursor AI", "GitHub Copilot", "Claude"],
    "DevOps & Observability": ["CI/CD", "Azure DevOps", "Jenkins", "Grafana", "Prometheus", "CloudWatch"],
    "Deployment & Hosting": ["Vercel", "Firebase Hosting", "GitHub Actions"],
    "Developer Tools": ["Jira", "Postman", "Linux"]
  };

  const skillIcons: Record<string, React.ReactNode> = {
    "Languages": <Code className="w-5 h-5" />,
    "Frontend": <Monitor className="w-5 h-5" />,
    "Backend & APIs": <Server className="w-5 h-5" />,
    "Cloud & Infrastructure": <Globe className="w-5 h-5" />,
    "Databases & Caching": <Target className="w-5 h-5" />,
    "AI & ML": <Brain className="w-5 h-5" />,
    "DevOps & Observability": <Zap className="w-5 h-5" />,
    "Deployment & Hosting": <Rocket className="w-5 h-5" />,
    "Developer Tools": <Briefcase className="w-5 h-5" />
  };

  const projects = [
    {
      title: "ASCENDON Rating & Charging Platform",
      company: "CSG International",
      technologies: ["Golang", "AWS", "Terraform", "Cursor AI"],
      highlights: [
        "Built microservices for telecom usage rating pipelines",
        "Implemented CDR ingestion and distributed event processing",
        "Designed event-driven architecture using AWS services",
        "Provisioned infrastructure using Terraform IaC"
      ]
    },
    {
      title: "CWMedia — AI Research Intelligence Platform",
      company: "Carelwave Media (Personal Project)",
      technologies: ["React", "TypeScript", "Go/Gin", "PostgreSQL", "pgvector", "Gemini AI", "Firebase", "Tailwind CSS", "Vite", "Vercel"],
      highlights: [
        "Built end-to-end AI research platform with multi-agent orchestration, SSE streaming, and fact verification",
        "Developed 6 specialized research agents with parallel execution, retry logic, and financial data enrichment",
        "Created responsive UI with dark mode, command palette, floating assistant, knowledge graphs, and PDF export",
        "Deployed full-stack on Vercel + Go backend with Firebase auth, Zustand state management, and real-time notifications"
      ]
    }
  ];

  const achievements = [
    {
      title: "Team Spotlight on Excellence Award",
      organization: "CSG International",
      period: "Q3 2023",
      description: "Recognized for engineering contributions and delivery of critical telecom platform capabilities.",
      type: "Award",
      location: "Bangalore, India"
    },
    {
      title: "Chairperson — Computer Society of India (CSI)",
      organization: "SVVV University",
      period: "June 2021 – June 2022",
      description: "Led a 50+ member student engineering chapter organizing workshops and technical events.",
      type: "Leadership",
      location: "Indore, India"
    }
  ];

  const interests = [
    { icon: Brain, title: "Generative AI & Agentic Systems", description: "Exploring agentic AI, RAG pipelines, and AI-powered engineering workflows" },
    { icon: Code, title: "System Architecture", description: "Designing scalable microservices and distributed systems" },
    { icon: Globe, title: "Cloud Technologies", description: "AWS, Terraform, and modern infrastructure" },
    { icon: Users, title: "Team Leadership", description: "Mentoring and guiding engineering teams" },
    { icon: Target, title: "Performance Optimization", description: "Cost reduction and efficiency at scale" },
    { icon: Heart, title: "Problem Solving", description: "Building innovative solutions to complex challenges" }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-display mb-6 text-gradient-flow">
            Akshay Verma
          </h1>
          <p className="text-body-lg text-medium-contrast max-w-3xl mx-auto mb-4">
            Software Development Engineer with expertise in Golang, AWS, and scalable microservices architecture.
          </p>
          <p className="text-body text-low-contrast max-w-2xl mx-auto mb-8">
            Passionate about building efficient distributed systems, driving infrastructure optimization,
            and exploring agentic AI systems for intelligent engineering workflows.
          </p>

          {/* Contact info bar */}
          <div className="flex flex-wrap justify-center gap-4 text-body-sm text-medium-contrast">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Indore, India
            </span>
            <a href="tel:+916264507878" className="flex items-center gap-1.5 hover:text-high-contrast transition-colors">
              <Phone className="w-4 h-4" /> +91-62645-07878
            </a>
            <a href="mailto:akshayvermajan28@gmail.com" className="flex items-center gap-1.5 hover:text-high-contrast transition-colors">
              <Mail className="w-4 h-4" /> akshayvermajan28@gmail.com
            </a>
            <a href="https://linkedin.com/in/akshay-verma-024aa0152" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-high-contrast transition-colors">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
            <a href="https://github.com/Akshay18280" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-high-contrast transition-colors">
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>
        </div>

        {/* Professional Experience */}
        <section id="experience" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Professional Experience</h2>
          <div className="space-y-6">
            {professionalTimeline.map((item, index) => (
              <div
                key={index}
                className="relative bg-medium-contrast rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-low-contrast overflow-hidden"
              >
                <button
                  onClick={() => setExpandedExp(expandedExp === index ? -1 : index)}
                  className="w-full text-left p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="lg:flex-1">
                    <h3 className="text-body-lg font-bold text-high-contrast mb-1">
                      {item.role}
                    </h3>
                    <p className="text-body text-gradient-flow font-semibold mb-1">
                      {item.company}
                    </p>
                    <p className="text-caption text-subtle flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {item.location}
                    </p>
                  </div>
                  <div className="mt-3 lg:mt-0 flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-body-sm font-medium bg-gradient-flow text-white">
                      {item.period}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-low-contrast transition-transform ${expandedExp === index ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expandedExp === index && (
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-low-contrast/50">
                    <ul className="space-y-2.5 pt-4">
                      {item.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start">
                          <Star className="w-4 h-4 text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-high-contrast text-body-sm">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Technical Skills */}
        <section id="skills" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Technical Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(technicalSkills).map(([category, skills], index) => (
              <div
                key={index}
                className="bg-medium-contrast rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-low-contrast"
              >
                <h3 className="text-body font-bold text-high-contrast mb-4 flex items-center gap-2">
                  <span className="text-accent-primary">
                    {skillIcons[category] || <Code className="w-5 h-5" />}
                  </span>
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-flow-subtle text-white text-body-sm rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Projects */}
        <section id="projects" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Key Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {projects.map((proj, projIdx) => (
              <div key={projIdx} className="bg-medium-contrast rounded-xl p-8 shadow-lg border border-low-contrast">
                <h3 className="text-body-lg font-bold text-high-contrast mb-2">{proj.title}</h3>
                <p className="text-gradient-flow font-semibold mb-4">{proj.company}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {proj.technologies.map((tech, idx) => (
                    <span key={idx} className="px-3 py-1 bg-low-contrast text-high-contrast text-caption rounded-lg font-medium">
                      {tech}
                    </span>
                  ))}
                </div>

                <ul className="space-y-2.5">
                  {proj.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start">
                      <Zap className="w-4 h-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-high-contrast text-body-sm">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section id="education" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Education</h2>
          <div className="max-w-3xl mx-auto bg-medium-contrast rounded-xl p-8 shadow-lg border border-low-contrast">
            <div className="flex items-start">
              <GraduationCap className="w-8 h-8 text-blue-500 mt-1 mr-4 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-body-lg font-bold text-high-contrast mb-2">
                  Bachelor of Technology in Computer Science Engineering
                </h3>
                <p className="text-body text-gradient-flow font-semibold mb-2">
                  Shri Vaishnav Vidyapeeth Vishwavidyalaya
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-medium-contrast flex items-center text-body-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    Indore, Madhya Pradesh
                  </span>
                  <span className="text-body-sm font-medium text-subtle">
                    2018 – 2022
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section id="achievements" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Achievements & Recognition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-medium-contrast rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-low-contrast"
              >
                <div className="flex items-start">
                  <Award className="w-8 h-8 text-yellow-500 mt-1 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-body font-bold text-high-contrast mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-gradient-flow font-semibold text-body-sm mb-2">
                      {achievement.organization}
                    </p>
                    <p className="text-body-sm text-medium-contrast mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-subtle">{achievement.period}</span>
                      <span className="text-caption text-low-contrast">{achievement.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interests & Passions */}
        <section id="interests" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Interests & Passions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interests.map((interest, index) => (
              <div
                key={index}
                className="bg-medium-contrast rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-low-contrast text-center"
              >
                <interest.icon className="w-10 h-10 text-accent-primary mx-auto mb-4" />
                <h3 className="text-body font-bold text-high-contrast mb-2">{interest.title}</h3>
                <p className="text-medium-contrast text-body-sm">{interest.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Connect */}
        <section id="contact">
          <div className="bg-gradient-flow rounded-xl p-8 text-white text-center">
            <p className="text-body-lg mb-8">Let's build something amazing together!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://linkedin.com/in/akshay-verma-024aa0152"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a
                href="https://github.com/Akshay18280"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </a>
              <a
                href="mailto:akshayvermajan28@gmail.com"
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all duration-300"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Email</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
