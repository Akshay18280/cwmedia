// supabase/functions/send-newsletter/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'welcome' | 'new_post'
  email?: string
  subscribers?: string[]
  subject: string
  template: string
  post?: {
    id: string
    title: string
    excerpt: string
    published_at: string
  }
}

const generateWelcomeEmail = (email: string) => {
  return {
    to: email,
    subject: 'Welcome to Carelwave Media!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Carelwave Media</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 40px; border-radius: 12px; }
            .content { background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Carelwave Media!</h1>
              <p>Your journey to scalable systems mastery begins now</p>
            </div>
            <div class="content">
              <h2>Hey there, engineer! 👋</h2>
              <p>Welcome to our community of 10,000+ engineers who are passionate about building scalable, high-performance systems!</p>
              
              <p>Here's what you can expect:</p>
              <ul>
                <li><strong>Weekly Technical Insights:</strong> Deep dives into Golang, AWS, microservices, and system design</li>
                <li><strong>Real-World Case Studies:</strong> Stories from production systems handling millions of events</li>
                <li><strong>Best Practices:</strong> Proven patterns from CSG International's telecom platform</li>
                <li><strong>Exclusive Content:</strong> Tips and tricks you won't find anywhere else</li>
              </ul>
              
              <p>Ready to level up your engineering skills?</p>
              <p style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL')}/blog" class="button">Start Reading Articles</a>
              </p>
              
              <p><strong>Akshay Verma</strong><br>
              Software Development Engineer, CSG International</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to Carelwave Media newsletter.</p>
              <p><a href="${Deno.env.get('SITE_URL')}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

const generateNewPostEmail = (subscribers: string[], post: { id: string; title: string; excerpt: string; published_at: string }) => {
  const emails = subscribers.map(email => ({
    to: email,
    subject: `New Article: ${post.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Article: ${post.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; border-radius: 12px; }
            .content { background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .article-preview { border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📖 New Article Published!</h1>
              <p>Fresh insights from Carelwave Media</p>
            </div>
            <div class="content">
              <h2>Hey there! 👋</h2>
              <p>I just published a new article that I think you'll find valuable:</p>
              
              <div class="article-preview">
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <p><small>Published on ${new Date(post.published_at).toLocaleDateString()}</small></p>
              </div>
              
              <p style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL')}/blog/${post.id}" class="button">Read Full Article</a>
              </p>
              
              <p>This article covers advanced technical concepts that will help you build better, more scalable systems. Don't miss out!</p>
              
              <p>Happy coding! 🚀<br>
              <strong>Akshay Verma</strong></p>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to Carelwave Media newsletter.</p>
              <p><a href="${Deno.env.get('SITE_URL')}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }))
  
  return emails
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, email, subscribers, post } = await req.json() as EmailRequest

    // Initialize Supabase client (currently unused but ready for production)
    // const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let emailsToSend: { to: string; subject: string; html: string }[] = []

    if (type === 'welcome' && email) {
      emailsToSend = [generateWelcomeEmail(email)]
    } else if (type === 'new_post' && subscribers && post) {
      emailsToSend = generateNewPostEmail(subscribers, post)
    }

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - Amazon SES
    // - Resend
    // - Postmark

    // For demonstration, we'll just log the emails and return success
    console.log(`Sending ${emailsToSend.length} emails for type: ${type}`)
    
    // Example integration with SendGrid (commented out):
    /*
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    
    for (const emailData of emailsToSend) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: emailData.to }] }],
          from: { email: 'newsletter@carelwavemedia.com', name: 'Carelwave Media' },
          subject: emailData.subject,
          content: [{ type: 'text/html', value: emailData.html }]
        })
      })
      
      if (!response.ok) {
        throw new Error(`SendGrid error: ${response.statusText}`)
      }
    }
    */

    // For now, simulate sending emails
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully sent ${emailsToSend.length} emails`,
        count: emailsToSend.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending emails:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
