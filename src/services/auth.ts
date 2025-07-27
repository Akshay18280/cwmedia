import { supabase } from '../lib/supabase';

export interface SocialUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  position?: string;
  profileImage?: string;
  linkedinUrl?: string;
  provider: 'linkedin' | 'google';
  providerId: string;
}

export interface Review {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  reviewer_name: string;
  reviewer_position: string;
  reviewer_company: string;
  reviewer_image?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface AdminOTP {
  phoneNumber: string;
  otpCode: string;
  expiresAt: string;
}

export const authService = {
  // LinkedIn OAuth login
  async loginWithLinkedIn(): Promise<{ success: boolean; data?: SocialUser; error?: string }> {
    try {
      // LinkedIn OAuth flow
      const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
      const scope = 'openid profile email';
      
      if (!clientId) {
        return { success: false, error: 'LinkedIn client ID not configured' };
      }

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}`;

      // Redirect to LinkedIn
      window.location.href = authUrl;
      
      return { success: true };
    } catch (error) {
      console.error('LinkedIn login error:', error);
      return { success: false, error: 'Failed to initialize LinkedIn login' };
    }
  },

  // Google OAuth login (as alternative to Glassdoor)
  async loginWithGoogle(): Promise<{ success: boolean; data?: SocialUser; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const message = error instanceof Error ? error.message : 'Failed to login with Google';
      return { success: false, error: message };
    }
  },

  // Handle OAuth callback and create/update user
  async handleOAuthCallback(provider: string, code: string): Promise<{ success: boolean; user?: SocialUser; error?: string }> {
    try {
      let userData: SocialUser | null = null;

      if (provider === 'linkedin') {
        userData = await this.exchangeLinkedInCode(code);
      } else if (provider === 'google') {
        // Google handled by Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          userData = {
            id: user.id,
            email: user.email!,
            name: user.user_metadata.full_name || user.user_metadata.name,
            profileImage: user.user_metadata.picture || user.user_metadata.avatar_url,
            provider: 'google',
            providerId: user.id
          };
        }
      }

      if (!userData) {
        return { success: false, error: 'Failed to get user data from provider' };
      }

      // Create or update user in database
      const dbUser = await this.createOrUpdateUser(userData);
      
      return { success: true, user: dbUser };
    } catch (error: unknown) {
      console.error('OAuth callback error:', error);
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return { success: false, error: message };
    }
  },

  // Exchange LinkedIn authorization code for user data
  async exchangeLinkedInCode(code: string): Promise<SocialUser | null> {
    try {
      // This would typically be done on your backend for security
      // For demo purposes, showing the structure
      const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_LINKEDIN_CLIENT_SECRET;
      const redirectUri = `${window.location.origin}/auth/linkedin/callback`;

      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const profile = await profileResponse.json();

      return {
        id: profile.sub,
        email: profile.email,
        name: profile.name,
        profileImage: profile.picture,
        provider: 'linkedin',
        providerId: profile.sub
      };
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
      return null;
    }
  },

  // Create or update user in database
  async createOrUpdateUser(userData: SocialUser): Promise<SocialUser> {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({
            name: userData.name,
            provider: userData.provider,
            provider_id: userData.providerId,
            profile_image: userData.profileImage,
            company: userData.company,
            position: userData.position,
            linkedin_url: userData.linkedinUrl,
            last_login: new Date().toISOString()
          })
          .eq('email', userData.email)
          .select()
          .single();

        if (error) throw error;
        return { ...userData, id: updatedUser.id };
      } else {
        // Create new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([{
            email: userData.email,
            name: userData.name,
            provider: userData.provider,
            provider_id: userData.providerId,
            profile_image: userData.profileImage,
            company: userData.company,
            position: userData.position,
            linkedin_url: userData.linkedinUrl,
            role: 'user',
            verified: true,
            last_login: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        return { ...userData, id: newUser.id };
      }
    } catch (error) {
      console.error('Database user error:', error);
      throw error;
    }
  },

  // Generate OTP for admin login
  async generateAdminOTP(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // For development, use a fixed OTP code
      // In production, this would generate a random 6-digit code and send via SMS
      
      // For development, we'll simulate sending SMS
      // In production, uncomment the line below:
      // await this.sendSMS('62624507878', `Your Carelwave Media admin OTP: 123456. Valid for 10 minutes.`);
      
      return { success: true, message: 'OTP sent! Use code: 123456 for testing.' };
    } catch (error: unknown) {
      console.error('OTP generation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: 'Failed to generate OTP', error: message };
    }
  },

  // Verify admin OTP
  async verifyAdminOTP(enteredOTP: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Temporarily simulate OTP verification for development
      // In production, this would check the database
      if (enteredOTP === '123456') {
        return { success: true, message: 'Admin verified successfully' };
      } else {
        return { success: false, message: 'Invalid OTP. Use 123456 for testing.' };
      }
    } catch (error: unknown) {
      console.error('OTP verification error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: 'Verification failed', error: message };
    }
  },

  // Send SMS (placeholder - integrate with Twilio)
  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, integrate with Twilio:
      /*
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${phoneNumber}`
      });
      */

      // For development, simulate success
      console.log(`SMS to ${phoneNumber}: ${message}`);
      return { success: true };
    } catch (error: unknown) {
      console.error('SMS sending error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<SocialUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Temporarily simplified until database schema is updated
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        provider: 'google' as const,
        providerId: user.id
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};
