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
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FirebaseNewsletter, CreateFirebaseNewsletter } from '../../types/firebase';

class FirebaseNewsletterService {
  private readonly collection = collection(db, 'newsletters');

  // Email validation
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate unsubscribe token
  private generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Subscribe to newsletter
  async subscribe(
    email: string, 
    preferences: { weekly: boolean; marketing: boolean } = { weekly: true, marketing: false }
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      if (!this.validateEmail(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address'
        };
      }

      // Check if already subscribed
      const existingQuery = query(this.collection, where('email', '==', email));
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data() as FirebaseNewsletter;

        if (existingData.status === 'active') {
          return {
            success: false,
            message: 'This email is already subscribed to our newsletter'
          };
        }

        // Reactivate subscription
        await updateDoc(doc(this.collection, existingDoc.id), {
          status: 'active',
          preferences,
          subscriptionDate: Timestamp.now(),
          unsubscribeToken: this.generateUnsubscribeToken()
        });

        return {
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        };
      }

      // Create new subscription
      const subscriptionData: CreateFirebaseNewsletter = {
        email,
        status: 'active',
        preferences,
        unsubscribeToken: this.generateUnsubscribeToken()
      };

      await addDoc(this.collection, {
        ...subscriptionData,
        subscriptionDate: Timestamp.now()
      });

      // Send welcome email (to be implemented with Firebase Functions)
      this.sendWelcomeEmail(email);

      return {
        success: true,
        message: 'Successfully subscribed! Check your email for confirmation.'
      };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      return {
        success: false,
        message: 'Failed to subscribe. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Unsubscribe from newsletter
  async unsubscribe(email: string, token?: string): Promise<{ success: boolean; message: string }> {
    try {
      const q = query(this.collection, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          message: 'Email not found in our subscribers list'
        };
      }

      const subscriptionDoc = querySnapshot.docs[0];
      const subscriptionData = subscriptionDoc.data() as FirebaseNewsletter;

      // Verify token if provided
      if (token && subscriptionData.unsubscribeToken !== token) {
        return {
          success: false,
          message: 'Invalid unsubscribe token'
        };
      }

      await updateDoc(doc(this.collection, subscriptionDoc.id), {
        status: 'unsubscribed',
        unsubscribeToken: null
      });

      return {
        success: true,
        message: 'Successfully unsubscribed from the newsletter'
      };
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe. Please try again later.'
      };
    }
  }

  // Get newsletter statistics
  async getStats(): Promise<{
    totalSubscribers: number;
    activeSubscribers: number;
    unsubscribed: number;
    weeklyPreference: number;
    marketingPreference: number;
  }> {
    try {
      const querySnapshot = await getDocs(this.collection);
      const subscribers = querySnapshot.docs.map(doc => doc.data() as FirebaseNewsletter);

      const activeSubscribers = subscribers.filter(sub => sub.status === 'active');
      const unsubscribed = subscribers.filter(sub => sub.status === 'unsubscribed');
      const weeklyPreference = activeSubscribers.filter(sub => sub.preferences.weekly);
      const marketingPreference = activeSubscribers.filter(sub => sub.preferences.marketing);

      return {
        totalSubscribers: subscribers.length,
        activeSubscribers: activeSubscribers.length,
        unsubscribed: unsubscribed.length,
        weeklyPreference: weeklyPreference.length,
        marketingPreference: marketingPreference.length
      };
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        unsubscribed: 0,
        weeklyPreference: 0,
        marketingPreference: 0
      };
    }
  }

  // Get active subscribers
  async getActiveSubscribers(): Promise<FirebaseNewsletter[]> {
    try {
      const q = query(
        this.collection,
        where('status', '==', 'active'),
        orderBy('subscriptionDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseNewsletter));
    } catch (error) {
      console.error('Error getting active subscribers:', error);
      return [];
    }
  }

  // Get subscribers with weekly preference
  async getWeeklySubscribers(): Promise<FirebaseNewsletter[]> {
    try {
      const q = query(
        this.collection,
        where('status', '==', 'active'),
        where('preferences.weekly', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseNewsletter));
    } catch (error) {
      console.error('Error getting weekly subscribers:', error);
      return [];
    }
  }

  // Get subscribers with marketing preference
  async getMarketingSubscribers(): Promise<FirebaseNewsletter[]> {
    try {
      const q = query(
        this.collection,
        where('status', '==', 'active'),
        where('preferences.marketing', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseNewsletter));
    } catch (error) {
      console.error('Error getting marketing subscribers:', error);
      return [];
    }
  }

  // Send welcome email (placeholder for Firebase Functions)
  private async sendWelcomeEmail(email: string): Promise<void> {
    try {
      // This would typically be handled by a Firebase Function
      // For now, we'll log it and implement the function separately
      console.log(`Welcome email should be sent to: ${email}`);
      
      // In production, you would call a Firebase Function like this:
      // const sendEmail = httpsCallable(functions, 'sendWelcomeEmail');
      // await sendEmail({ email });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  // Notify subscribers of new post (placeholder for Firebase Functions)
  async notifyNewPost(postId: string, postTitle: string): Promise<void> {
    try {
      console.log(`New post notification should be sent for: ${postTitle} (${postId})`);
      
      // In production, you would call a Firebase Function like this:
      // const notifySubscribers = httpsCallable(functions, 'notifyNewPost');
      // await notifySubscribers({ postId, postTitle });
    } catch (error) {
      console.error('Error notifying subscribers:', error);
    }
  }

  // Generate unsubscribe URL
  generateUnsubscribeUrl(email: string, token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
  }
}

export const firebaseNewsletterService = new FirebaseNewsletterService(); 