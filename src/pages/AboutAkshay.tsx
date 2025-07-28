import React, { useEffect, useState } from 'react';
import { User, Award, Code, Globe, BookOpen, Coffee, Heart, Users, Target, Zap, Star, MapPin, Mail, Phone, Linkedin, Github, Twitter } from 'lucide-react';
import { ModernButton } from '../components/ModernDesignSystem';
import { useVoiceCommands } from '../hooks/useVoiceCommands';

export default function AboutAkshay() {
  const { speak, isListening, toggleListening, isSupported } = useVoiceCommands();
  const [activeSection, setActiveSection] = useState<string>('');

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
      period: "July 2022 – Present",
      role: "Software Development Engineer",
      company: "CSG International",
      location: "Bangalore, India",
      type: "Telecom Product Based Company",
      highlights: [
        "Proficient in production support, E2E testing, and DevOps activities using Grafana, CloudWatch AWS service",
        "Automated manual operations increasing team capacity - IAM access key rotations, Sanity testing, CloudWatch log scans",
        "Enhanced search events logic, rate, revoke & reprocess using metadata as per client requirements",
        "Contributed and mentored new engineers & interns, providing guidance and code reviews",
        "Developed Multi BU Infrastructure helping cut costs by more than 50%"
      ]
    },
    {
      period: "Dec 2021 - July 2022",
      role: "Software Development Engineer Intern",
      company: "CSG International",
      location: "Bangalore, India", 
      type: "Telecom Product Based Company",
      highlights: [
        "Executed feature implementations and resolved bugs for product enhancements",
        "Designed and developed scalable microservices to handle high-volume events"
      ]
    },
    {
      period: "March 2021 – May 2021",
      role: "Python Developer Intern",
      company: "Rexora Edulabs",
      location: "Indore, India",
      type: "EdTech Company",
      highlights: [
        "Developed responsive user interface components",
        "Contributed to website development using Python technologies"
      ]
    }
  ];

  const technicalSkills = {
    "Languages & Frameworks": ["GoLang", "Python", "JavaScript", "PHP"],
    "Cloud & DevOps": ["Amazon Web Services", "Terraform", "Kubernetes", "Docker", "CI/CD"],
    "Databases & Monitoring": ["SQL", "Grafana", "CloudWatch"],
    "Core Concepts": ["Data Structures", "Microservices", "System Design"],
    "Development Tools": ["Git", "Jira", "Postman", "VS Studio"]
  };

  const projects = [
    {
      title: "ASCENDONCSG",
      company: "CSG International",
      period: "Dec 2021 – Present",
      technologies: ["GoLang", "AWS", "Terraform", "DevOps"],
      description: "Scalable microservice handling millions of events",
      highlights: [
        "Designing scalable micro service architecture",
        "Handling Offline Event Rating and E2E Implementation",
        "Client Interaction and Production Support",
        "Performance improvements and cost reduction"
      ]
    },
    {
      title: "Complaint Portal",
      period: "Jan 2019 – Feb 2019",
      technologies: ["HTML", "CSS", "JavaScript", "PHP"],
      description: "Communication platform between students and administration",
      highlights: [
        "Anonymous complaint system for students",
        "Direct communication channel with administration",
        "Responsive web interface"
      ]
    }
  ];

  const achievements = [
    {
      title: "Team Spotlight on Excellence",
      organization: "CSG International",
      period: "Q3 2023",
      type: "Employee Experience Award",
      location: "Bangalore, India"
    },
    {
      title: "Chairperson",
      organization: "Computer Society of India SVVV-SB",
      period: "Jun. 2021 – Jun. 2022",
      type: "Leadership Role",
      location: "Indore, India"
    },
    {
      title: "2nd Prize (State-Level)",
      organization: "Science Project Competition",
      period: "Jan. 2018",
      type: "Academic Achievement",
      location: "Indore, India"
    },
    {
      title: "Gold Medal (Stage-1)",
      organization: "National Mathematics Olympiad", 
      period: "Jun. 2018",
      type: "Academic Excellence",
      location: "India"
    }
  ];

  const interests = [
    { icon: Code, title: "System Architecture", description: "Designing scalable microservices" },
    { icon: Globe, title: "Cloud Technologies", description: "AWS, DevOps, and Infrastructure" },
    { icon: Users, title: "Team Leadership", description: "Mentoring and guiding developers" },
    { icon: Target, title: "Performance Optimization", description: "Cost reduction and efficiency" },
    { icon: BookOpen, title: "Continuous Learning", description: "Staying updated with tech trends" },
    { icon: Heart, title: "Problem Solving", description: "Finding innovative solutions" }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-display mb-6 text-gradient-flow">
            About Akshay Verma
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-4">
            Software Development Engineer with expertise in GoLang, AWS, and scalable microservices architecture.
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
            Passionate about building efficient solutions, mentoring teams, and driving technological innovation.
          </p>
          {isSupported && (
            <ModernButton
              variant="glass"
              intent="secondary"
              size="md"
              icon={isListening ? User : User}
              iconPosition="left"
              onClick={toggleListening}
              className="mt-6"
            >
              {isListening ? 'Listening...' : 'Voice Commands'}
            </ModernButton>
          )}
        </div>

        {/* Professional Timeline */}
        <section id="experience" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Professional Experience</h2>
          <div className="space-y-8">
            {professionalTimeline.map((item, index) => (
              <div
                key={index}
                className="relative bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                  <div className="lg:flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {item.role}
                    </h3>
                    <p className="text-lg text-gradient-flow font-semibold mb-1">
                      {item.company}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {item.type}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {item.location}
                    </p>
                  </div>
                  <div className="mt-4 lg:mt-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-flow text-white">
                      {item.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {item.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start">
                      <Star className="w-4 h-4 text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills Matrix */}
        <section id="skills" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Technical Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(technicalSkills).map(([category, skills], index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-gradient-flow" />
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-flow-subtle text-white text-sm rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Key Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {project.title}
                  </h3>
                  {project.company && (
                    <p className="text-gradient-flow font-semibold mb-1">{project.company}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">{project.period}</p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{project.description}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <ul className="space-y-2">
                  {project.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start">
                      <Zap className="w-4 h-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section id="achievements" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Achievements & Recognition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start">
                  <Award className="w-8 h-8 text-yellow-500 mt-1 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-gradient-flow font-semibold mb-1">
                      {achievement.organization}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {achievement.type}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {achievement.period}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {achievement.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section id="education" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Education</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start">
              <BookOpen className="w-8 h-8 text-blue-500 mt-1 mr-4 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Bachelor of Technology in Computer Science Engineering
                </h3>
                <p className="text-lg text-gradient-flow font-semibold mb-1">
                  Shri Vaishnav Vidyapeeth Vishwavidyalaya University
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Indore, MP
                  </span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
                    2018 - 2022
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Socials */}
        <section id="contact" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Connect With Me</h2>
          <div className="bg-gradient-flow rounded-xl p-8 text-white text-center">
            <p className="text-xl mb-8">Let's build something amazing together!</p>
            <div className="flex justify-center space-x-6">
              <a
                href="https://linkedin.com/in/akshay-verma-024aa0152/"
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
            </div>
          </div>
        </section>

        {/* Personal Interests */}
        <section id="interests" className="mb-20">
          <h2 className="text-section-title mb-12 text-center">Interests & Passions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interests.map((interest, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 text-center"
              >
                <interest.icon className="w-12 h-12 text-gradient-flow mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {interest.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {interest.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 