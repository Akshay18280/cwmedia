import { supabase } from '../lib/supabase';

export interface NewsletterSubscription {
  id: string;
  email: string;
  subscription_date: string;
  status: 'active' | 'unsubscribed';
  preferences: {
    weekly: boolean;
    marketing: boolean;
  };
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribed: number;
  weeklySubscribers: number;
  marketingSubscribers: number;
}

export const newsletterService = {
  // Subscribe to newsletter
  async subscribe(email: string, preferences: { weekly: boolean; marketing: boolean }) {
    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletters')
        .select('*')
        .eq('email', email)
        .single();

      if (existing) {
        if (existing.status === 'unsubscribed') {
          // Reactivate subscription
          const { data, error } = await supabase
            .from('newsletters')
            .update({
              status: 'active',
              preferences,
              subscription_date: new Date().toISOString()
            })
            .eq('email', email)
            .select()
            .single();

          if (error) throw error;
          return { success: true, message: 'Welcome back! Your subscription has been reactivated.', data };
        } else {
          // Update preferences for existing active subscription
          const { data, error } = await supabase
            .from('newsletters')
            .update({ preferences })
            .eq('email', email)
            .select()
            .single();

          if (error) throw error;
          return { success: true, message: 'Your subscription preferences have been updated.', data };
        }
      }

      // New subscription
      const { data, error } = await supabase
        .from('newsletters')
        .insert([{
          email,
          preferences,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      // Send welcome email
      await this.sendWelcomeEmail(email);

      return { success: true, message: 'Successfully subscribed! Check your email for confirmation.', data };
    } catch (error: unknown) {
      console.error('Newsletter subscription error:', error);
      return { success: false, message: 'Failed to subscribe. Please try again.', error };
    }
  },

  // Unsubscribe from newsletter
  async unsubscribe(email: string, token?: string) {
    try {
      // Verify token if provided (for secure unsubscribe links)
      if (token) {
        // In a real implementation, you'd verify the token
        // For now, we'll proceed with the email
      }

      const { data, error } = await supabase
        .from('newsletters')
        .update({ status: 'unsubscribed' })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: 'Successfully unsubscribed. You will no longer receive our emails.', data };
    } catch (error: unknown) {
      console.error('Newsletter unsubscribe error:', error);
      return { success: false, message: 'Failed to unsubscribe. Please try again.', error };
    }
  },

  // Get newsletter statistics
  async getStats(): Promise<NewsletterStats> {
    try {
      const { data: all } = await supabase.from('newsletters').select('*');
      
      if (!all) return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        unsubscribed: 0,
        weeklySubscribers: 0,
        marketingSubscribers: 0
      };

      const active = all.filter(sub => sub.status === 'active');
      const unsubscribed = all.filter(sub => sub.status === 'unsubscribed');
      const weeklySubscribers = active.filter(sub => {
        const prefs = sub.preferences as { weekly?: boolean; marketing?: boolean } | null;
        return prefs?.weekly === true;
      });
      const marketingSubscribers = active.filter(sub => {
        const prefs = sub.preferences as { weekly?: boolean; marketing?: boolean } | null;
        return prefs?.marketing === true;
      });

      return {
        totalSubscribers: all.length,
        activeSubscribers: active.length,
        unsubscribed: unsubscribed.length,
        weeklySubscribers: weeklySubscribers.length,
        marketingSubscribers: marketingSubscribers.length
      };
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        unsubscribed: 0,
        weeklySubscribers: 0,
        marketingSubscribers: 0
      };
    }
  },

  // Send welcome email
  async sendWelcomeEmail(email: string) {
    try {
      // Call Supabase Edge Function for sending emails
      const { error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          type: 'welcome',
          email,
          subject: 'Welcome to Carelwave Media!',
          template: 'welcome'
        }
      });

      if (error) {
        console.error('Error sending welcome email:', error);
      }
    } catch (error) {
      console.error('Welcome email error:', error);
    }
  },

  // Send new post notification to all subscribers
  async notifyNewPost(post: { id: string; title: string; excerpt: string; published_at: string }) {
    try {
      const { data: subscribers } = await supabase
        .from('newsletters')
        .select('email')
        .eq('status', 'active');

      if (!subscribers || subscribers.length === 0) {
        return { success: true, message: 'No active subscribers to notify.' };
      }

      // Send email to all subscribers
      const { error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          type: 'new_post',
          subscribers: subscribers.map(s => s.email),
          post,
          subject: `New Article: ${post.title}`,
          template: 'new_post'
        }
      });

      if (error) {
        console.error('Error sending new post emails:', error);
        return { success: false, message: 'Failed to send notifications.', error };
      }

      return { success: true, message: `Notifications sent to ${subscribers.length} subscribers.` };
    } catch (error: unknown) {
      console.error('New post notification error:', error);
      return { success: false, message: 'Failed to send notifications.', error };
    }
  },

  // Get all active subscribers
  async getActiveSubscribers() {
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('status', 'active')
        .order('subscription_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting subscribers:', error);
      return [];
    }
  },

  // Validate email format
  validateEmail(email: string): boolean {
    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return regex.test(email);
  },

  // Generate unsubscribe token (simple implementation)
  generateUnsubscribeToken(email: string): string {
    return btoa(email + Date.now()).replace(/[+/=]/g, '');
  }
};
