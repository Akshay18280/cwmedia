import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  FileText, 
  Mail, 
  MapPin,
  ExternalLink,
  Lightbulb,
  Clock,
  TrendingUp
} from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRedirecting(true);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleStopRedirect = () => {
    setCountdown(0);
  };

  const popularPages = [
    {
      title: 'System Design Fundamentals',
      path: '/blog/system-design-fundamentals',
      icon: <FileText className="w-5 h-5" />,
      description: 'Learn the basics of scalable system architecture'
    },
    {
      title: 'Microservices Architecture',
      path: '/blog/microservices-architecture',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Building distributed systems with microservices'
    },
    {
      title: 'About Akshay Verma',
      path: '/about',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Learn about my experience and expertise'
    },
    {
      title: 'Latest Blog Posts',
      path: '/blog',
      icon: <FileText className="w-5 h-5" />,
      description: 'Read the latest tech insights and tutorials'
    }
  ];

  const quickActions = [
    {
      title: 'Go Home',
      path: '/',
      icon: <Home className="w-5 h-5" />,
      color: 'bg-accent-primary hover:bg-accent-primary-light text-white',
      description: 'Return to the homepage'
    },
    {
      title: 'Browse Articles',
      path: '/blog',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-green-600 hover:bg-green-700 text-white',
      description: 'Explore our technical content'
    },
    {
      title: 'Contact Us',
      path: '/contact',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-accent-primary hover:bg-purple-700 text-white',
      description: 'Get in touch for collaboration'
    }
  ];

  const suggestions = [
    'The URL might contain a typo',
    'The page may have been moved or renamed',
    'The link might be outdated',
    'You might not have permission to access this page'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        
        {/* Main 404 Content */}
        <div className="text-center mb-12">
          
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text animate-bounce-gentle">
              404
            </div>
            <div className="absolute inset-0 text-9xl font-bold text-white/70 dark:text-accent-primary -z-10 transform translate-x-2 translate-y-2">
              404
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-headline md:text-5xl font-bold text-high-contrast mb-4">
            Page Not Found
          </h1>
          
          <p className="text-body-lg text-medium-contrast mb-6 max-w-2xl mx-auto leading-relaxed">
            Oops! The page you're looking for seems to have vanished into the digital void. 
            But don't worry - we're here to help you find your way back!
          </p>

          {/* Current URL Info */}
          <div className="bg-medium-contrast rounded-xl p-4 border border-low-contrast mb-8 max-w-2xl mx-auto">
            <div className="flex items-center text-body-sm text-medium-contrast">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="font-medium mr-2">Requested URL:</span>
              <code className="bg-low-contrast px-2 py-1 rounded text-caption break-all">
                {location.pathname}
              </code>
            </div>
          </div>

          {/* Auto-redirect Notice */}
          {countdown > 0 && !isRedirecting && (
            <div className="bg-accent-primary/5 dark:bg-accent-primary/20/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center text-accent-primary dark:text-white/70 mb-2">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-medium">Auto-redirecting in {countdown} seconds</span>
              </div>
              <button
                onClick={handleStopRedirect}
                className="text-body-sm text-accent-primary dark:text-accent-primary-light hover:text-accent-primary dark:hover:accent-primary-light transition-colors"
              >
                Cancel redirect
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for articles, topics..."
                  className="w-full pl-10 pr-4 py-3 border border-medium-contrast rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent dark:bg-gray-700 dark:text-white bg-white shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-accent-primary text-white rounded-md hover:bg-accent-primary-light transition-colors text-body-sm font-medium"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <Link
              key={action.path}
              to={action.path}
              className={`${action.color} rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 text-center group`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-center mb-3">
                {action.icon}
              </div>
              <h3 className="text-body font-semibold mb-2">{action.title}</h3>
              <p className="text-body-sm opacity-90">{action.description}</p>
            </Link>
          ))}
        </div>

        {/* Popular Pages */}
        <div className="bg-medium-contrast rounded-2xl p-8 shadow-xl border border-low-contrast mb-12">
          <div className="flex items-center mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-500 mr-3" />
            <h2 className="text-subtitle font-bold text-high-contrast">
              Popular Pages
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularPages.map((page, index) => (
              <Link
                key={page.path}
                to={page.path}
                className="flex items-start p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group"
              >
                <div className="flex-shrink-0 mr-4 mt-1">
                  <div className="p-2 bg-accent-primary/10 dark:bg-accent-primary/20/30 rounded-lg text-accent-primary dark:text-accent-primary-light group-hover:scale-110 transition-transform duration-200">
                    {page.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-high-contrast mb-1 group-hover:text-accent-primary dark:group-hover:text-accent-primary-light transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-body-sm text-medium-contrast">
                    {page.description}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-accent-primary dark:group-hover:text-accent-primary-light opacity-0 group-hover:opacity-100 transition-all duration-200" />
              </Link>
            ))}
          </div>
        </div>

        {/* Helpful Suggestions */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-8">
          <h3 className="text-body font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
            💡 Why might this have happened?
          </h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start text-yellow-700 dark:text-yellow-300">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-body-sm">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Back Navigation */}
        <div className="text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-6 py-3 border border-medium-contrast rounded-lg text-high-contrast hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-body-sm text-low-contrast">
            🚀 Still can't find what you're looking for?{' '}
            <Link 
              to="/contact" 
              className="text-accent-primary dark:text-accent-primary-light hover:underline font-medium"
            >
              Contact us
            </Link>
            {' '}and we'll help you out!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 