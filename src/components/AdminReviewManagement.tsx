import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Clock, Star, MessageSquare, User, Calendar, AlertCircle } from 'lucide-react';
import { reviewsService } from '../services/reviews';
import { authService } from '../services/auth';
import { toast } from 'sonner';
import type { FirebaseReview } from '../types/firebase';

export default function AdminReviewManagement() {
  const [reviews, setReviews] = useState<FirebaseReview[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 0
  });
  const [selectedReview, setSelectedReview] = useState<FirebaseReview | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      let reviewsData: FirebaseReview[] = [];
      
      switch (filter) {
        case 'pending':
          reviewsData = await reviewsService.getPendingReviews();
          break;
        case 'approved':
          reviewsData = await reviewsService.getApprovedReviews(50);
          break;
        case 'all':
          reviewsData = await reviewsService.getAllReviews();
          break;
        default:
          reviewsData = await reviewsService.getAllReviews();
          reviewsData = reviewsData.filter(r => r.status === filter);
      }
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await reviewsService.getReviewStats();
      setReviewStats(stats);
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      setIsProcessing(true);
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        toast.error('Not authenticated');
        return;
      }

      await reviewsService.approveReview(reviewId, currentUser.id, moderatorNotes);
      toast.success('Review approved successfully');
      setSelectedReview(null);
      setModeratorNotes('');
      loadReviews();
      loadStats();
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!moderatorNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        toast.error('Not authenticated');
        return;
      }

      await reviewsService.rejectReview(reviewId, currentUser.id, moderatorNotes);
      toast.success('Review rejected successfully');
      setSelectedReview(null);
      setModeratorNotes('');
      loadReviews();
      loadStats();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Review Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {reviewStats.total}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">Total Reviews</div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {reviewStats.pending}
            </div>
            <div className="text-sm text-yellow-800 dark:text-yellow-300">Pending</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {reviewStats.approved}
            </div>
            <div className="text-sm text-green-800 dark:text-green-300">Approved</div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {reviewStats.rejected}
            </div>
            <div className="text-sm text-red-800 dark:text-red-300">Rejected</div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {reviewStats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-300">Avg Rating</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No reviews found for this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={review.reviewerImage || 'https://via.placeholder.com/48'}
                      alt={review.reviewerName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {review.reviewerName}
                        </h3>
                        {review.verified && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {review.reviewerPosition} at {review.reviewerCompany}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Review Details"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {review.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                    {review.content}
                  </p>
                  
                  {(review.skills && review.skills.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {review.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {review.skills.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{review.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {review.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setModeratorNotes('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setModeratorNotes('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Review Details
                </h3>
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setModeratorNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Reviewer Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedReview.reviewerImage || 'https://via.placeholder.com/64'}
                    alt={selectedReview.reviewerName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {selectedReview.reviewerName}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedReview.reviewerPosition} at {selectedReview.reviewerCompany}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReview.reviewerEmail}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(selectedReview.rating)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReview.status)}`}>
                        {selectedReview.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    {selectedReview.title}
                  </h5>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedReview.content}
                  </p>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Work Relationship:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedReview.workRelationship}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedReview.submittedAt)}
                    </p>
                  </div>
                </div>

                {/* Skills & Projects */}
                {selectedReview.skills && selectedReview.skills.length > 0 && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedReview.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReview.projectsWorkedOn && selectedReview.projectsWorkedOn.length > 0 && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Projects:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {selectedReview.projectsWorkedOn.join(', ')}
                    </p>
                  </div>
                )}

                {/* Moderator Notes */}
                {selectedReview.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moderator Notes (Optional for approval, required for rejection)
                    </label>
                    <textarea
                      value={moderatorNotes}
                      onChange={(e) => setModeratorNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                )}

                {/* Previous moderator notes */}
                {selectedReview.moderatorNotes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Moderator Notes
                      </span>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {selectedReview.moderatorNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedReview.status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedReview(null);
                        setModeratorNotes('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectReview(selectedReview.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <X size={16} />
                      )}
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApproveReview(selectedReview.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check size={16} />
                      )}
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 