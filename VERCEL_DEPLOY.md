# 🚀 Vercel Deployment Guide - Complete End-to-End

## ✅ Code Successfully Pushed to GitHub!

Your code is now at: https://github.com/Akshay18280/cwmedia
Branch: `update2`

---

## 📋 Pre-Deployment Checklist

Before deploying to Vercel, complete these Firebase setup steps:

### ☑️ Step 1: Update Super Admin Email (CRITICAL - 1 minute)

```bash
# Edit this file
nano functions/src/admin.ts

# Or use any editor - Line 9:
const SUPER_ADMIN_EMAIL = 'YOUR_EMAIL@GMAIL.COM';  # Replace with your email
```

**Save the file after editing!**

---

### ☑️ Step 2: Deploy Firebase Backend (10 minutes)

#### A. Login to Firebase
```bash
firebase login
```

#### B. Select Your Project
```bash
firebase use cw-prod-v2
```

#### C. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔ firestore: rules file firestore.rules compiled successfully
✔ firestore: released rules firestore.rules to cloud.firestore
✔ Deploy complete!
```

#### D. Deploy Cloud Functions
```bash
# Install dependencies
cd functions
npm install

# Build functions
npm run build

# Deploy to Firebase
cd ..
firebase deploy --only functions
```

**Expected Output:**
```
✔ functions[setAdminRole(us-central1)]: Successful create operation.
✔ functions[removeAdminRole(us-central1)]: Successful create operation.
✔ functions[checkAdminStatus(us-central1)]: Successful create operation.
✔ functions[sendOTP(us-central1)]: Successful create operation.
✔ functions[verifyOTP(us-central1)]: Successful create operation.
✔ functions[updateMetadataOnPostWrite(us-central1)]: Successful create operation.
✔ functions[updateMetadataOnVideoPostWrite(us-central1)]: Successful create operation.

✔ Deploy complete!
```

---

### ☑️ Step 3: Get reCAPTCHA v3 Site Key (5 minutes)

1. Go to: https://www.google.com/recaptcha/admin
2. Click **+ Create** (plus icon)
3. Fill in the form:
   - **Label**: Carelwave Media Production
   - **reCAPTCHA type**: Choose **reCAPTCHA v3**
   - **Domains**: Add these:
     ```
     localhost
     cw-prod-v2.firebaseapp.com
     vercel.app
     ```
     (Add your custom domain if you have one)
4. Click **Submit**
5. **Copy the Site Key** (starts with `6L...`)
6. Keep this window open - you'll need it for Vercel

---

### ☑️ Step 4: Enable Firebase App Check (3 minutes)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select: **cw-prod-v2**
3. Left sidebar: **Build** → **App Check**
4. Click **Get started**
5. Under **Apps**, click **Add** next to your web app
6. Choose **reCAPTCHA v3**
7. Paste your **Site Key** from Step 3
8. Click **Save**
9. Enable enforcement:
   - Toggle ON for **Cloud Firestore**
   - Toggle ON for **Cloud Functions**
   - Toggle ON for **Cloud Storage**

---

## 🚀 Deploy to Vercel (20 minutes)

### Method 1: Via Vercel Dashboard (Recommended for First Time)

#### A. Connect GitHub Repository

1. Go to: https://vercel.com/new
2. Click **Continue with GitHub**
3. Search for: **cwmedia**
4. Click **Import**

#### B. Configure Project

1. **Framework Preset**: Should auto-detect as **Vite**
2. **Root Directory**: Leave as `./`
3. **Build Command**: Leave as `npm run build`
4. **Output Directory**: Leave as `dist`

#### C. Add Environment Variables

Click **Add Environment Variable** and add each one:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY
Value: AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck

VITE_FIREBASE_AUTH_DOMAIN
Value: cw-prod-v2.firebaseapp.com

VITE_FIREBASE_PROJECT_ID
Value: cw-prod-v2

VITE_FIREBASE_STORAGE_BUCKET
Value: cw-prod-v2.firebasestorage.app

VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 726639239023

VITE_FIREBASE_APP_ID
Value: 1:726639239023:web:b104ea415f7961e346529a

VITE_FIREBASE_MEASUREMENT_ID
Value: G-C0RZYXB6VL

# Security (Required)
VITE_RECAPTCHA_SITE_KEY
Value: [YOUR_RECAPTCHA_SITE_KEY_FROM_STEP_3]

# Email Service
VITE_RESEND_API_KEY
Value: re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c

# Analytics
VITE_ENABLE_ANALYTICS
Value: true

VITE_ENABLE_PWA
Value: true
```

**Important**: For each variable:
- Make sure to set it for: **Production**, **Preview**, and **Development**
- Click **Add** after each one

#### D. Deploy

