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
  generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
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
      const unsubscribeToken = this.generateUnsubscribeToken();
      const subscriptionData: CreateFirebaseNewsletter = {
        email,
        status: 'active',
        preferences,
        unsubscribeToken
      };

      await addDoc(this.collection, {
        ...subscriptionData,
        subscriptionDate: Timestamp.now()
      });

      // Send welcome email
      this.sendWelcomeEmail(email, unsubscribeToken);

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
  async unsubscribe(token: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      if (!token) {
        return {
          success: false,
          message: 'Invalid unsubscribe token'
        };
      }

      const q = query(this.collection, where('unsubscribeToken', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          message: 'Subscription not found or already unsubscribed'
        };
      }

      const docSnapshot = querySnapshot.docs[0];
      await updateDoc(docSnapshot.ref, {
        status: 'unsubscribed',
        unsubscribedAt: Timestamp.now()
      });

      return {
        success: true,
        message: 'Successfully unsubscribed from newsletter'
      };
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get newsletter statistics
  async getStats(): Promise<{
    total: number;
    active: number;
    unsubscribed: number;
    recent: number;
  }> {
    try {
      // Get all subscribers
      const allSnapshot = await getDocs(this.collection);
      const total = allSnapshot.size;

      // Get active subscribers
      const activeQuery = query(this.collection, where('status', '==', 'active'));
      const activeSnapshot = await getDocs(activeQuery);
      const active = activeSnapshot.size;

      // Get unsubscribed
      const unsubscribedQuery = query(this.collection, where('status', '==', 'unsubscribed'));
      const unsubscribedSnapshot = await getDocs(unsubscribedQuery);
      const unsubscribed = unsubscribedSnapshot.size;

      // Get recent subscribers (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentQuery = query(
        this.collection,
        where('subscriptionDate', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        where('status', '==', 'active')
      );
      const recentSnapshot = await getDocs(recentQuery);
      const recent = recentSnapshot.size;

      return { total, active, unsubscribed, recent };
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      return { total: 0, active: 0, unsubscribed: 0, recent: 0 };
    }
  }

  // Get all subscribers (admin only)
  async getAllSubscribers(): Promise<FirebaseNewsletter[]> {
    try {
      const q = query(this.collection, orderBy('subscriptionDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirebaseNewsletter));
    } catch (error) {
      console.error('Error getting all subscribers:', error);
      return [];
    }
  }

  // Get active subscribers only
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

  // Send welcome email
  private async sendWelcomeEmail(email: string, unsubscribeToken?: string): Promise<void> {
    try {
      // Import email service dynamically to avoid circular dependencies
      const { emailService } = await import('../firebase/email.service');
      
      // Send welcome email using the email service
      const result = await emailService.sendWelcomeEmail(email, unsubscribeToken);
      
      if (result.success) {
        console.log(`✅ Welcome email sent to: ${email}`);
      } else {
        console.error(`❌ Failed to send welcome email to ${email}:`, result.message);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  // Send new post notification to all subscribers
  async notifySubscribersOfNewPost(
    postTitle: string,
    postExcerpt: string,
    postUrl: string
  ): Promise<{
    success: boolean;
    message: string;
    sent: number;
    failed: number;
  }> {
    try {
      // Get all active subscribers
      const activeSubscribers = await this.getActiveSubscribers();
      
      if (activeSubscribers.length === 0) {
        return {
          success: true,
          message: 'No active subscribers to notify',
          sent: 0,
          failed: 0
        };
      }

      // Import email service
      const { emailService } = await import('../firebase/email.service');
      
      let sent = 0;
      let failed = 0;

      // Send notifications to all subscribers
      for (const subscriber of activeSubscribers) {
        try {
          const result = await emailService.sendNewPostNotification(
            subscriber.email,
            postTitle,
            postExcerpt,
            postUrl,
            subscriber.unsubscribeToken
          );

          if (result.success) {
            sent++;
          } else {
            failed++;
            console.error(`Failed to send notification to ${subscriber.email}:`, result.message);
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failed++;
          console.error(`Error sending notification to ${subscriber.email}:`, error);
        }
      }

      return {
        success: sent > 0,
        message: `Notifications sent to ${sent} subscribers, ${failed} failed`,
        sent,
        failed
      };
    } catch (error: any) {
      console.error('Error notifying subscribers:', error);
      return {
        success: false,
        message: 'Failed to notify subscribers',
        sent: 0,
        failed: 1
      };
    }
  }

  // Send bulk newsletter to all subscribers
  async sendBulkNewsletter(
    subject: string,
    content: string
  ): Promise<{
    success: boolean;
    message: string;
    sent: number;
    failed: number;
  }> {
    try {
      // Get all active subscribers
      const activeSubscribers = await this.getActiveSubscribers();
      
      if (activeSubscribers.length === 0) {
        return {
          success: true,
          message: 'No active subscribers',
          sent: 0,
          failed: 0
        };
      }

      // Import email service
      const { emailService } = await import('../firebase/email.service');
      
      // Prepare subscriber data for bulk sending
      const subscriberData = activeSubscribers.map(sub => ({
        email: sub.email,
        unsubscribeToken: sub.unsubscribeToken || ''
      }));

      // Send bulk emails
      const result = await emailService.sendBulkEmails(
        subscriberData,
        subject,
        content
      );

      return result;
    } catch (error: any) {
      console.error('Error sending bulk newsletter:', error);
      return {
        success: false,
        message: 'Failed to send bulk newsletter',
        sent: 0,
        failed: 1
      };
    }
  }
}

export const firebaseNewsletterService = new FirebaseNewsletterService(); 