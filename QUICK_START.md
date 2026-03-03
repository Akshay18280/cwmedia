# ⚡ Quick Start - Deploy in 30 Minutes

This guide gets your Carelwave Media platform production-ready as fast as possible.

## 🚨 Critical First Steps (5 minutes)

### 1. Rotate Exposed Credentials

**Firebase** (2 minutes):
1. Go to https://console.firebase.google.com
2. Project Settings → Add new web app
3. Copy new config values to `.env`

**Resend** (1 minute):
1. Go to https://resend.com/api-keys
2. Create new key
3. Update `VITE_RESEND_API_KEY` in `.env`

### 2. Update Super Admin Email (1 minute)

Edit `functions/src/admin.ts`:
```typescript
const SUPER_ADMIN_EMAIL = 'YOUR_EMAIL@HERE.com';
```

---

## 🔧 Deploy Core Services (10 minutes)

### Deploy Firestore Rules (2 minutes)
```bash
firebase login
firebase deploy --only firestore:rules
```

### Deploy Cloud Functions (5 minutes)
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Set Up Firebase App Check (3 minutes)
1. Get reCAPTCHA v3 key: https://www.google.com/recaptcha/admin
2. Add to `.env`: `VITE_RECAPTCHA_SITE_KEY=your-key`
3. Enable in Firebase Console → App Check

---

## 🎯 Grant Admin Access (5 minutes)

### Option 1: Firebase Console
1. Sign up on your site with your email
2. Firebase Console → Authentication → Copy your UID
3. Firestore → users → your doc → Add:
   - `role: "admin"`
   - `isAdmin: true`
4. Authentication → Custom claims → Add: `{"admin": true}`

### Option 2: Quick Script
```bash
# Create set-admin.js
node scripts/set-admin.js YOUR_EMAIL@HERE.com
```

---

## 🚀 Deploy to Vercel (10 minutes)

### Set Environment Variables (5 minutes)
```bash
vercel env add VITE_FIREBASE_API_KEY production
vercel env add VITE_FIREBASE_AUTH_DOMAIN production
vercel env add VITE_FIREBASE_PROJECT_ID production
vercel env add VITE_FIREBASE_STORAGE_BUCKET production
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
vercel env add VITE_FIREBASE_APP_ID production
vercel env add VITE_FIREBASE_MEASUREMENT_ID production
vercel env add VITE_RECAPTCHA_SITE_KEY production
```

### Deploy (5 minutes)
```bash
# Test build
npm run build

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## ✅ Verify Everything Works (5 minutes)

Test these on your live site:

- [ ] Sign up with a new account
- [ ] Sign in with Google
- [ ] Send OTP to phone number
- [ ] Access admin panel (if you're admin)
- [ ] Create a test post (as admin)
- [ ] Subscribe to newsletter

---

## 🎉 Done!

Your site is now production-ready with:
- ✅ Secure admin verification
- ✅ Protected Firestore data
- ✅ Rate limiting
- ✅ Security headers
- ✅ Firebase App Check

**Full Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions

**Need Help?** Check the troubleshooting section in the full guide.