1. Click **Deploy**
2. Wait 3-5 minutes for build to complete
3. You'll see "Congratulations!" when done
4. Copy your deployment URL (e.g., `cwmedia-xxxxx.vercel.app`)

---

### Method 2: Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (choose your GitHub repo)
vercel link

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY production
# Paste: AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# Paste: cw-prod-v2.firebaseapp.com

vercel env add VITE_FIREBASE_PROJECT_ID production
# Paste: cw-prod-v2

vercel env add VITE_FIREBASE_STORAGE_BUCKET production
# Paste: cw-prod-v2.firebasestorage.app

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
# Paste: 726639239023

vercel env add VITE_FIREBASE_APP_ID production
# Paste: 1:726639239023:web:b104ea415f7961e346529a

vercel env add VITE_FIREBASE_MEASUREMENT_ID production
# Paste: G-C0RZYXB6VL

vercel env add VITE_RECAPTCHA_SITE_KEY production
# Paste: [YOUR_RECAPTCHA_SITE_KEY]

vercel env add VITE_RESEND_API_KEY production
# Paste: re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c

vercel env add VITE_ENABLE_ANALYTICS production
# Type: true

vercel env add VITE_ENABLE_PWA production
# Type: true

# Deploy
vercel --prod
```

---

## ✅ Post-Deployment Steps

### Step 1: Verify Deployment (2 minutes)

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Check:
   - [ ] Site loads without errors
   - [ ] No console errors (F12 → Console)
   - [ ] Firebase connects (no connection errors)

### Step 2: Update reCAPTCHA Domains (1 minute)

1. Go back to: https://www.google.com/recaptcha/admin
2. Find your site and click **Settings** (gear icon)
3. Add your Vercel domain:
   ```
   your-app.vercel.app
   ```
4. Click **Save**

### Step 3: Add Domain to Firebase (1 minute)

1. Firebase Console → **Authentication**
2. Click **Settings** tab → **Authorized domains**
3. Click **Add domain**
4. Add: `your-app.vercel.app`
5. Click **Add**

---

## 🔐 Grant Your Admin Access (5 minutes)

Now that your site is live, create your admin account:

### Option 1: Using Firebase Console

1. **Sign up on your live site**: Go to `https://your-app.vercel.app/signup`
2. Use the email you set in `functions/src/admin.ts`
3. Complete sign-up
4. Go to Firebase Console: https://console.firebase.google.com
5. Select: **cw-prod-v2**
6. **Authentication** → **Users** → Find your user
7. Copy your **User UID**
8. **Firestore Database** → **users** collection → Your document
9. Click **Edit document** and add:
   ```
   role: "admin"
   isAdmin: true
   ```
10. Save
11. Back to **Authentication** → Your user → **Custom claims**
12. Click **Set custom user claims**:
    ```json
    {"admin": true}
    ```
13. Save
14. **Sign out and sign back in** on your site

### Option 2: Using Script (If you have Firebase service account)

1. Download service account key:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

2. Run:
```bash
node scripts/set-admin.js YOUR_EMAIL@GMAIL.COM
```

3. Sign out and sign back in on your site

---

## 🧪 Complete End-to-End Testing

### Authentication Tests

Visit your deployed site and test:

1. **Email Sign Up** ✅
   - Go to `/signup`
   - Create account with new email
   - Verify you can sign up

2. **Email Sign In** ✅
   - Go to `/login`
   - Sign in with email/password
   - Verify successful login

3. **Google Sign In** ✅
   - Click "Sign in with Google"
   - Authorize
   - Verify successful login

4. **Phone Authentication** ✅
   - Go to phone auth page
   - Enter phone number
   - Receive OTP
   - Verify OTP works

5. **Sign Out** ✅
   - Click sign out
   - Verify you're logged out

### Admin Tests (As Admin)

1. **Admin Panel Access** ✅
   - Go to `/admin`
   - Verify you can access admin panel
   - Should see admin dashboard

2. **Create Post** ✅
   - Create a test blog post
   - Upload image
   - Publish post

3. **View Analytics** ✅
   - Check analytics dashboard
   - Verify data displays

### Security Tests

1. **Non-Admin Access** ✅
   - Log in as non-admin user
   - Try to access `/admin`
   - Should redirect or show "Access Denied"

