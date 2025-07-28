# 🚀 Getting Started

This guide will help you set up and run Carelwave Media on your local machine and deploy it to production.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - We recommend [VS Code](https://code.visualstudio.com/)
- **Firebase Account** - [Create free account](https://firebase.google.com/)

## ⚡ Quick Setup (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/carelwave-media.git
cd carelwave-media
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Add your configuration:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Email Service (Resend)
VITE_RESEND_API_KEY=re_your_resend_api_key

# SMS Service (Twilio) - for admin OTP
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_PHONE_NUMBER=+1234567890

# Real Data Integration
VITE_GITHUB_USERNAME=your-github-username
VITE_GOOGLE_ANALYTICS_PROPERTY_ID=123456789
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your site! 🎉

## 🔥 Firebase Setup (Required)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "carelwave-media")
4. Enable Google Analytics (recommended)
5. Create project

### 2. Enable Services
In your Firebase project:

**Authentication:**
1. Go to Authentication → Sign-in method
2. Enable "Phone" and "Google"
3. Add your domain to authorized domains

**Firestore Database:**
1. Go to Firestore Database → Create database
2. Start in production mode
3. Choose location closest to your users

**Storage:**
1. Go to Storage → Get started
2. Start in production mode

### 3. Get Firebase Config
1. Go to Project settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon
4. Register your app
5. Copy the config values to your `.env` file

### 4. Set up Security Rules
Copy the rules from `firebase/firestore.rules` to your Firestore Database rules.

## 📧 Email Setup (Resend)

### 1. Create Resend Account
1. Go to [Resend](https://resend.com/)
2. Sign up for free account
3. Verify your email

### 2. Get API Key
1. Go to Dashboard → API Keys
2. Create new API key
3. Copy to your `.env` file as `VITE_RESEND_API_KEY`

### 3. Add Domain (Production)
1. Go to Dashboard → Domains
2. Add your domain (e.g., carelwave.com)
3. Verify DNS records

## 📱 SMS Setup (Twilio) - Optional

For admin OTP authentication:

### 1. Create Twilio Account
1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for free trial
3. Verify your phone number

### 2. Get Credentials
1. Go to Dashboard
2. Copy Account SID and Auth Token
3. Get a Twilio phone number
4. Add all to your `.env` file

## 🔧 Real Data Integration

### GitHub API
Update your GitHub username in `.env`:
```env
VITE_GITHUB_USERNAME=your-actual-github-username
```

This will automatically pull:
- Repository count
- Total stars across all repos
- Follower count

### Google Analytics (Optional)
For real visitor analytics, you'll need a backend API. See [Real Data Integration](./real-data.md) for details.

## 🧪 Test Everything

Visit these URLs to test all features:

- **Main site**: `http://localhost:5173`
- **Admin dashboard**: `http://localhost:5173/admin/dashboard`
- **Testing dashboard**: `http://localhost:5173/testing`
- **Analytics setup**: `http://localhost:5173/analytics-setup`

## 🏗️ Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Option 2: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Option 3: Netlify
1. Go to [Netlify](https://netlify.com/)
2. Drag and drop your `dist` folder
3. Or connect to GitHub for auto-deploy

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Site loads at localhost:5173
- [ ] Newsletter subscription works
- [ ] Contact form sends emails
- [ ] Admin login with phone OTP works
- [ ] Blog posts display correctly
- [ ] GitHub stats show real numbers
- [ ] Testing dashboard shows all green

## 🆘 Troubleshooting

### Common Issues

**Build fails with Firebase errors:**
- Check that all Firebase env variables are set
- Ensure Firebase project is created and configured

**Newsletter emails don't send:**
- Verify Resend API key is correct
- Check that your domain is verified in Resend

**Admin OTP doesn't work:**
- Verify Twilio credentials
- Ensure your phone number is verified in Twilio

**GitHub stats show 0:**
- Check that `VITE_GITHUB_USERNAME` matches your actual GitHub username
- Ensure username is public

### Need More Help?

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Visit the testing dashboard at `/testing`
- Review the browser console for errors

---

**Next Step:** [Production Setup Guide](./production-setup.md) 