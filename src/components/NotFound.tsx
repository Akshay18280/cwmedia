import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search, BookOpen, Mail } from 'lucide-react';
import SEO from './SEO';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const suggestedLinks = [
    { 
      to: '/', 
      icon: Home, 
      title: 'Home', 
      description: 'Go back to the homepage' 
    },
    { 
      to: '/blog', 
      icon: BookOpen, 
      title: 'Blog', 
      description: 'Read our latest articles' 
    },
    { 
      to: '/about', 
      icon: Mail, 
      title: 'About', 
      description: 'Learn more about Akshay' 
    }
  ];

  return (
    <>
      <SEO
        title="Page Not Found - Carelwave Media"
        description="The page you're looking for doesn't exist. Explore our blog articles or learn more about Akshay Verma."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
              404
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl rounded-full animate-ping"></div>
              <Search className="relative w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 animate-bounce" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Page Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Oops! The page you're looking for seems to have wandered off into the digital void.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't worry, even the best developers encounter 404s sometimes!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-12">
            <button
              onClick={handleGoBack}
              className="group w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
            
            <Link
              to="/"
              className="group w-full inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700"
            >
              <Home className="w-5 h-5 mr-2" />
              Home Page
            </Link>
          </div>

          {/* Suggested Links */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Explore Instead
            </h2>
            <div className="space-y-3">
              {suggestedLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <link.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {link.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {link.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Fun Footer */}
          <div className="mt-8 text-xs text-gray-400 dark:text-gray-500">
            Lost? That's okay - even GPS gets confused sometimes! 🗺️
          </div>
        </div>
      </div>
    </>
  );
} 