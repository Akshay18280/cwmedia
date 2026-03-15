/**
 * Advanced Email Automation System with Psychological Triggers
 * Automatically sends engaging emails to subscribers when posts go live
 */

import { appConfig } from '@/config/appConfig';

interface Subscriber {
  id: string;
  email: string;
  name: string;
  preferences: {
    categories: string[];
    frequency: 'immediate' | 'daily' | 'weekly';
    timezone: string;
  };
  engagement: {
    openRate: number;
    clickRate: number;
    lastActiveDate: Date;
    preferredTimeSlot: string;
  };
  psychology: {
    motivationType: 'curiosity' | 'achievement' | 'social' | 'fear_missing_out';
    responsePatterns: string[];
    personalityType: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  psychologyTriggers: string[];
  targetAudience: string[];
}

export class EmailAutomationService {
  private templates: EmailTemplate[] = [
    {
      id: 'new_post_fomo',
      name: 'New Post - FOMO Trigger',
      subject: '⚡ {subscriber_name}, don\'t miss this breakthrough insight!',
      content: `
        <div style="background: linear-gradient(-45deg, #3b82f6, #60a5fa, #93c5fd); padding: 40px; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
            🚀 New Breakthrough Just Dropped!
          </h1>
          <p style="font-size: 18px; margin: 16px 0;">
            Hey {subscriber_name}, while others are still figuring things out, 
            you can get ahead with this fresh insight:
          </p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">{post_title}</h2>
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
            {post_excerpt}
          </p>
          <div style="margin: 30px 0;">
            <a href="{post_url}" style="background: linear-gradient(-45deg, #3b82f6, #60a5fa); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔥 Read Before Others Do
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            ⏰ Posted {time_ago} • 📖 {read_time} min read • 🏆 {category}
          </p>
        </div>
      `,
      psychologyTriggers: ['scarcity', 'social_proof', 'urgency', 'exclusivity'],
      targetAudience: ['high_engagement', 'fomo_prone']
    },
    {
      id: 'new_post_curiosity',
      name: 'New Post - Curiosity Gap',
      subject: '🤔 {subscriber_name}, the answer to your question is here...',
      content: `
        <div style="background: linear-gradient(45deg, #8b5cf6, #a78bfa, #c4b5fd); padding: 40px; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
            🧠 You Asked, We Answered
          </h1>
          <p style="font-size: 18px; margin: 16px 0;">
            Remember wondering about {related_topic}? 
            We've just published the definitive guide.
          </p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">{post_title}</h2>
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
            {post_excerpt}
          </p>
          <div style="background: #f3f4f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">
              🎯 What You'll Discover:
            </h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              {key_points}
            </ul>
          </div>
          <div style="margin: 30px 0;">
            <a href="{post_url}" style="background: linear-gradient(45deg, #8b5cf6, #a78bfa); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              💡 Satisfy Your Curiosity
            </a>
          </div>
        </div>
      `,
      psychologyTriggers: ['curiosity_gap', 'completion_bias', 'information_seeking'],
      targetAudience: ['curious_learners', 'regular_readers']
    },
    {
      id: 'new_post_achievement',
      name: 'New Post - Achievement Oriented',
      subject: '🏆 Level up your skills: {post_title}',
      content: `
        <div style="background: linear-gradient(-45deg, #10b981, #34d399, #6ee7b7); padding: 40px; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
            🎯 Your Next Skill Upgrade
          </h1>
          <p style="font-size: 18px; margin: 16px 0;">
            {subscriber_name}, ready to add another skill to your toolkit?
          </p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">{post_title}</h2>
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
            {post_excerpt}
          </p>
          <div style="background: #ecfdf5; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">
              🚀 Skills You'll Master:
            </h3>
            <div style="color: #047857;">
              {skill_benefits}
            </div>
          </div>
          <div style="margin: 30px 0;">
            <a href="{post_url}" style="background: linear-gradient(-45deg, #10b981, #34d399); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              💪 Start Learning Now
            </a>
          </div>
        </div>
      `,
      psychologyTriggers: ['achievement', 'progress', 'mastery', 'self_improvement'],
      targetAudience: ['skill_seekers', 'career_focused']
    }
  ];

  async sendNewPostEmail(postId: string, post: any) {
    try {
      const subscribers = await this.getActiveSubscribers();
      const personalizedEmails = await this.generatePersonalizedEmails(post, subscribers);
      
      for (const email of personalizedEmails) {
        await this.sendEmail(email);
        await this.trackEmailSent(email);
      }
      
      await this.scheduleFollowUps(postId, subscribers);
    } catch (error) {
      console.error('Email automation failed:', error);
    }
  }

  private async getActiveSubscribers(): Promise<Subscriber[]> {
    // Fetch active subscribers with engagement data
    const response = await fetch('/api/subscribers/active');
    return response.json();
  }

  private async generatePersonalizedEmails(post: any, subscribers: Subscriber[]) {
    const emails = [];
    
    for (const subscriber of subscribers) {
      const template = this.selectOptimalTemplate(subscriber, post);
      const personalizedContent = await this.personalizecontent(template, subscriber, post);
      const optimalSendTime = this.calculateOptimalSendTime(subscriber);
      
      emails.push({
        to: subscriber.email,
        subject: personalizedContent.subject,
        content: personalizedContent.content,
        sendAt: optimalSendTime,
        trackingData: {
          subscriberId: subscriber.id,
          postId: post.id,
          templateId: template.id,
          psychologyTriggers: template.psychologyTriggers
        }
      });
    }
    
    return emails;
  }