2. **Security Headers** ✅
```bash
curl -I https://your-app.vercel.app
```
Should see:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=63072000
Content-Security-Policy: ...
```

3. **Firebase App Check** ✅
   - Check browser console
   - Should see App Check token being generated
   - No App Check errors

### Functionality Tests

1. **Newsletter Subscription** ✅
   - Sign in as user
   - Subscribe to newsletter
   - Verify it works (requires authentication)

2. **Contact Form** ✅
   - Sign in as user
   - Submit contact form
   - Verify submission (requires authentication)

3. **Blog Comments** ✅
   - View a blog post
   - Add a comment
   - Verify comment appears

4. **Search** ✅
   - Use search feature
   - Verify results appear

---

## 📊 Performance Audit

```bash
# Run Lighthouse audit
npx lighthouse https://your-app.vercel.app --view
```

**Target Scores:**
- ✅ Performance: > 90
- ✅ Accessibility: > 90
- ✅ Best Practices: > 90
- ✅ SEO: > 90

---

## 🔄 Auto-Deploy Setup (Recommended)

### Set Up Automatic Deployments

1. **Go to Vercel Dashboard** → Your Project
2. **Settings** → **Git**
3. Configure:
   - **Production Branch**: `main` (or `update2`)
   - **Auto-deploy**: Enabled ✅
   - **Deploy Previews**: Enabled ✅

Now:
- Every push to `main` = Production deployment
- Every push to other branches = Preview deployment
- Every pull request = Preview deployment

---

## 🎯 Custom Domain Setup (Optional)

### Add Your Custom Domain

1. **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Click **Add**
3. Enter your domain: `yourdomain.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

### Update Services with Custom Domain

After domain is active:

1. **reCAPTCHA**:
   - Add `yourdomain.com` to allowed domains

2. **Firebase Authentication**:
   - Add `yourdomain.com` to authorized domains

3. **Update Environment Variables** (if needed):
   ```bash
   vercel env add VITE_SITE_URL production
   # Enter: https://yourdomain.com
   ```

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Check:**
- Environment variables are set correctly
- No syntax errors in code
- Dependencies are installed
- View build logs in Vercel dashboard

**Fix:**
```bash
# Test build locally first
npm run build

# If successful, redeploy
git push origin update2
```

### "Firebase not initialized" Error

**Check:**
- All `VITE_FIREBASE_*` variables are set in Vercel
- Variables are set for correct environment (Production/Preview)

**Fix:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Re-add missing variables
- Redeploy

### "App Check token invalid"

**Check:**
- reCAPTCHA site key is correct
- Domain is added to reCAPTCHA allowed list
- App Check is enabled in Firebase

**Fix:**
- Verify `VITE_RECAPTCHA_SITE_KEY` is correct
- Add Vercel domain to reCAPTCHA
- Clear browser cache

### "Permission denied" in Firestore

**Check:**
- Firestore rules are deployed
- User has correct authentication
- Custom claims are set (for admin)

**Fix:**
```bash
firebase deploy --only firestore:rules
```

### Admin Panel Not Accessible

**Check:**
- Custom claims are set
- User signed out and back in
- User is using correct email

**Fix:**
```bash
# Re-run admin script
node scripts/set-admin.js YOUR_EMAIL@GMAIL.COM
```

---

## 📈 Monitoring Setup

### Vercel Analytics

1. **Vercel Dashboard** → Your Project → **Analytics**
2. Enable Analytics
3. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### Firebase Monitoring

1. **Firebase Console** → **Analytics**
2. Enable Google Analytics
3. Monitor:
   - User engagement
   - Authentication events
   - Crash reports

### Set Up Alerts

**Firebase:**
- Console → Usage and billing → Budget alerts
- Set alerts at 50%, 80%, 100% of budget

**Vercel:**
- Dashboard → Usage
- Monitor bandwidth and function invocations

---

## ✅ Deployment Complete Checklist

- [ ] Super admin email updated in Cloud Functions
- [ ] Firebase rules deployed
- [ ] Cloud Functions deployed (7 functions)
- [ ] reCAPTCHA v3 configured
- [ ] Firebase App Check enabled
- [ ] Environment variables set in Vercel
- [ ] Deployed to Vercel successfully
- [ ] Vercel domain added to reCAPTCHA
- [ ] Vercel domain added to Firebase auth
- [ ] Admin role granted to your account
- [ ] All authentication methods tested
- [ ] Admin panel accessible
- [ ] Security headers verified
- [ ] Lighthouse score > 90
- [ ] Monitoring and analytics enabled

---

## 🎉 Success!

Your Carelwave Media platform is now:
- ✅ **Live** at your Vercel URL
- ✅ **Secure** with Custom Claims and security headers
- ✅ **Production-ready** with all services configured
- ✅ **Monitored** with Vercel and Firebase analytics
- ✅ **Auto-deploying** on every push to main

**Your deployment URL**: Check Vercel dashboard for the URL

**Next Steps:**
1. Share your site with users
2. Monitor analytics and usage
3. Set up custom domain (optional)
4. Keep dependencies updated

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Your Documentation**: See all the `*.md` files in your project

---

**Deployment Date**: 2026-03-03
**Status**: ✅ Production Ready
**Version**: 2.0.0
