# 🔐 Complete Environment Variables Guide for Vercel

## 📋 All Environment Variables Used in Project

This document lists **ALL** environment variables used in the project, where to get them, and their priority.

---

## 🔴 REQUIRED Variables (Must Add to Vercel)

These are **critical** for the app to work. Without these, the app will show "Development Mode".

### 1. Firebase Configuration (REQUIRED)

**Where to get**: Firebase Console → Project Settings → General → Your apps → Web app config

Visit: https://console.firebase.google.com/project/cw-prod-v2/settings/general

```env
VITE_FIREBASE_API_KEY=AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck
VITE_FIREBASE_AUTH_DOMAIN=cw-prod-v2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cw-prod-v2
VITE_FIREBASE_STORAGE_BUCKET=cw-prod-v2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=726639239023
VITE_FIREBASE_APP_ID=1:726639239023:web:b104ea415f7961e346529a
VITE_FIREBASE_MEASUREMENT_ID=G-C0RZYXB6VL
```

**Purpose**: Connect your app to Firebase backend (authentication, database, storage)

---

### 2. Email Service (REQUIRED for contact/newsletter)

**Where to get**: Resend Dashboard → API Keys

Visit: https://resend.com/api-keys

```env
VITE_RESEND_API_KEY=re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c
```

**Purpose**: Send emails for newsletter subscriptions and contact form

**Already have**: You provided this key

---

### 3. Feature Flags (REQUIRED)

**Where to set**: Manual configuration

```env
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

**Purpose**: Enable/disable PWA features and analytics tracking

---

## 🟡 RECOMMENDED Variables (Add for Full Functionality)

### 4. reCAPTCHA v3 (REQUIRED for production security)

**Where to get**: Google reCAPTCHA Admin Console

Visit: https://www.google.com/recaptcha/admin

**Steps**:
1. Click **"+ Create"** (top right)
2. Fill in form:
   - **Label**: Carelwave Media Production
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: Add these:
     ```
     localhost
     cw-prod-v2.firebaseapp.com
     vercel.app
     your-custom-domain.com (if you have one)
     ```
3. Click **"Submit"**
4. Copy the **Site Key** (starts with `6L...`)

```env
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Purpose**: Protect against bots and abuse (required for Firebase App Check)

**⚠️ IMPORTANT**: Without this, Firebase App Check won't work and you'll get security warnings.

---

### 5. Google Analytics (Recommended for tracking)

**Where to get**: Google Analytics 4 Property

Visit: https://analytics.google.com/

**Steps**:
1. Go to **Admin** (bottom left gear icon)
2. Select your property or create new one
3. Click **Data Streams** → Select your web stream
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Purpose**: Track page views, user behavior, and analytics

**Note**: You already have `VITE_FIREBASE_MEASUREMENT_ID` for Firebase Analytics, but this is for Google Analytics 4 integration.

---

### 6. GitHub Username (Recommended for profile)

**Where to get**: Your GitHub profile

Visit: https://github.com/settings/profile

```env
VITE_GITHUB_USERNAME=Akshay18280
```

**Purpose**: Display GitHub profile information and repositories

**Your username**: `Akshay18280` (from your GitHub repo URL)

---

## 🟢 OPTIONAL Variables (Add Only If Needed)

### 7. YouTube Integration (Optional)

**Where to get**: Google Cloud Console → APIs & Services → Credentials

Visit: https://console.cloud.google.com/apis/credentials

**Steps**:
1. Create project or select existing
2. Click **"+ CREATE CREDENTIALS"** → **API key**
3. Restrict key to YouTube Data API v3
4. Copy the API key

For OAuth (if you want video uploads):
1. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
2. Choose **Web application**
3. Add authorized origins and redirect URIs
4. Copy **Client ID**

```env
VITE_YOUTUBE_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

**Purpose**: Embed and manage YouTube videos

**When needed**: Only if you want YouTube video integration features

---

### 8. Vimeo Integration (Optional)

**Where to get**: Vimeo Developer Portal → My Apps

Visit: https://developer.vimeo.com/apps

**Steps**:
1. Click **"Create App"**
2. Fill in app details
3. Copy **Client Identifier**
4. Generate **Access Token** (with upload and video management scopes)

```env
VITE_VIMEO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_VIMEO_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Purpose**: Embed and manage Vimeo videos

**When needed**: Only if you want Vimeo video integration features

---

### 9. OpenAI Integration (Optional)

**Where to get**: OpenAI Platform → API Keys

Visit: https://platform.openai.com/api-keys

**Steps**:
1. Click **"+ Create new secret key"**
2. Name it (e.g., "Carelwave Media Production")
3. Copy the key (starts with `sk-`)
4. Also copy your Organization ID from Settings

```env
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_OPENAI_ORG_ID=org-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Purpose**: AI-powered content recommendations and smart features

**When needed**: Only if you want AI content suggestions

**⚠️ Security Warning**: OpenAI keys should ideally be server-side only, not in frontend. Consider moving to Cloud Functions.

---

### 10. Push Notifications (Optional)

**Where to get**: Firebase Console → Cloud Messaging → Web Push certificates

Visit: https://console.firebase.google.com/project/cw-prod-v2/settings/cloudmessaging

**Steps**:
1. Go to **Cloud Messaging** tab
2. Scroll to **Web Push certificates**
3. Click **"Generate key pair"**
4. Copy the **Key pair**

```env
VITE_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Purpose**: Send push notifications to users

**When needed**: Only if you want browser push notifications

---

### 11. WebSocket Configuration (Optional)

**Where to get**: Your WebSocket server configuration

```env
VITE_WS_HOST=your-websocket-server.com
VITE_WS_PORT=3001
```

**Purpose**: Real-time features (comments, live updates)

