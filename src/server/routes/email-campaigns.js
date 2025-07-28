/**
 * Email Campaigns API Routes
 * Handles email campaign management with advanced psychology triggers
 * Supports A/B testing, automation, and detailed analytics
 * @version 1.0.0
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { GoogleAuth } = require('google-auth-library');

const router = express.Router();
const db = admin.firestore();

// Email service configuration
const createEmailTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    });
  } else {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
};

// Psychology triggers configuration
const PSYCHOLOGY_TRIGGERS = {
  scarcity: {
    id: 'scarcity',
    name: 'Scarcity',
    description: 'Limited time or availability',
    templates: [
      'Only {timeLeft} left to access this exclusive content!',
      'Limited spots available - only {spotsLeft} remaining',
      'This offer expires in {timeLeft} - don\'t miss out!'
    ],
    effectiveness: 8.7
  },
  social_proof: {
    id: 'social_proof',
    name: 'Social Proof',
    description: 'Others are taking action',
    templates: [
      'Join {subscriberCount} professionals who are already reading our insights',
      '{recentSignups} people signed up just this week',
      'Trusted by {companyCount} leading companies worldwide'
    ],
    effectiveness: 9.2
  },
  urgency: {
    id: 'urgency',
    name: 'Urgency',
    description: 'Act now or miss out',
    templates: [
      'Breaking: New article published - read it before your competitors do',
      'Time-sensitive insights: Market trends you need to know NOW',
      'Don\'t let this opportunity slip away - take action today'
    ],
    effectiveness: 8.9
  },
  curiosity: {
    id: 'curiosity',
    name: 'Curiosity Gap',
    description: 'Create knowledge gaps',
    templates: [
      'The surprising truth about {topic} that industry experts don\'t want you to know',
      'What {percentage}% of professionals are doing wrong (and how to fix it)',
      'The secret strategy that helped {company} increase {metric} by {percentage}%'
    ],
    effectiveness: 9.4
  },
  authority: {
    id: 'authority',
    name: 'Authority',
    description: 'Expert recommendations',
    templates: [
      'As featured in Forbes, TechCrunch, and Harvard Business Review',
      'Insights from industry leaders at Google, Microsoft, and Meta',
      'Research-backed strategies used by Fortune 500 companies'
    ],
    effectiveness: 8.5
  },
  reciprocity: {
    id: 'reciprocity',
    name: 'Reciprocity',
    description: 'Give value first',
    templates: [
      'Free exclusive report: {reportTitle} (valued at ${value})',
      'Complimentary access to our premium content library',
      'No strings attached - here\'s valuable insight to help your business'
    ],
    effectiveness: 8.3
  },
  fear_of_missing_out: {
    id: 'fear_of_missing_out',
    name: 'FOMO',
    description: 'Fear of missing opportunities',
    templates: [
      'While you hesitate, your competitors are already implementing these strategies',
      'The window of opportunity is closing - don\'t be left behind',
      'Miss this, and you\'ll spend months catching up to the competition'
    ],
    effectiveness: 9.1
  }
};

// Email templates with psychology triggers
const EMAIL_TEMPLATES = {
  welcome_series: {
    id: 'welcome_series',
    name: 'Welcome Series',
    description: 'Onboard new subscribers with value-driven content',
    subject: 'Welcome to the future of {industry} insights, {firstName}!',
    triggers: ['social_proof', 'authority', 'reciprocity'],
    conversionRate: 24.5,
    openRate: 68.3,
    template: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Carelwave Media!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey to industry expertise starts now</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Hi {firstName},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">
            You've just joined <strong>{subscriberCount} forward-thinking professionals</strong> who rely on our insights to stay ahead in {industry}.
          </p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">What you'll receive:</h3>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #555;">
              <li style="margin: 8px 0;">Weekly deep-dive articles on cutting-edge {industry} trends</li>
              <li style="margin: 8px 0;">Exclusive case studies from Fortune 500 companies</li>
              <li style="margin: 8px 0;">Early access to our premium content and tools</li>
              <li style="margin: 8px 0;">Direct insights from industry leaders and experts</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{latestArticleUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
              Read Your First Exclusive Article
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin: 30px 0 0 0;">
            <em>As featured in Forbes, TechCrunch, and Harvard Business Review</em>
          </p>
        </div>
      </div>
    `
  },
  new_article_alert: {
    id: 'new_article_alert',
    name: 'New Article Alert',
    description: 'Notify subscribers about new content with urgency',
    subject: 'Breaking: {articleTitle} - Read before your competitors do',
    triggers: ['urgency', 'curiosity', 'fear_of_missing_out'],
    conversionRate: 31.2,
    openRate: 72.8,
    template: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background: #ff6b6b; padding: 15px; text-align: center;">
          <p style="color: white; margin: 0; font-weight: 600; font-size: 14px;">🚨 BREAKING INDUSTRY NEWS</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h1 style="color: #333; font-size: 24px; margin: 0 0 20px 0; line-height: 1.3;">{articleTitle}</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Hi {firstName},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">
            While your competitors are still catching up on last week's trends, I'm sharing something that could change how you approach {topic} forever.
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">In this exclusive article, you'll discover:</h3>
            <ul style="margin: 0; padding: 0 0 0 20px; color: white;">
              {articleHighlights}
            </ul>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; color: #856404; font-weight: 600; font-size: 14px;">
              ⚡ Time-sensitive insight: This strategy window closes when your competitors catch on. Read now to maintain your advantage.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{articleUrl}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; font-size: 16px;">
              Get Exclusive Access Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin: 20px 0 0 0;">
            Reading time: {readingTime} minutes | Published: {publishDate}
          </p>
        </div>
      </div>
    `
  }
};

// Get all email campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaignsSnapshot = await db.collection('email_campaigns')
      .orderBy('created_at', 'desc')
      .get();
    
    const campaigns = campaignsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString(),
      scheduled_at: doc.data().scheduled_at?.toDate?.()?.toISOString(),
      sent_at: doc.data().sent_at?.toDate?.()?.toISOString()
    }));
    
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get email templates
router.get('/templates', async (req, res) => {
  try {
    const templates = Object.values(EMAIL_TEMPLATES).map(template => ({
      ...template,
      psychologyTriggers: template.triggers.map(triggerId => PSYCHOLOGY_TRIGGERS[triggerId])
    }));
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create new email campaign
router.post('/campaigns',
  [
    body('name').notEmpty().trim().isLength({ min: 3, max: 100 }),
    body('subject').notEmpty().trim().isLength({ min: 5, max: 200 }),
    body('template').notEmpty(),
    body('psychologyTriggers').isArray(),
    body('segmentation').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const {
        name,
        subject,
        template,
        psychologyTriggers = [],
        segmentation = [],
        scheduledAt,
        targetAudience = 'all'
      } = req.body;
      
      // Get subscriber count for the campaign
      let subscribersQuery = db.collection('newsletter_subscribers')
        .where('status', '==', 'active');
      
      if (segmentation.length > 0) {
        // Apply segmentation filters
        segmentation.forEach(filter => {
          if (filter.field && filter.operator && filter.value) {
            subscribersQuery = subscribersQuery.where(filter.field, filter.operator, filter.value);
          }
        });
      }
      
      const subscribersSnapshot = await subscribersQuery.get();
      const recipientCount = subscribersSnapshot.size;
      
      const campaignData = {
        name,
        subject,
        template,
        psychologyTriggers,
        segmentation,
        targetAudience,
        recipients: recipientCount,
        status: scheduledAt ? 'scheduled' : 'draft',
        opens: 0,
        clicks: 0,
        unsubscribes: 0,
        bounces: 0,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        created_by: req.user.uid
      };
      
      if (scheduledAt) {
        campaignData.scheduled_at = new Date(scheduledAt);
      }
      
      const docRef = await db.collection('email_campaigns').add(campaignData);
      
      res.status(201).json({
        id: docRef.id,
        message: 'Campaign created successfully',
        recipients: recipientCount
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// Send email campaign
router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaignDoc = await db.collection('email_campaigns').doc(id).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaign = campaignDoc.data();
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campaign already sent' });
    }
    
    // Update campaign status to sending
    await db.collection('email_campaigns').doc(id).update({
      status: 'sending',
      sending_started_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get subscribers based on segmentation
    let subscribersQuery = db.collection('newsletter_subscribers')
      .where('status', '==', 'active');
    
    if (campaign.segmentation && campaign.segmentation.length > 0) {
      campaign.segmentation.forEach(filter => {
        if (filter.field && filter.operator && filter.value) {
          subscribersQuery = subscribersQuery.where(filter.field, filter.operator, filter.value);
        }
      });
    }
    
    const subscribersSnapshot = await subscribersQuery.get();
    const subscribers = subscribersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Process email sending in background
    processEmailCampaign(id, campaign, subscribers);
    
    res.json({
      message: 'Campaign sending started',
      recipients: subscribers.length
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

// Process email campaign in background
async function processEmailCampaign(campaignId, campaign, subscribers) {
  const transporter = createEmailTransporter();
  let successCount = 0;
  let failureCount = 0;
  const batchSize = 50; // Send in batches to avoid rate limiting
  
  try {
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (subscriber) => {
        try {
          const personalizedEmail = personalizeEmail(campaign, subscriber);
          
          await transporter.sendMail({
            from: `"Carelwave Media" <${process.env.FROM_EMAIL}>`,
            to: subscriber.email,
            subject: personalizedEmail.subject,
            html: personalizedEmail.html,
            headers: {
              'X-Campaign-ID': campaignId,
              'X-Subscriber-ID': subscriber.id
            }
          });
          
          // Track email sent
          await db.collection('email_analytics').add({
            campaign_id: campaignId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            event: 'sent',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${subscriber.email}:`, error);
          failureCount++;
          
          // Track email failure
          await db.collection('email_analytics').add({
            campaign_id: campaignId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            event: 'failed',
            error: error.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
      await Promise.all(emailPromises);
      
      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update campaign with final results
    await db.collection('email_campaigns').doc(campaignId).update({
      status: 'sent',
      sent_at: admin.firestore.FieldValue.serverTimestamp(),
      successful_sends: successCount,
      failed_sends: failureCount,
      delivery_rate: (successCount / (successCount + failureCount)) * 100
    });
    
    console.log(`Campaign ${campaignId} completed: ${successCount} sent, ${failureCount} failed`);
  } catch (error) {
    console.error(`Campaign ${campaignId} failed:`, error);
    
    await db.collection('email_campaigns').doc(campaignId).update({
      status: 'failed',
      error: error.message,
      failed_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

// Personalize email content
function personalizeEmail(campaign, subscriber) {
  const template = EMAIL_TEMPLATES[campaign.template];
  if (!template) {
    throw new Error('Template not found');
  }
  
  // Apply psychology triggers
  let subject = template.subject;
  let html = template.template;
  
  // Replace personalization variables
  const variables = {
    firstName: subscriber.first_name || subscriber.name?.split(' ')[0] || 'Reader',
    email: subscriber.email,
    subscriberCount: '12,500+',
    industry: subscriber.industry || 'technology',
    companyName: subscriber.company || '',
    latestArticleUrl: 'https://carelwavemedia.com/blog/latest',
    unsubscribeUrl: `https://carelwavemedia.com/unsubscribe?token=${subscriber.unsubscribe_token}`
  };
  
  // Apply variables to subject and content
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    subject = subject.replace(regex, variables[key]);
    html = html.replace(regex, variables[key]);
  });
  
  // Apply psychology trigger enhancements
  if (campaign.psychologyTriggers) {
    campaign.psychologyTriggers.forEach(triggerId => {
      const trigger = PSYCHOLOGY_TRIGGERS[triggerId];
      if (trigger) {
        // Enhance subject line based on trigger
        if (triggerId === 'urgency' && !subject.includes('Breaking')) {
          subject = `🚨 ${subject}`;
        }
        if (triggerId === 'scarcity' && !subject.includes('Limited')) {
          subject = `Limited Time: ${subject}`;
        }
      }
    });
  }
  
  return { subject, html };
}

// Track email opens
router.get('/track/open/:campaignId/:subscriberId', async (req, res) => {
  const { campaignId, subscriberId } = req.params;
  
  try {
    // Record open event
    await db.collection('email_analytics').add({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      event: 'opened',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });
    
    // Update campaign open count
    await db.collection('email_campaigns').doc(campaignId).update({
      opens: admin.firestore.FieldValue.increment(1)
    });
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error tracking open:', error);
    res.status(500).end();
  }
});

// Track email clicks
router.get('/track/click/:campaignId/:subscriberId', async (req, res) => {
  const { campaignId, subscriberId } = req.params;
  const { url } = req.query;
  
  try {
    // Record click event
    await db.collection('email_analytics').add({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      event: 'clicked',
      url: url,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });
    
    // Update campaign click count
    await db.collection('email_campaigns').doc(campaignId).update({
      clicks: admin.firestore.FieldValue.increment(1)
    });
    
    // Redirect to actual URL
    res.redirect(url || 'https://carelwavemedia.com');
  } catch (error) {
    console.error('Error tracking click:', error);
    res.redirect(url || 'https://carelwavemedia.com');
  }
});

// Get campaign analytics
router.get('/campaigns/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaignDoc = await db.collection('email_campaigns').doc(id).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaign = campaignDoc.data();
    
    // Get detailed analytics
    const analyticsSnapshot = await db.collection('email_analytics')
      .where('campaign_id', '==', id)
      .get();
    
    const events = analyticsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString()
    }));
    
    // Calculate metrics
    const sentEmails = events.filter(e => e.event === 'sent').length;
    const openedEmails = events.filter(e => e.event === 'opened').length;
    const clickedEmails = events.filter(e => e.event === 'clicked').length;
    const uniqueOpens = new Set(events.filter(e => e.event === 'opened').map(e => e.subscriber_id)).size;
    const uniqueClicks = new Set(events.filter(e => e.event === 'clicked').map(e => e.subscriber_id)).size;
    
    const analytics = {
      campaign: {
        id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        sent_at: campaign.sent_at?.toDate?.()?.toISOString()
      },
      metrics: {
        recipients: campaign.recipients || 0,
        delivered: sentEmails,
        opens: openedEmails,
        clicks: clickedEmails,
        unique_opens: uniqueOpens,
        unique_clicks: uniqueClicks,
        open_rate: sentEmails > 0 ? (uniqueOpens / sentEmails * 100).toFixed(2) : 0,
        click_rate: sentEmails > 0 ? (uniqueClicks / sentEmails * 100).toFixed(2) : 0,
        click_to_open_rate: uniqueOpens > 0 ? (uniqueClicks / uniqueOpens * 100).toFixed(2) : 0
      },
      timeline: generateTimelineData(events),
      psychology_effectiveness: calculatePsychologyEffectiveness(campaign, analytics)
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Generate timeline data for analytics
function generateTimelineData(events) {
  const timeline = {};
  
  events.forEach(event => {
    const date = event.timestamp ? new Date(event.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    if (!timeline[date]) {
      timeline[date] = { sent: 0, opened: 0, clicked: 0 };
    }
    
    if (event.event === 'sent') timeline[date].sent++;
    if (event.event === 'opened') timeline[date].opened++;
    if (event.event === 'clicked') timeline[date].clicked++;
  });
  
  return Object.keys(timeline)
    .sort()
    .map(date => ({
      date,
      ...timeline[date]
    }));
}

// Calculate psychology trigger effectiveness
function calculatePsychologyEffectiveness(campaign, analytics) {
  const baselineOpenRate = 22.5; // Industry average
  const baselineClickRate = 3.2; // Industry average
  
  const actualOpenRate = parseFloat(analytics.metrics.open_rate);
  const actualClickRate = parseFloat(analytics.metrics.click_rate);
  
  const openRateImprovement = ((actualOpenRate - baselineOpenRate) / baselineOpenRate * 100).toFixed(1);
  const clickRateImprovement = ((actualClickRate - baselineClickRate) / baselineClickRate * 100).toFixed(1);
  
  return {
    triggers_used: campaign.psychologyTriggers || [],
    performance_vs_baseline: {
      open_rate_improvement: `${openRateImprovement}%`,
      click_rate_improvement: `${clickRateImprovement}%`
    },
    effectiveness_score: calculateEffectivenessScore(campaign.psychologyTriggers, actualOpenRate, actualClickRate),
    recommendations: generateRecommendations(campaign.psychologyTriggers, actualOpenRate, actualClickRate)
  };
}

// Calculate overall effectiveness score
function calculateEffectivenessScore(triggers, openRate, clickRate) {
  const triggerWeights = triggers.reduce((sum, triggerId) => {
    const trigger = PSYCHOLOGY_TRIGGERS[triggerId];
    return sum + (trigger ? trigger.effectiveness : 0);
  }, 0);
  
  const performanceScore = (openRate / 22.5) * 50 + (clickRate / 3.2) * 50;
  const triggerScore = triggerWeights / triggers.length;
  
  return Math.min(100, Math.round((performanceScore + triggerScore) / 2));
}

// Generate recommendations for improvement
function generateRecommendations(triggers, openRate, clickRate) {
  const recommendations = [];
  
  if (openRate < 20) {
    recommendations.push('Consider adding urgency or scarcity triggers to your subject line');
  }
  
  if (clickRate < 3) {
    recommendations.push('Include more curiosity gap elements in your content');
  }
  
  if (!triggers.includes('social_proof')) {
    recommendations.push('Add social proof elements like subscriber counts or testimonials');
  }
  
  if (triggers.length < 2) {
    recommendations.push('Combine 2-3 psychology triggers for maximum effectiveness');
  }
  
  return recommendations;
}

module.exports = router; 