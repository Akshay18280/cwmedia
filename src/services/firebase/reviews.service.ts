import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FirebaseReview, FirestoreDocument } from '../../types/firebase';

// Convert Firebase review to app format
const convertFirebaseReview = (doc: FirestoreDocument<any>): FirebaseReview => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    content: data.content,
    rating: data.rating,
    reviewerName: data.reviewerName,
    reviewerEmail: data.reviewerEmail,
    reviewerPosition: data.reviewerPosition,
    reviewerCompany: data.reviewerCompany,
    reviewerImage: data.reviewerImage,
    reviewerLinkedInUrl: data.reviewerLinkedInUrl,
    workRelationship: data.workRelationship,
    skills: data.skills || [],
    projectsWorkedOn: data.projectsWorkedOn || [],
    verified: data.verified || false,
    status: data.status,
    submittedAt: data.submittedAt,
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy,
    moderatorNotes: data.moderatorNotes
  };
};

class FirebaseReviewsService {
  private collection = collection(db, 'reviews');

  // Submit a new review (requires authentication)
  async submitReview(review: {
    userId: string;
    reviewerName: string;
    reviewerEmail: string;
    reviewerPosition: string;
    reviewerCompany: string;
    reviewerLinkedInUrl?: string;
    reviewerImage?: string;
    rating: number;
    title: string;
    content: string;
    workRelationship: string;
    projectsWorkedOn?: string[];
    skills?: string[];
  }): Promise<string> {
    try {
      // Check if user already submitted a review
      const existingReviewQuery = query(
        this.collection,
        where('userId', '==', review.userId)
      );
      const existingReviews = await getDocs(existingReviewQuery);
      
      if (!existingReviews.empty) {
        throw new Error('You have already submitted a review. Reviews cannot be edited or deleted once submitted.');
      }

      const reviewData = {
        ...review,
        submittedAt: serverTimestamp(),
        status: 'pending' as const,
        verified: review.reviewerLinkedInUrl ? true : false,
        reviewedAt: null,
        reviewedBy: null,
        moderatorNotes: null
      };

      const docRef = await addDoc(this.collection, reviewData);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Get approved reviews for public display
  async getApprovedReviews(limitCount = 20): Promise<FirebaseReview[]> {
    try {
      const q = query(
        this.collection,
        where('status', '==', 'approved'),
        orderBy('reviewedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirebaseReview);
    } catch (error) {
      console.error('Error fetching approved reviews:', error);
      return [];
    }
  }

  // Get pending reviews for admin approval
  async getPendingReviews(): Promise<FirebaseReview[]> {
    try {
      const q = query(
        this.collection,
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirebaseReview);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      return [];
    }
  }

  // Get all reviews for admin (all statuses)
  async getAllReviews(): Promise<FirebaseReview[]> {
    try {
      const q = query(
        this.collection,
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirebaseReview);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return [];
    }
  }

  // Approve a review (admin only)
  async approveReview(reviewId: string, adminId: string, moderatorNotes?: string): Promise<void> {
    try {
      const reviewRef = doc(this.collection, reviewId);
      await updateDoc(reviewRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        moderatorNotes: moderatorNotes || null
      });
    } catch (error) {
      console.error('Error approving review:', error);
      throw error;
    }
  }

  // Reject a review (admin only)
  async rejectReview(reviewId: string, adminId: string, moderatorNotes: string): Promise<void> {
    try {
      const reviewRef = doc(this.collection, reviewId);
      await updateDoc(reviewRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        moderatorNotes
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      throw error;
    }
  }

  // Get a specific review by ID
  async getReviewById(reviewId: string): Promise<FirebaseReview | null> {
    try {
      const reviewRef = doc(this.collection, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        return convertFirebaseReview(reviewDoc);
      }
      return null;
    } catch (error) {
      console.error('Error fetching review:', error);
      return null;
    }
  }

  // Check if user already submitted a review
  async hasUserSubmittedReview(userId: string): Promise<boolean> {
    try {
      const q = query(
        this.collection,
        where('userId', '==', userId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user review status:', error);
      return false;
    }
  }

  // Get review statistics for admin dashboard
  async getReviewStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    averageRating: number;
  }> {
    try {
      const allReviews = await this.getAllReviews();
      const approved = allReviews.filter(r => r.status === 'approved');
      const pending = allReviews.filter(r => r.status === 'pending');
      const rejected = allReviews.filter(r => r.status === 'rejected');
      
      const averageRating = approved.length > 0 
        ? approved.reduce((sum, review) => sum + review.rating, 0) / approved.length 
        : 0;

      return {
        total: allReviews.length,
        approved: approved.length,
        pending: pending.length,
        rejected: rejected.length,
        averageRating: Math.round(averageRating * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        averageRating: 0
      };
    }
  }
}

export const firebaseReviewsService = new FirebaseReviewsService(); 