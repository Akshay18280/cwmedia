import React, { useState, useEffect } from "react";
import { Github, Linkedin, Mail, Award, Users, TrendingUp, Code, Server, Cloud, Trophy, MessageSquare } from "lucide-react";
import ReviewCard from "../components/ReviewCard";
import ReviewSubmission from "../components/ReviewSubmission";
import { reviewsService } from "../services/reviews";
import type { FirebaseReview } from "../types/firebase";

export default function About() {
  const [reviews, setReviews] = useState<FirebaseReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const approvedReviews = await reviewsService.getApprovedReviews(6); // Limit to 6 reviews
      setReviews(approvedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleReviewSubmitted = () => {
    // Refresh reviews after successful submission
    loadReviews();
  };

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
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">The Growth</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Took ownership of critical microservices handling millions of events daily. Led infrastructure optimization initiatives that reduced costs by 50% while improving performance. Became the go-to person for complex system design challenges.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
              <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">The Impact</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Today, I architect and maintain systems serving millions of users globally. My work contributes to 99.99% uptime, and I actively mentor teams while leading technical initiatives. Building the future, one system at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Skills & Expertise */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">Technical Expertise</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {coreSkills.map((skill, index) => {
              const IconComponent = skill.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{skill.name}</h3>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    {skill.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">Key Achievements</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {achievements.map((achievement, index) => (
            <div key={index} className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                {achievement.metric}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {achievement.label}
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                {achievement.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Reviews */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Professional Reviews
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Verified professionals share their experience working with Akshay. All reviews are authenticated and moderated.
            </p>
          </div>
          
          {isLoadingReviews ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to share your professional experience working with Akshay.
              </p>
            </div>
          )}
          
          <div className="text-center">
            <button 
              onClick={() => setShowReviewForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Write a Review
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Reviews are moderated and verified before publication
            </p>
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

      {/* Review Submission Modal */}
      {showReviewForm && (
        <ReviewSubmission 
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSubmitted}
        />
      )}
    </main>
  );
}
