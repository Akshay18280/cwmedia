import React, { useState } from 'react';
import { X, User, Shield } from 'lucide-react';
import SocialLogin from './SocialLogin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
  defaultView?: 'user' | 'admin';
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  defaultView = 'user' 
}: AuthModalProps) {
  const [currentView, setCurrentView] = useState<'user' | 'admin'>(defaultView);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl relative">
        {/* Header with tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setCurrentView('user')}
            className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium rounded-tl-2xl transition-colors ${
              currentView === 'user'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            User Login
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium rounded-tr-2xl transition-colors ${
              currentView === 'admin'
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-b-2 border-orange-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin Login
          </button>
        </div>

        {/* Content */}
        <div className="relative">
          <SocialLogin
            onLoginSuccess={onLoginSuccess}
            onClose={onClose}
            showAdminLogin={currentView === 'admin'}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 