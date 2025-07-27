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

export { firebaseReviewsService as reviewsService } from './firebase/reviews.service'; 