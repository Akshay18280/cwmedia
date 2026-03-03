# ✅ Deployment Checklist - Carelwave Media

## 🎯 Your New Credentials (Updated!)

✅ **Firebase Config**: cw-prod-v2
✅ **Resend API Key**: Updated to `re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c`
✅ **Environment File**: `.env` updated with new credentials

---

## 📋 Complete These Steps in Order

### ☑️ Step 1: Update Super Admin Email (1 minute)

Edit `functions/src/admin.ts` and change line 9:

```typescript
const SUPER_ADMIN_EMAIL = 'YOUR_ACTUAL_EMAIL@GMAIL.COM';
```

**Replace with your email address that you'll use to sign up.**

---

### ☑️ Step 2: Set Up reCAPTCHA v3 (5 minutes)

1. Go to: https://www.google.com/recaptcha/admin
2. Click **+** (Create)
3. Fill in:
   - **Label**: "Carelwave Media Production"
   - **reCAPTCHA type**: Select **v3**
   - **Domains**: Add:
     - `localhost`
     - `cw-prod-v2.firebaseapp.com`
     - `*.vercel.app`
     - Your custom domain (if you have one)
4. Click **Submit**
5. **Copy the Site Key** (starts with `6L...`)
6. Update `.env` file:

```bash
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### ☑️ Step 3: Deploy Firestore Rules (2 minutes)

```bash
# Make sure you're logged in to Firebase
firebase login

# Select your project (cw-prod-v2)
firebase use cw-prod-v2

# Deploy rules
firebase deploy --only firestore:rules
```

**Expected Output**:
```
✔ Deploy complete!
```

---

### ☑️ Step 4: Deploy Cloud Functions (5 minutes)

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

**Expected Output**:
```
✔ functions: Finished running predeploy script.
✔ functions[setAdminRole]: Successful create operation.
✔ functions[removeAdminRole]: Successful create operation.
✔ functions[checkAdminStatus]: Successful create operation.
✔ functions[sendOTP]: Successful create operation.
✔ functions[verifyOTP]: Successful create operation.
✔ functions[updateMetadataOnPostWrite]: Successful create operation.
✔ functions[updateMetadataOnVideoPostWrite]: Successful create operation.
```

---

### ☑️ Step 5: Enable Firebase App Check (5 minutes)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: **cw-prod-v2**
3. Navigate to: **Build** → **App Check**
4. Click **Get started**
5. Register your web app:
   - Select your web app
   - Provider: **reCAPTCHA v3**
   - Paste your **Site Key** from Step 2
   - Click **Save**
6. **Enable enforcement** for:
   - ✅ Cloud Firestore
   - ✅ Cloud Functions
   - ✅ Cloud Storage

---

### ☑️ Step 6: Test Build Locally (3 minutes)

```bash
# Build the project
npm run build

# Test production build
npm run preview
```

Open http://localhost:4173 and verify:
- [ ] No build errors
- [ ] Firebase connects successfully
- [ ] Page loads without console errors

---

### ☑️ Step 7: Deploy to Vercel (10 minutes)

#### A. Set Environment Variables in Vercel

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY production
# When prompted, paste: AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# When prompted, paste: cw-prod-v2.firebaseapp.com

vercel env add VITE_FIREBASE_PROJECT_ID production
# When prompted, paste: cw-prod-v2

vercel env add VITE_FIREBASE_STORAGE_BUCKET production
# When prompted, paste: cw-prod-v2.firebasestorage.app

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
# When prompted, paste: 726639239023

vercel env add VITE_FIREBASE_APP_ID production
# When prompted, paste: 1:726639239023:web:b104ea415f7961e346529a

vercel env add VITE_FIREBASE_MEASUREMENT_ID production
# When prompted, paste: G-C0RZYXB6VL

vercel env add VITE_RECAPTCHA_SITE_KEY production
# When prompted, paste your reCAPTCHA site key from Step 2

vercel env add VITE_RESEND_API_KEY production
# When prompted, paste: re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c

vercel env add VITE_ENABLE_ANALYTICS production
# When prompted, paste: true
```

#### B. Deploy to Preview

```bash
vercel
```

Wait for deployment and test the preview URL thoroughly.

#### C. Deploy to Production

```bash
vercel --prod
```

---

### ☑️ Step 8: Grant Your Admin Access (5 minutes)

#### Method 1: Using Firebase Console (Easiest)

1. **Sign up** on your deployed site using YOUR email (the one you set in Step 1)
2. Go to Firebase Console: https://console.firebase.google.com
3. Select: **cw-prod-v2**
4. Navigate to: **Authentication** → **Users**
5. Find your user and **copy the UID**
6. Go to: **Firestore Database**
7. Navigate to collection: **users** → your document (same UID)
8. Click **Edit document**
9. Add these fields:
   ```json
   {
     "role": "admin",
     "isAdmin": true
   }
   ```
