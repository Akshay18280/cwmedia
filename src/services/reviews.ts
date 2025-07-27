import type { Review } from './auth';

export interface ReviewSubmission {
  content: string;
  rating: number;
}

export interface ReviewWithUser extends Review {
  user?: {
    name: string;
    email: string;
    company?: string;
    position?: string;
  };
}

export const reviewsService = {
  // Submit a review (user must be authenticated)
  async submitReview(): Promise<{ success: boolean; message: string; error?: string }> {
    return { 
      success: false, 
      message: 'Review system is being updated. Please try again later.' 
    };
  },

  // Get approved reviews for display
  async getApprovedReviews(): Promise<Review[]> {
    return [];
  },

  // Get pending reviews (admin only)
  async getPendingReviews(): Promise<ReviewWithUser[]> {
    return [];
  },

  // Get all reviews with status (admin only)
  async getAllReviews(): Promise<ReviewWithUser[]> {
    return [];
  },

  // Approve review (admin only)
  async approveReview(): Promise<{ success: boolean; message: string; error?: string }> {
    return { success: false, message: 'Review system is being updated' };
  },

  // Reject review (admin only)
  async rejectReview(): Promise<{ success: boolean; message: string; error?: string }> {
    return { success: false, message: 'Review system is being updated' };
  },

  // Get user's own review
  async getUserReview(): Promise<Review | null> {
    return null;
  },

  // Get review statistics
  async getReviewStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageRating: number;
  }> {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      averageRating: 0
    };
  }
}; 