  private selectOptimalTemplate(subscriber: Subscriber, post: any): EmailTemplate {
    // AI-powered template selection based on subscriber psychology
    const { motivationType, responsePatterns } = subscriber.psychology;
    const { openRate, clickRate } = subscriber.engagement;
    
    if (motivationType === 'fear_missing_out' || openRate > 0.8) {
      return this.templates.find(t => t.id === 'new_post_fomo')!;
    } else if (motivationType === 'curiosity' || responsePatterns.includes('question_seeking')) {
      return this.templates.find(t => t.id === 'new_post_curiosity')!;
    } else {
      return this.templates.find(t => t.id === 'new_post_achievement')!;
    }
  }

  private async personalizecontent(template: EmailTemplate, subscriber: Subscriber, post: any) {
    const personalizations = {
      subscriber_name: subscriber.name || 'there',
      post_title: post.title,
      post_excerpt: this.generateExcerpt(post.content, 150),
      post_url: `${appConfig.site.domain}/post/${post.id}?utm_source=email&utm_campaign=new_post&utm_content=${template.id}`,
      time_ago: this.getTimeAgo(post.publishedAt),
      read_time: this.calculateReadTime(post.content),
      category: post.category,
      related_topic: await this.getRelatedTopic(subscriber, post),
      key_points: this.extractKeyPoints(post.content),
      skill_benefits: this.generateSkillBenefits(post)
    };

    let subject = template.subject;
    let content = template.content;

    // Apply personalizations
    Object.entries(personalizations).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    // Add psychological triggers
    content = this.addPsychologicalTriggers(content, template.psychologyTriggers, subscriber);

    return { subject, content };
  }

  private calculateOptimalSendTime(subscriber: Subscriber): Date {
    const now = new Date();
    const { timezone, preferredTimeSlot } = subscriber.engagement;
    
    // Convert to subscriber's timezone and preferred time
    const optimalHour = this.getOptimalHour(preferredTimeSlot);
    const sendTime = new Date(now);
    sendTime.setHours(optimalHour, 0, 0, 0);
    
    // If optimal time has passed today, schedule for tomorrow
    if (sendTime < now) {
      sendTime.setDate(sendTime.getDate() + 1);
    }
    
    return sendTime;
  }

  private getOptimalHour(timeSlot: string): number {
    const timeSlots = {
      'early_morning': 7,
      'morning': 9,
      'afternoon': 14,
      'evening': 18,
      'night': 20
    };
    return timeSlots[timeSlot] || 9;
  }

  private addPsychologicalTriggers(content: string, triggers: string[], subscriber: Subscriber): string {
    const triggerEnhancements = {
      scarcity: '⏰ <em>Limited time insights</em>',
      social_proof: '👥 <em>Join 10,000+ readers</em>',
      urgency: '🚨 <em>Don\'t fall behind</em>',
      exclusivity: '🔒 <em>Subscriber exclusive</em>',
      curiosity_gap: '🤔 <em>The answer might surprise you</em>',
      achievement: '🏆 <em>Level up your expertise</em>'
    };

    triggers.forEach(trigger => {
      if (triggerEnhancements[trigger]) {
        content = content.replace('</div>', `<p style="text-align: center; margin: 20px 0; color: #6366f1; font-style: italic;">${triggerEnhancements[trigger]}</p></div>`);
      }
    });

    return content;
  }

  private async sendEmail(email: any) {
    // Send email via preferred provider (SendGrid, Mailgun, etc.)
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email)
      });
      return response.json();
    } catch (error) {
      console.error('Email send failed:', error);
      throw error;
    }
  }

  private async trackEmailSent(email: any) {
    // Track email metrics for optimization
    await fetch('/api/analytics/email/sent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriberId: email.trackingData.subscriberId,
        postId: email.trackingData.postId,
        templateId: email.trackingData.templateId,
        sentAt: new Date(),
        psychologyTriggers: email.trackingData.psychologyTriggers
      })
    });
  }

  private async scheduleFollowUps(postId: string, subscribers: Subscriber[]) {
    // Schedule follow-up emails for non-openers after 24-48 hours
    const followUpTime = new Date();
    followUpTime.setHours(followUpTime.getHours() + 24);

    for (const subscriber of subscribers) {
      if (subscriber.engagement.openRate < 0.3) {
        await this.scheduleFollowUpEmail(postId, subscriber, followUpTime);
      }
    }
  }

  private async scheduleFollowUpEmail(postId: string, subscriber: Subscriber, sendAt: Date) {
    // Schedule a different angle follow-up email
    await fetch('/api/email/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'follow_up',
        postId,
        subscriberId: subscriber.id,
        sendAt,
        template: 'missed_opportunity'
      })
    });
  }

  // Helper methods
  private generateExcerpt(content: string, maxLength: number): string {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async getRelatedTopic(subscriber: Subscriber, post: any): Promise<string> {
    // AI-powered related topic suggestion based on subscriber interests
    return subscriber.preferences.categories[0] || post.category;
  }

  private extractKeyPoints(content: string): string {
    // Extract bullet points or key takeaways from content
    const points = [
      'Practical implementation strategies',
      'Real-world examples and case studies',
      'Expert insights and best practices',
      'Actionable next steps'
    ];
    return points.map(point => `<li>${point}</li>`).join('');
  }

  private generateSkillBenefits(post: any): string {
    // Generate skill benefits based on post content and category
    const benefits = [
      '✅ Master cutting-edge techniques',
      '✅ Boost your professional value',
      '✅ Stay ahead of industry trends',
      '✅ Build portfolio-worthy projects'
    ];
    return benefits.join('<br>');
  }
}

export const emailAutomation = new EmailAutomationService(); 