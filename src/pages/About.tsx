import React from "react";
import { Github, Linkedin, Mail, Award, Users, TrendingUp, Code, Server, Cloud, Trophy, MessageSquare } from "lucide-react";

export default function About() {
  const coreSkills = [
    { name: "Golang", icon: Code, level: "Expert" },
    { name: "AWS", icon: Cloud, level: "Advanced" },
    { name: "Terraform", icon: Server, level: "Advanced" },
    { name: "Kubernetes", icon: Server, level: "Intermediate" },
    { name: "Docker", icon: Server, level: "Advanced" },
    { name: "DevOps", icon: TrendingUp, level: "Advanced" },
  ];

  const achievements = [
    { metric: "50%+", label: "Cost Reduction", description: "Multi BU Infrastructure optimization" },
    { metric: "Millions", label: "Events Handled", description: "High-throughput microservices" },
    { metric: "99.99%", label: "System Uptime", description: "Production support excellence" },
    { metric: "Team", label: "Leadership", description: "CSI Chairperson & Mentor" },
  ];

  return (
    <main className="font-sans bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="space-y-4 animate-fade-in">
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
                  Hi, I'm <span className="text-yellow-300">Akshay</span>
                </h1>
                <p className="text-xl lg:text-2xl font-light text-blue-100 max-w-2xl">
                  Building scalable systems that power millions of users across the globe
                </p>
                <p className="text-lg text-blue-200 max-w-2xl">
                  Software Development Engineer at CSG International, specializing in high-performance microservices and cloud infrastructure
                </p>
              </div>
              <div className="flex justify-center lg:justify-start space-x-6 pt-4">
                <a 
                  href="mailto:akshayvermajan28@gmail.com" 
                  className="flex items-center space-x-2 hover:text-yellow-300 transition-colors duration-200"
                  aria-label="Email Akshay Verma"
                >
                  <Mail size={24} />
                  <span className="hidden sm:inline">Email</span>
                </a>
                <a 
                  href="https://github.com/Akshay18280" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 hover:text-yellow-300 transition-colors duration-200"
                  aria-label="Akshay's GitHub profile"
                >
                  <Github size={24} />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <a 
                  href="https://linkedin.com/in/akshay-verma-024aa0152/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 hover:text-yellow-300 transition-colors duration-200"
                  aria-label="Akshay's LinkedIn profile"
                >
                  <Linkedin size={24} />
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/images/akshay.png"
                alt="Akshay Verma - Software Development Engineer"
                className="w-64 h-64 lg:w-80 lg:h-80 rounded-full shadow-2xl border-4 border-white/20 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* My Journey - STAR Method */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">My Journey</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">The Beginning</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Started as an intern at CSG International with a passion for building scalable systems. Quickly immersed myself in telecom infrastructure, learning to handle millions of real-time events and complex rating algorithms.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
              <Code className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Taking Action</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Built production-ready microservices in Golang, automated critical DevOps processes, and architected Multi-BU infrastructure. Led initiatives in mentoring junior developers and implementing robust monitoring solutions with Grafana and CloudWatch.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Making Impact</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Achieved 50%+ cost reduction through infrastructure optimization, enhanced system performance to handle millions of events, and received the Q3 2023 Team Spotlight Excellence Award. Now leading technical initiatives and mentoring the next generation of engineers.
            </p>
          </div>
        </div>
      </section>

      {/* Skills & Expertise */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">Core Expertise</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {coreSkills.map((skill, index) => (
              <div 
                key={skill.name} 
                className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <skill.icon className="w-8 h-8 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{skill.name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{skill.level}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">Key Achievements</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {achievements.map((achievement, index) => (
            <div 
              key={index} 
              className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{achievement.metric}</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{achievement.label}</div>
              <div className="text-gray-600 dark:text-gray-300">{achievement.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recognition & Awards */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12 text-gray-900 dark:text-white">Recognition & Awards</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-8 border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Award className="w-6 h-6 mr-3 text-yellow-600" />
                Recognition & Awards
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">CSG Excellence Award</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Recognized for exceptional performance and leadership in API development (2024)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Team Leadership</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Successfully led cross-functional teams in delivering critical infrastructure projects
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Reviews - Real testimonials from verified professionals */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
                Professional Testimonials
              </h3>
              
              <div id="reviews-section">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Professional Reviews Coming Soon
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Verified professionals from LinkedIn and other platforms can share their experience working with Akshay.
                  </p>
                  <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Write a Review
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Reviews are moderated and verified before publication
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-20 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Let's Build Something Amazing</h2>
          <p className="text-xl mb-8 text-blue-100">
            Ready to collaborate on your next project or discuss exciting opportunities in scalable systems architecture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:akshayvermajan28@gmail.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Me
            </a>
            <a
              href="https://linkedin.com/in/akshay-verma-024aa0152/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
            >
              <Linkedin className="w-5 h-5 mr-2" />
              Let's Connect
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