10. Save
11. Go back to **Authentication** → **Users** → Your user
12. Scroll down to **Custom claims**
13. Click **Set custom user claims**
14. Add:
    ```json
    {
      "admin": true
    }
    ```
15. Save

#### Method 2: Using Script (Recommended if you have Service Account)

1. Download service account key:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

2. Run the script:
```bash
node scripts/set-admin.js YOUR_EMAIL@GMAIL.COM
```

**Important**: After setting admin role, you MUST sign out and sign back in!

---

### ☑️ Step 9: Verify Everything Works (10 minutes)

Test on your production URL:

#### Authentication Tests
- [ ] Sign up with a new test account
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Phone authentication (send OTP, verify)
- [ ] Sign out

#### Admin Tests (if you have admin access)
- [ ] Access admin panel at `/admin`
- [ ] Create a test blog post
- [ ] Upload an image
- [ ] View analytics dashboard

#### Security Tests
- [ ] Try to access admin panel as non-admin (should redirect)
- [ ] Check security headers:
```bash
curl -I https://your-domain.vercel.app
```
Should see:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

#### Functionality Tests
- [ ] Subscribe to newsletter (requires authentication)
- [ ] Submit contact form (requires authentication)
- [ ] Post a comment on a blog post
- [ ] View blog posts
- [ ] Search functionality works

---

### ☑️ Step 10: Performance Audit (5 minutes)

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.vercel.app --view
```

**Target Scores**:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 🎉 Post-Deployment

### Set Up Monitoring

1. **Firebase Console** → **Analytics** → Enable
2. **Vercel Dashboard** → Your Project → **Analytics** → Enable
3. **Set Budget Alerts**:
   - Firebase Console → Usage and Billing → Set budget
   - Alert at 50%, 80%, 100%

### Security Monitoring

Monitor these collections in Firestore:
- `securityEvents` - Track admin role grants, suspicious activity
- `rateLimits` - Monitor rate limiting effectiveness

### Regular Maintenance

- [ ] Check Firebase usage weekly
- [ ] Monitor error logs
- [ ] Review security events
- [ ] Keep dependencies updated: `npm audit`
- [ ] Rotate API keys every 90 days

---

## 📊 Deployment Status

| Task | Status | Time |
|------|--------|------|
| Update super admin email | ⏳ Pending | 1 min |
| Set up reCAPTCHA v3 | ⏳ Pending | 5 min |
| Deploy Firestore rules | ⏳ Pending | 2 min |
| Deploy Cloud Functions | ⏳ Pending | 5 min |
| Enable Firebase App Check | ⏳ Pending | 5 min |
| Test build locally | ⏳ Pending | 3 min |
| Deploy to Vercel | ⏳ Pending | 10 min |
| Grant admin access | ⏳ Pending | 5 min |
| Verify functionality | ⏳ Pending | 10 min |
| Performance audit | ⏳ Pending | 5 min |
| **Total Time** | | **~45 min** |

---

## 🆘 Troubleshooting

### "Permission denied" errors
- Make sure Firestore rules are deployed
- Check user has correct custom claims
- User must sign out and back in after admin grant

### "Firebase not initialized"
- Check `.env` variables are correct
- Verify build includes environment variables
- Check Vercel environment variables

### "App Check token invalid"
- Verify reCAPTCHA site key is correct
- Check domain is in reCAPTCHA allowed list
- Clear browser cache

### Functions not deploying
- Check Node.js version (should be 18)
- Verify billing is enabled on Firebase
- Check function logs: `firebase functions:log`

---

## ✅ Final Checklist

Before going live:

- [ ] All credentials updated in `.env`
- [ ] Super admin email set in Cloud Functions
- [ ] reCAPTCHA v3 configured
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed and working
- [ ] Firebase App Check enabled
- [ ] Environment variables set in Vercel
- [ ] Deployed to Vercel production
- [ ] Admin role granted to yourself
- [ ] All authentication methods tested
- [ ] Security headers verified
- [ ] Performance score > 90
- [ ] Monitoring and alerts set up

---

## 🚀 You're Live!

Your Carelwave Media platform is now:
- ✅ **Secure** with server-side admin verification
- ✅ **Production-ready** with proper credentials
- ✅ **Monitored** with Firebase and Vercel analytics
- ✅ **Protected** with App Check and security headers

**Congratulations! 🎉**

---

**Need Help?**
- Full Guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Quick Start: [QUICK_START.md](QUICK_START.md)
- Security Summary: [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
