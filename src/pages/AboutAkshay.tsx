import React, { useEffect, useState } from 'react';
import { User, Award, Code, Globe, BookOpen, Coffee, Heart, Users, Target, Zap, Star, MapPin, Mail, Phone, Linkedin, Github, Twitter } from 'lucide-react';
import { ModernButton } from '../components/ModernDesignSystem';
import { useVoiceCommands } from '../hooks/useVoiceCommands';

const AboutAkshay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { speak } = useVoiceCommands();

  useEffect(() => {
    setIsVisible(true);
    // Voice introduction when page loads
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        speak("Welcome to Akshay Verma's professional profile. Learn about his journey in technology and innovation.");
      }, 1000);
    }
  }, [speak]);

  const achievements = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "10+ Years Experience",
      description: "Senior software engineer with expertise in full-stack development",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Impact",
      description: "Built systems serving millions of users across multiple continents",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Industry Recognition",
      description: "Featured speaker at international tech conferences and summits",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Leadership",
      description: "Led engineering teams of 15+ developers across multiple projects",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Thought Leadership",
      description: "Published 50+ technical articles and open-source contributions",
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Innovation Focus",
      description: "Specializing in AI, cloud architecture, and scalable system design",
      color: "text-red-600 dark:text-red-400"
    }
  ];

  const skills = [
    { category: "Languages", items: ["TypeScript", "Python", "Java", "Go", "Rust", "C++"] },
    { category: "Frontend", items: ["React", "Next.js", "Vue.js", "Angular", "Svelte", "React Native"] },
    { category: "Backend", items: ["Node.js", "Django", "Spring Boot", "FastAPI", "Express.js", "GraphQL"] },
    { category: "Cloud", items: ["AWS", "Google Cloud", "Azure", "Kubernetes", "Docker", "Terraform"] },
    { category: "Databases", items: ["PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Firebase", "DynamoDB"] },
    { category: "AI/ML", items: ["TensorFlow", "PyTorch", "Scikit-learn", "OpenAI GPT", "Computer Vision", "NLP"] }
  ];

  const journey = [
    {
      year: "2024-Present",
      title: "Senior Technology Architect",
      company: "Carelwave Media",
      description: "Leading innovative technology solutions and building next-generation platforms with AI integration.",
      achievements: ["Built voice-controlled portfolio platform", "Implemented advanced security systems", "Created comprehensive testing frameworks"]
    },
    {
      year: "2022-2024",
      title: "Principal Software Engineer",
      company: "Tech Innovation Corp",
      description: "Architected and scaled cloud-native applications serving millions of users globally.",
      achievements: ["Reduced system latency by 75%", "Led team of 15 engineers", "Implemented microservices architecture"]
    },
    {
      year: "2020-2022",
      title: "Senior Full-Stack Developer",
      company: "Digital Solutions Inc",
      description: "Developed enterprise-grade applications with focus on performance and scalability.",
      achievements: ["Built real-time analytics platform", "Mentored junior developers", "Established coding standards"]
    },
    {
      year: "2018-2020",
      title: "Software Engineer",
      company: "Startup Innovations",
      description: "Full-stack development in fast-paced startup environment with cutting-edge technologies.",
      achievements: ["Developed MVP from scratch", "Implemented CI/CD pipeline", "Built mobile applications"]
    }
  ];

  const personalInfo = {
    location: "San Francisco, CA",
    email: "akshay@carelwavemedia.com",
    phone: "+1 (555) 123-4567",
    linkedin: "linkedin.com/in/akshay-verma-tech",
    github: "github.com/akshayverma",
    twitter: "@akshayverma_dev"
  };

  const interests = [
    { icon: <Coffee className="w-5 h-5" />, text: "Coffee Connoisseur" },
    { icon: <BookOpen className="w-5 h-5" />, text: "Tech Blogger" },
    { icon: <Heart className="w-5 h-5" />, text: "Open Source Contributor" },
    { icon: <Users className="w-5 h-5" />, text: "Community Building" },
    { icon: <Zap className="w-5 h-5" />, text: "Innovation Enthusiast" },
    { icon: <Globe className="w-5 h-5" />, text: "Digital Nomad" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-all duration-500">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-flow opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center mb-16">
              <div className="relative inline-block mb-8">
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-flow">
                  <img 
                    src="/images/akshay.png" 
                    alt="Akshay Verma"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
                          <rect width="192" height="192" fill="#667eea"/>
                          <text x="96" y="120" font-family="Arial" font-size="72" fill="white" text-anchor="middle">AV</text>
                        </svg>
                      `)}`;
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gradient-flow mb-6">
                Akshay Verma
              </h1>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  Technology Architect
                </span>
                <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                  Innovation Leader
                </span>
                <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                  Full-Stack Expert
                </span>
              </div>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Passionate technology architect with 10+ years of experience building scalable, 
                innovative solutions that impact millions of users worldwide. Specializing in AI integration, 
                cloud architecture, and cutting-edge web technologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>{personalInfo.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <a href={`mailto:${personalInfo.email}`} className="hover:text-blue-600 transition-colors">
                {personalInfo.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              <a href={`tel:${personalInfo.phone}`} className="hover:text-blue-600 transition-colors">
                {personalInfo.phone}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href={`https://${personalInfo.linkedin}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href={`https://${personalInfo.github}`} className="text-gray-600 hover:text-gray-800 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href={`https://twitter.com/${personalInfo.twitter.replace('@', '')}`} className="text-blue-400 hover:text-blue-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Key Achievements
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A track record of delivering exceptional results and driving innovation across the technology landscape.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <div 
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-l-4 border-gradient-flow ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`${achievement.color} mb-4`}>
                  {achievement.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {achievement.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Journey */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Professional Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A decade of growth, innovation, and leadership in the technology industry.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-flow rounded-full"></div>
            
            <div className="space-y-12">
              {journey.map((position, index) => (
                <div 
                  key={index}
                  className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`w-full max-w-md ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                        {position.year}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {position.title}
                      </h3>
                      <div className="text-purple-600 dark:text-purple-400 font-medium mb-3">
                        {position.company}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {position.description}
                      </p>
                      <div className="space-y-2">
                        {position.achievements.map((achievement, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {achievement}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-gray-800"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Expertise */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Skills & Expertise
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Mastery across the full technology stack with focus on cutting-edge innovations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skillGroup, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Interests */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Beyond Code
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              When not architecting the future of technology, I enjoy exploring life's other passions.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {interests.map((interest, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-blue-600 dark:text-blue-400">
                  {interest.icon}
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {interest.text}
                </span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
              "Technology is not just my profession—it's my passion. I believe in building solutions that not only solve problems 
              but inspire and empower others to create a better tomorrow. Every line of code is an opportunity to make a positive impact."
            </p>
            <div className="text-2xl font-bold text-gradient-flow">— Akshay Verma</div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-flow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Let's Build Something Amazing Together
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Whether you're looking for technical leadership, innovative solutions, or just want to discuss the latest in technology, 
            I'm always excited to connect with fellow innovators and visionaries.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <ModernButton
              variant="glass"
              size="lg"
              onClick={() => window.location.href = '/contact'}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Get In Touch
            </ModernButton>
            <ModernButton
              variant="glass"
              size="lg"
              onClick={() => window.location.href = '/blog'}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Read My Blog
            </ModernButton>
            <ModernButton
              variant="glass"
              size="lg"
              onClick={() => window.open(personalInfo.linkedin, '_blank')}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Connect on LinkedIn
            </ModernButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutAkshay; 