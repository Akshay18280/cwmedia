// import { Resend } from 'resend';
import { appConfig } from '@/config/appConfig';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
}

class EmailService {
  private resend: any = null;
  private readonly fromEmail = 'Carelwave Media <noreply@carelwave.com>';
  private readonly replyToEmail = 'contact@carelwave.com';

  constructor() {
    // Feature guard: only initialize Resend if email feature is enabled
    if (!appConfig.features.enableResendEmail || !appConfig.email.resendApiKey) {
      console.warn('Resend email disabled — running in test mode (emails logged to console)');
      return;
    }
    // Resend SDK not imported — emails run in test mode for now
    // To enable: npm install resend, uncomment import, and set this.resend = new Resend(apiKey)
  }

  async sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<SendResult> {
    const subject = 'Welcome to Carelwave Media Newsletter! 🎉';
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`;
    
    const html = this.getWelcomeEmailHTML(email, unsubscribeUrl);
    const text = this.getWelcomeEmailText(email, unsubscribeUrl);

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  async sendNewsletterEmail(email: string, subject: string, content: string, unsubscribeToken: string): Promise<SendResult> {
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`;
    
    const html = this.getNewsletterEmailHTML(subject, content, unsubscribeUrl);
    const text = this.getNewsletterEmailText(subject, content, unsubscribeUrl);

    return this.sendEmail({
      to: email,
      subject: `[Carelwave Media] ${subject}`,
      html,
      text
    });
  }

