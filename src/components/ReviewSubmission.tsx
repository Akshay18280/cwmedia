import React, { useState, useEffect } from 'react';
import { Star, Linkedin, User, Building, Mail, FileText, Users, Code, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { reviewsService } from '../services/reviews';
import { authService } from '../services/auth';
import { toast } from 'sonner';

interface ReviewSubmissionProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewSubmission({ onClose, onSuccess }: ReviewSubmissionProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
    workRelationship: 'colleague',
    projectsWorkedOn: '',
    skills: '',
    userPosition: '',
    userCompany: ''
  });

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      setIsCheckingUser(true);
      const user = await authService.getCurrentUser();
      
      if (user) {
        setCurrentUser(user);
        
        // Check if user already submitted a review
        const hasReview = await reviewsService.hasUserSubmittedReview(user.id);
        setHasSubmittedReview(hasReview);
        
        // Pre-fill form with user data if available
        if (user.name) {
          setFormData(prev => ({
            ...prev,
            userPosition: user.position || '',
            userCompany: user.company || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      setIsLoading(true);
      await authService.loginWithLinkedIn();
      await checkCurrentUser();
      toast.success('Successfully authenticated with LinkedIn!');
    } catch (error) {
      console.error('LinkedIn login error:', error);
      toast.error('LinkedIn authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await authService.loginWithGoogle();
      await checkCurrentUser();
      toast.success('Successfully authenticated with Google!');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please authenticate first');
      return;
    }

    if (hasSubmittedReview) {
      toast.error('You have already submitted a review');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const reviewData = {
        userId: currentUser.id,
        reviewerName: currentUser.name || 'Anonymous User',
        reviewerEmail: currentUser.email || '',
        reviewerPosition: formData.userPosition,
        reviewerCompany: formData.userCompany,
        reviewerLinkedInUrl: currentUser.linkedInUrl || undefined,
        reviewerImage: currentUser.profilePicture || undefined,
        rating: formData.rating,
        title: formData.title.trim(),
        content: formData.content.trim(),
        workRelationship: formData.workRelationship,
        projectsWorkedOn: formData.projectsWorkedOn 
          ? formData.projectsWorkedOn.split(',').map(p => p.trim()).filter(Boolean)
          : [],
        skills: formData.skills 
          ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
          : []
      };

      await reviewsService.submitReview(reviewData);
      
      toast.success('Review submitted successfully! It will be published after admin approval.');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={24}
        className={`cursor-pointer transition-colors ${
          i < formData.rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
        }`}
        onClick={() => setFormData(prev => ({ ...prev, rating: i + 1 }))}
      />
    ));
  };

  if (isCheckingUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Write a Professional Review
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Authentication Required */}
          {!currentUser && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Authentication Required
                </h3>
              </div>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Please authenticate with LinkedIn or Google to submit a verified professional review.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLinkedInLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Linkedin size={20} />
                  <span>Continue with LinkedIn</span>
                </button>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          )}

          {/* Already Submitted */}
          {currentUser && hasSubmittedReview && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Review Already Submitted
                  </h3>
                  <p className="text-green-800 dark:text-green-200">
                    You have already submitted a professional review. Reviews cannot be edited or deleted once submitted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Review Form */}
          {currentUser && !hasSubmittedReview && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info Display */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Submitting as:
                </h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-accent-primary font-semibold text-lg">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Position *
                  </label>
                  <input
                    type="text"
                    value={formData.userPosition}
                    onChange={(e) => setFormData(prev => ({ ...prev, userPosition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formData.userCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, userCompany: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Tech Company Inc."
                    required
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-1">
                  {renderStars()}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({formData.rating}/5)
                  </span>
                </div>
              </div>

              {/* Work Relationship */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Relationship *
                </label>
                <select
                  value={formData.workRelationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, workRelationship: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="colleague">Colleague</option>
                  <option value="direct_report">Direct Report</option>
                  <option value="manager">Manager</option>
                  <option value="client">Client</option>
                  <option value="vendor">Vendor/Partner</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Excellent developer with strong technical skills"
                  maxLength={100}
                  required
                />
              </div>

              {/* Review Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Share your experience working with Akshay. What stood out about their work, skills, or collaboration style?"
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.content.length}/1000 characters
                </p>
              </div>

              {/* Projects Worked On */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Projects Worked On (Optional)
                </label>
                <input
                  type="text"
                  value={formData.projectsWorkedOn}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectsWorkedOn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Project Alpha, Backend Redesign, API Migration (comma-separated)"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills Observed (Optional)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Golang, AWS, Leadership, Problem Solving (comma-separated)"
                />
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Reviews are moderated and verified before publication</li>
                      <li>You can only submit one review per account</li>
                      <li>Reviews cannot be edited or deleted once submitted</li>
                      <li>False or misleading reviews will be rejected</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                  <span>{isLoading ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 