import { Resend } from 'resend';

// Email service configuration
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || 'your-resend-api-key';
const FROM_EMAIL = 'noreply@carelwavemedia.com';
const FROM_NAME = 'Carelwave Media';

class EmailService {
  private resend: Resend | null = null;
  private isTestMode: boolean = false;

  constructor() {
    if (RESEND_API_KEY && RESEND_API_KEY !== 'your-resend-api-key') {
      this.resend = new Resend(RESEND_API_KEY);
    } else {
      this.isTestMode = true;
      console.warn('⚠️ Email Service in TEST MODE - Set VITE_RESEND_API_KEY for production');
    }
  }

  // Send welcome email to new newsletter subscriber
  async sendWelcomeEmail(email: string, unsubscribeToken?: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    if (this.isTestMode) {
      console.log(`📧 TEST MODE - Welcome email would be sent to: ${email}`);
      return {
        success: true,
        message: 'Welcome email sent (test mode)'
      };
    }

    try {
      if (!this.resend) {
        throw new Error('Email service not initialized');
      }

      const unsubscribeUrl = unsubscribeToken 
        ? `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
        : `${window.location.origin}/unsubscribe`;

      const htmlContent = this.getWelcomeEmailTemplate(unsubscribeUrl);
      const textContent = this.getWelcomeEmailText(unsubscribeUrl);

      const result = await this.resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: '🎉 Welcome to Carelwave Media Newsletter!',
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        message: 'Welcome email sent successfully'
      };
    } catch (error: any) {
      console.error('Welcome email error:', error);
      return {
        success: false,
        message: 'Failed to send welcome email',
        error: error.message
      };
    }
  }

  // Send newsletter to subscribers
  async sendNewsletterEmail(
    email: string, 
    subject: string, 
    content: string, 
    unsubscribeToken?: string
  ): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    if (this.isTestMode) {
      console.log(`📧 TEST MODE - Newsletter email would be sent to: ${email}`);
      console.log(`📧 Subject: ${subject}`);
      return {
        success: true,
        message: 'Newsletter email sent (test mode)'
      };
    }

    try {
      if (!this.resend) {
        throw new Error('Email service not initialized');
      }

      const unsubscribeUrl = unsubscribeToken 
        ? `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
        : `${window.location.origin}/unsubscribe`;

      const htmlContent = this.getNewsletterTemplate(content, unsubscribeUrl);
      const textContent = this.getNewsletterText(content, unsubscribeUrl);

      const result = await this.resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        message: 'Newsletter email sent successfully'
      };
    } catch (error: any) {
      console.error('Newsletter email error:', error);
      return {
        success: false,
        message: 'Failed to send newsletter email',
        error: error.message
      };
    }
  }

  // Send new blog post notification
  async sendNewPostNotification(
    email: string,
    postTitle: string,
    postExcerpt: string,
    postUrl: string,
    unsubscribeToken?: string
  ): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    if (this.isTestMode) {
      console.log(`📧 TEST MODE - New post notification would be sent to: ${email}`);
      console.log(`📧 Post: ${postTitle}`);
      return {
        success: true,
        message: 'New post notification sent (test mode)'
      };
    }

    try {
      if (!this.resend) {
        throw new Error('Email service not initialized');
      }

      const unsubscribeUrl = unsubscribeToken 
        ? `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
        : `${window.location.origin}/unsubscribe`;

      const htmlContent = this.getNewPostTemplate(postTitle, postExcerpt, postUrl, unsubscribeUrl);
      const textContent = this.getNewPostText(postTitle, postExcerpt, postUrl, unsubscribeUrl);

      const result = await this.resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: `📝 New Post: ${postTitle}`,
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        message: 'New post notification sent successfully'
      };
    } catch (error: any) {
      console.error('New post notification error:', error);
      return {
        success: false,
        message: 'Failed to send new post notification',
        error: error.message
      };
    }
  }

  // Send bulk emails to subscribers
  async sendBulkEmails(
    emails: Array<{ email: string; unsubscribeToken?: string }>,
    subject: string,
    content: string
  ): Promise<{
    success: boolean;
    message: string;
    sent: number;
    failed: number;
    errors?: string[];
  }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const subscriber of emails) {
      try {
        const result = await this.sendNewsletterEmail(
          subscriber.email, 
          subject, 
          content, 
          subscriber.unsubscribeToken
        );
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${subscriber.email}: ${result.message}`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${subscriber.email}: ${error.message}`);
      }
    }

    return {
      success: results.sent > 0,
      message: `Sent to ${results.sent} subscribers, ${results.failed} failed`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    };
  }

  // Welcome email HTML template
  private getWelcomeEmailTemplate(unsubscribeUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Carelwave Media</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
        .unsubscribe { font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Carelwave Media!</h1>
            <p>Thank you for subscribing to our newsletter</p>
        </div>
        <div class="content">
            <h2>Hello there! 👋</h2>
            <p>We're thrilled to have you join our community of tech enthusiasts, developers, and innovators!</p>
            
            <p>Here's what you can expect from us:</p>
            <ul>
                <li>🚀 <strong>Latest Tech Insights</strong> - Deep dives into cutting-edge technologies</li>
                <li>💡 <strong>Engineering Best Practices</strong> - Real-world solutions and patterns</li>
                <li>📈 <strong>Industry Trends</strong> - What's shaping the future of technology</li>
                <li>🔧 <strong>Practical Tutorials</strong> - Hands-on guides and code examples</li>
            </ul>
            
            <p>You'll receive our newsletters with valuable content, and we promise to respect your inbox - no spam, just quality content!</p>
            
            <a href="${window.location.origin}/blog" class="button">Explore Our Blog 📚</a>
            
            <p>Thank you for being part of our journey!</p>
            <p>Best regards,<br>
            <strong>Akshay Verma</strong><br>
            Founder, Carelwave Media</p>
        </div>
        <div class="footer">
            <p class="unsubscribe">
                Don't want to receive these emails? 
                <a href="${unsubscribeUrl}">Unsubscribe here</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  // Welcome email plain text template
  private getWelcomeEmailText(unsubscribeUrl: string): string {
    return `
Welcome to Carelwave Media!

Hello there!

We're thrilled to have you join our community of tech enthusiasts, developers, and innovators!

Here's what you can expect from us:
• Latest Tech Insights - Deep dives into cutting-edge technologies
• Engineering Best Practices - Real-world solutions and patterns  
• Industry Trends - What's shaping the future of technology
• Practical Tutorials - Hands-on guides and code examples

You'll receive our newsletters with valuable content, and we promise to respect your inbox - no spam, just quality content!

Explore our blog: ${window.location.origin}/blog

Thank you for being part of our journey!

Best regards,
Akshay Verma
Founder, Carelwave Media

---
Don't want to receive these emails? Unsubscribe here: ${unsubscribeUrl}
`;
  }

  // Newsletter HTML template
  private getNewsletterTemplate(content: string, unsubscribeUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carelwave Media Newsletter</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
        .unsubscribe { font-size: 12px; color: #999; }
        h1, h2, h3 { color: #333; }
        a { color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Carelwave Media Newsletter</h1>
        </div>
        <div class="content">
            ${content}
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p>Best regards,<br>
            <strong>Akshay Verma</strong><br>
            Carelwave Media</p>
        </div>
        <div class="footer">
            <p class="unsubscribe">
                Don't want to receive these emails? 
                <a href="${unsubscribeUrl}">Unsubscribe here</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  // Newsletter plain text template
  private getNewsletterText(content: string, unsubscribeUrl: string): string {
    // Strip HTML tags and convert to plain text
    const plainContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    return `
Carelwave Media Newsletter

${plainContent}

Best regards,
Akshay Verma
Carelwave Media

---
Don't want to receive these emails? Unsubscribe here: ${unsubscribeUrl}
`;
  }

  // New post notification HTML template
  private getNewPostTemplate(title: string, excerpt: string, postUrl: string, unsubscribeUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Post: ${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
        .unsubscribe { font-size: 12px; color: #999; }
        .post-title { color: #333; margin-bottom: 10px; }
        .post-excerpt { color: #666; font-style: italic; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 New Post Published!</h1>
        </div>
        <div class="content">
            <h2 class="post-title">${title}</h2>
            <p class="post-excerpt">${excerpt}</p>
            
            <p>We've just published a new blog post that we think you'll find interesting!</p>
            
            <a href="${postUrl}" class="button">Read Full Article 📖</a>
            
            <p>Thank you for being a valued subscriber!</p>
            
            <p>Best regards,<br>
            <strong>Akshay Verma</strong><br>
            Carelwave Media</p>
        </div>
        <div class="footer">
            <p class="unsubscribe">
                Don't want to receive these emails? 
                <a href="${unsubscribeUrl}">Unsubscribe here</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  // New post notification plain text template
  private getNewPostText(title: string, excerpt: string, postUrl: string, unsubscribeUrl: string): string {
    return `
New Post Published!

${title}

${excerpt}

We've just published a new blog post that we think you'll find interesting!

Read the full article: ${postUrl}

Thank you for being a valued subscriber!

Best regards,
Akshay Verma
Carelwave Media

---
Don't want to receive these emails? Unsubscribe here: ${unsubscribeUrl}
`;
  }

  // Check if email service is available
  isAvailable(): boolean {
    return !this.isTestMode && this.resend !== null;
  }

  // Get service status
  getStatus(): { available: boolean; mode: string; message: string } {
    if (this.isTestMode) {
      return {
        available: false,
        mode: 'test',
        message: 'Running in test mode - set VITE_RESEND_API_KEY for production'
      };
    }

    return {
      available: true,
      mode: 'production',
      message: 'Email service ready'
    };
  }
}

export const emailService = new EmailService(); 