  async sendNewPostNotification(email: string, postTitle: string, postExcerpt: string, postUrl: string, unsubscribeToken: string): Promise<SendResult> {
    const subject = `New Post: ${postTitle}`;
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`;
    
    const html = this.getNewPostEmailHTML(postTitle, postExcerpt, postUrl, unsubscribeUrl);
    const text = this.getNewPostEmailText(postTitle, postExcerpt, postUrl, unsubscribeUrl);

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  async sendCustomEmail(options: EmailOptions): Promise<SendResult> {
    return this.sendEmail({
      ...options,
      from: options.from || this.fromEmail,
      replyTo: options.replyTo || this.replyToEmail
    });
  }

  async sendBulkEmails(emails: { email: string; unsubscribeToken: string }[], subject: string, content: string): Promise<SendResult[]> {
    const results: SendResult[] = [];
    
    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(({ email, unsubscribeToken }) => 
        this.sendNewsletterEmail(email, subject, content, unsubscribeToken)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  private async sendEmail(options: EmailOptions): Promise<SendResult> {
    if (!this.resend) {
      console.log('📧 Email Service (Test Mode):', {
        to: options.to,
        subject: options.subject,
        from: options.from || this.fromEmail
      });
      
      return {
        success: true,
        message: 'Email sent successfully (test mode)',
        id: 'test-' + Date.now()
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo || this.replyToEmail
      });

      if (response.error) {
        console.error('Resend API error:', response.error);
        return {
          success: false,
          message: 'Failed to send email: ' + response.error.message,
          error: response.error.message
        };
      }

      return {
        success: true,
        message: 'Email sent successfully',
        id: response.data?.id
      };
    } catch (error: any) {
      console.error('Email service error:', error);
      return {
        success: false,
        message: 'Failed to send email: ' + error.message,
        error: error.message
      };
    }
  }

  private getWelcomeEmailHTML(email: string, unsubscribeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Carelwave Media</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Carelwave Media! 🎉</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #2c3e50; margin-top: 0;">Thank you for subscribing!</h2>
            
            <p>Hi there! 👋</p>
            
            <p>Welcome to the Carelwave Media community! You've successfully subscribed to our newsletter and you're now part of an exclusive group of tech enthusiasts and industry professionals.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c3e50;">What to expect:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>🚀 Latest insights on system design and cloud architecture</li>
                <li>💡 Best practices and industry tips</li>
                <li>📚 Exclusive content and tutorials</li>
                <li>🎯 Curated resources for developers</li>
              </ul>
            </div>
            
            <p>We respect your inbox and promise to only send valuable content. No spam, ever!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/blog" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Explore Our Blog 📖</a>
            </div>
            
            <p>Best regards,<br>
            <strong>Akshay Verma</strong><br>
            Founder, Carelwave Media</p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                You received this email because you subscribed to our newsletter at carelwave.com<br>
                <a href="${unsubscribeUrl}" style="color: #6c757d;">Unsubscribe</a> | 
                <a href="${window.location.origin}/contact" style="color: #6c757d;">Contact Us</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeEmailText(email: string, unsubscribeUrl: string): string {
    return `
Welcome to Carelwave Media! 🎉

Hi there! 👋

Welcome to the Carelwave Media community! You've successfully subscribed to our newsletter and you're now part of an exclusive group of tech enthusiasts and industry professionals.

What to expect:
• 🚀 Latest insights on system design and cloud architecture
• 💡 Best practices and industry tips
• 📚 Exclusive content and tutorials
• 🎯 Curated resources for developers

We respect your inbox and promise to only send valuable content. No spam, ever!

Explore our blog: ${window.location.origin}/blog

Best regards,
Akshay Verma
Founder, Carelwave Media

---
You received this email because you subscribed to our newsletter at carelwave.com
Unsubscribe: ${unsubscribeUrl}
Contact Us: ${window.location.origin}/contact
    `;
  }

  private getNewsletterEmailHTML(subject: string, content: string, unsubscribeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject} - Carelwave Media</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Carelwave Media Newsletter</h1>
            <p style="color: #e8f2ff; margin: 10px 0 0 0; opacity: 0.9;">${subject}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              ${content}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/blog" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Read More on Our Blog</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              <a href="${unsubscribeUrl}" style="color: #6c757d;">Unsubscribe</a> | 
              <a href="${window.location.origin}/contact" style="color: #6c757d;">Contact Us</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getNewsletterEmailText(subject: string, content: string, unsubscribeUrl: string): string {
    return `
Carelwave Media Newsletter
${subject}

${content.replace(/<[^>]*>/g, '')}

Read more on our blog: ${window.location.origin}/blog

---
Unsubscribe: ${unsubscribeUrl}
Contact Us: ${window.location.origin}/contact
    `;
  }

  private getNewPostEmailHTML(postTitle: string, postExcerpt: string, postUrl: string, unsubscribeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Post: ${postTitle}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📝 New Post Published!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #2c3e50; margin-top: 0;">${postTitle}</h2>
            
            <p style="color: #6c757d; font-size: 16px; line-height: 1.5;">${postExcerpt}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${postUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Read Full Article 📖</a>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <p style="margin: 0; color: #2c3e50;">
                <strong>💡 Tip:</strong> Share this article with your team and colleagues who might find it valuable!
              </p>
            </div>
            
            <p>Thank you for being part of our community!</p>
            
            <p>Best regards,<br>
            <strong>Akshay Verma</strong><br>
            Carelwave Media</p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
              <a href="${unsubscribeUrl}" style="color: #6c757d;">Unsubscribe</a> | 
              <a href="${window.location.origin}/contact" style="color: #6c757d;">Contact Us</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getNewPostEmailText(postTitle: string, postExcerpt: string, postUrl: string, unsubscribeUrl: string): string {
    return `
📝 New Post Published!

${postTitle}

${postExcerpt}

Read the full article: ${postUrl}

💡 Tip: Share this article with your team and colleagues who might find it valuable!

Thank you for being part of our community!

Best regards,
Akshay Verma
Carelwave Media

---
Unsubscribe: ${unsubscribeUrl}
Contact Us: ${window.location.origin}/contact
    `;
  }

  // Utility methods
  getStatus(): { available: boolean; mode: string; message: string } {
    const hasApiKey = !!this.resend;
    
    return {
      available: hasApiKey,
      mode: hasApiKey ? 'production' : 'test',
      message: hasApiKey 
        ? 'Resend API configured and ready'
        : 'Running in test mode (enable Resend SDK to send real emails)'
    };
  }

  isAvailable(): boolean {
    return !!this.resend;
  }
}

export const emailService = new EmailService(); 