**Default**: Uses `window.location.host` if not set

**When needed**: Only if you have a separate WebSocket server

---

### 12. Google Analytics Service Account (DO NOT USE)

```env
# ❌ DO NOT ADD THIS TO VERCEL!
# VITE_GOOGLE_ANALYTICS_SERVICE_KEY=<service-account-json>
```

**⚠️ CRITICAL SECURITY WARNING**:
- **DO NOT** add service account keys to frontend environment variables
- Service account keys should **ONLY** be in backend (Cloud Functions)
- Adding this to Vercel exposes full Google Cloud access

**If you need this**: Move to Cloud Functions and use Firebase Admin SDK

---

### 13. Debug Mode (Development Only)

```env
VITE_DEBUG_MODE=false
```

**Purpose**: Enable verbose logging and debugging features

**Production**: Should always be `false`

**When to use**: Only set to `true` in development/preview environments

---

### 14. IP Authentication (DEPRECATED)

```env
VITE_IP_AUTH_ENABLED=false
VITE_ADMIN_ALLOWED_IPS=
```

**Status**: ⚠️ **DEPRECATED** - Do not use

**Replacement**: Use Firebase Custom Claims instead (more secure)

**Should be**: `false` or omit entirely

---

## 📊 Priority Summary

### 🔴 Add NOW (Minimum to make app work)
1. ✅ `VITE_FIREBASE_API_KEY` → Already have
2. ✅ `VITE_FIREBASE_AUTH_DOMAIN` → Already have
3. ✅ `VITE_FIREBASE_PROJECT_ID` → Already have
4. ✅ `VITE_FIREBASE_STORAGE_BUCKET` → Already have
5. ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID` → Already have
6. ✅ `VITE_FIREBASE_APP_ID` → Already have
7. ✅ `VITE_FIREBASE_MEASUREMENT_ID` → Already have
8. ✅ `VITE_RESEND_API_KEY` → Already have
9. ⚪ `VITE_ENABLE_PWA` → Set to `true`
10. ⚪ `VITE_ENABLE_ANALYTICS` → Set to `true`

### 🟡 Add SOON (Within 24 hours for production)
11. 🔲 `VITE_RECAPTCHA_SITE_KEY` → Get from Google reCAPTCHA
12. 🔲 `VITE_GA_MEASUREMENT_ID` → Get from Google Analytics (optional)
13. 🔲 `VITE_GITHUB_USERNAME` → Use `Akshay18280`

### 🟢 Add LATER (Optional features)
14. 🔲 `VITE_YOUTUBE_API_KEY` → Only if using YouTube
15. 🔲 `VITE_YOUTUBE_CLIENT_ID` → Only if using YouTube
16. 🔲 `VITE_VIMEO_CLIENT_ID` → Only if using Vimeo
17. 🔲 `VITE_VIMEO_ACCESS_TOKEN` → Only if using Vimeo
18. 🔲 `VITE_OPENAI_API_KEY` → Only if using AI features
19. 🔲 `VITE_OPENAI_ORG_ID` → Only if using AI features
20. 🔲 `VITE_VAPID_PUBLIC_KEY` → Only if using push notifications

---

## 🚀 Quick Start: Minimum Variables for Vercel

**Copy and paste these 10 variables into Vercel right now**:

```env
VITE_FIREBASE_API_KEY=AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck
VITE_FIREBASE_AUTH_DOMAIN=cw-prod-v2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cw-prod-v2
VITE_FIREBASE_STORAGE_BUCKET=cw-prod-v2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=726639239023
VITE_FIREBASE_APP_ID=1:726639239023:web:b104ea415f7961e346529a
VITE_FIREBASE_MEASUREMENT_ID=G-C0RZYXB6VL
VITE_RESEND_API_KEY=re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

**Then add these 3 within 24 hours**:

```env
VITE_RECAPTCHA_SITE_KEY=<get-from-google-recaptcha>
VITE_GA_MEASUREMENT_ID=<get-from-google-analytics-or-omit>
VITE_GITHUB_USERNAME=Akshay18280
```

---

## 📝 How to Add to Vercel

### Method 1: Dashboard (Recommended)

1. Visit: https://vercel.com/dashboard
2. Select your `cwmedia` project
3. Go to **Settings** → **Environment Variables**
4. For each variable:
   - **Key**: Variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - **Value**: Variable value
   - **Environment**: Check all 3 (Production, Preview, Development)
   - Click **Save**
5. After adding all variables: **Deployments** tab → **Redeploy**

### Method 2: CLI

```bash
vercel env add VITE_FIREBASE_API_KEY production
# Paste: AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# Paste: cw-prod-v2.firebaseapp.com

# ... repeat for all variables ...

# Then redeploy
vercel --prod
```

---

## 🧪 Verify Variables Are Working

After adding variables and redeploying:

1. Visit your Vercel URL
2. Open browser console (F12)
3. Look for: `🔥 Firebase initialized successfully`
4. If you see `🔥 Firebase running in demo mode` → Variables not set correctly

---

## 📞 Need Help Getting Any Variable?

| Variable | Help Link |
|----------|-----------|
| Firebase Config | https://console.firebase.google.com/project/cw-prod-v2/settings/general |
| reCAPTCHA | https://www.google.com/recaptcha/admin |
| Resend API | https://resend.com/api-keys |
| Google Analytics | https://analytics.google.com/ |
| YouTube API | https://console.cloud.google.com/apis/credentials |
| Vimeo API | https://developer.vimeo.com/apps |
| OpenAI API | https://platform.openai.com/api-keys |

---

**Updated**: 2026-03-03
**Total Variables**: 24 found in code
**Required Now**: 10 variables
**Recommended Soon**: 3 variables
**Optional**: 11 variables
