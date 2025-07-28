# 🔧 Environment Setup

This guide explains how to configure all environment variables for production deployment.

## 📋 Environment Variables

Create a `.env` file in your project root with these variables:

```env
# Firebase Configuration (Required)
# Get these from Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Email Service (Required for newsletter)
# Get from Resend.com
VITE_RESEND_API_KEY=re_your_resend_api_key

# SMS Service (Required for admin OTP)
# Get from Twilio.com
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_PHONE_NUMBER=+1234567890

# Real Data Integration
# Your actual GitHub username for real stats
VITE_GITHUB_USERNAME=your-actual-github-username

# Google Analytics (Optional - for real visitor analytics)
# Requires backend API setup
VITE_GOOGLE_ANALYTICS_PROPERTY_ID=123456789
VITE_GOOGLE_ANALYTICS_SERVICE_KEY={"type":"service_account",...}

# Production Domain
VITE_DOMAIN=https://your-domain.com
```

## 🔥 Firebase Setup

### 1. Create Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name
4. Enable Google Analytics (recommended)

### 2. Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click web app icon (`</>`)
4. Register your app
5. Copy the config object values

### 3. Enable Services
**Authentication:**
- Go to Authentication > Sign-in method
- Enable "Phone" and "Google"

**Firestore Database:**
- Go to Firestore Database
- Create database in production mode

**Storage:**
- Go to Storage
- Get started in production mode

## 📧 Resend Setup

### 1. Create Account
1. Go to [Resend](https://resend.com/)
2. Sign up for free
3. Verify your email

### 2. Get API Key
1. Go to Dashboard > API Keys
2. Create new API key
3. Copy to `VITE_RESEND_API_KEY`

### 3. Add Domain (Production)
1. Go to Dashboard > Domains
2. Add your domain
3. Verify DNS records

## 📱 Twilio Setup

### 1. Create Account
1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for free trial
3. Verify your phone number

### 2. Get Credentials
1. Go to Console Dashboard
2. Copy Account SID and Auth Token
3. Get a Twilio phone number
4. Add all three to your `.env`

## 🔧 GitHub Integration

Simply add your real GitHub username:
```env
VITE_GITHUB_USERNAME=your-actual-username
```

This automatically fetches:
- Public repository count
- Total stars across all repos  
- Follower count

## 📊 Google Analytics (Optional)

For real visitor analytics, you need a backend API because the Google Analytics Data API requires server-side implementation.

### Frontend Setup
```env
VITE_GOOGLE_ANALYTICS_PROPERTY_ID=your_property_id
```

### Backend Required
The Google Analytics Data API cannot be called directly from the browser. You need to set up a backend service that:

1. Uses the Google Analytics Data API with service account credentials
2. Provides REST endpoints for your frontend
3. Handles CORS and security properly

See [Real Data Integration](./real-data.md) for backend setup details.

## 🚀 Production Deployment

### Vercel
1. Add environment variables in Vercel dashboard
2. Go to Settings > Environment Variables
3. Add all variables from your `.env` file

### Netlify
1. Go to Site settings > Environment variables
2. Add all variables from your `.env` file

### Firebase Hosting
1. Use `firebase functions:config:set` for sensitive data
2. Use build-time environment variables for public config

## ✅ Verification

After setup, verify everything works:

1. **Local Development:**
   ```bash
   npm run dev
   ```

2. **Test Features:**
   - Newsletter subscription
   - Contact form emails
   - Admin phone OTP
   - GitHub stats display
   - Real-time analytics

3. **Testing Dashboard:**
   Visit `/testing` to check all service connections

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use different API keys for development and production
- Regularly rotate API keys and tokens
- Monitor API usage and set billing alerts
- Use environment-specific Firebase projects

## 🆘 Troubleshooting

**Firebase connection errors:**
- Verify all VITE_FIREBASE_* variables are set
- Check Firebase project configuration
- Ensure services are enabled

**Email sending fails:**
- Verify Resend API key
- Check domain verification status
- Review Resend dashboard for errors

**SMS OTP doesn't work:**
- Verify Twilio credentials
- Check phone number format (+1234567890)
- Ensure sufficient Twilio credit

**GitHub stats show 0:**
- Verify username is correct and public
- Check GitHub API rate limits
- Ensure username exists

---

**Next:** [Production Setup Guide](./production-setup.md) 