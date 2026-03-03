# 🚀 DEPLOY NOW - Quick Guide

## ✅ Code is on GitHub!
Repository: https://github.com/Akshay18280/cwmedia
Branch: `update2`

---

## 🎯 Deploy in 30 Minutes

Follow these 6 steps in order:

---

### 1️⃣ Update Super Admin Email (1 min)

```bash
# Open this file
nano functions/src/admin.ts

# Change line 9 to YOUR email:
const SUPER_ADMIN_EMAIL = 'your-email@gmail.com';
```

✅ Done? → Go to Step 2

---

### 2️⃣ Deploy Firebase Backend (10 min)

```bash
# Login and select project
firebase login
firebase use cw-prod-v2

# Deploy rules
firebase deploy --only firestore:rules

# Deploy functions
cd functions && npm install && npm run build
cd .. && firebase deploy --only functions
```

✅ You should see 7 functions deployed successfully!

---

### 3️⃣ Get reCAPTCHA Key (3 min)

1. Open: https://www.google.com/recaptcha/admin
2. Click **+ Create**
3. Choose **reCAPTCHA v3**
4. Add domains: `localhost`, `cw-prod-v2.firebaseapp.com`, `vercel.app`
5. **Copy the Site Key** (starts with `6L...`)

✅ Keep this key - you'll need it in Step 4!

---

### 4️⃣ Deploy to Vercel (10 min)

#### Option A: Via Dashboard (Easiest)

1. Go to: https://vercel.com/new
2. Click **Import** next to your GitHub repo: `cwmedia`
3. Add these environment variables:

```
VITE_FIREBASE_API_KEY = AIzaSyCNjCIfq7uLcM3JfMOjfUhJWoP2R-ROHck
VITE_FIREBASE_AUTH_DOMAIN = cw-prod-v2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = cw-prod-v2
VITE_FIREBASE_STORAGE_BUCKET = cw-prod-v2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 726639239023
VITE_FIREBASE_APP_ID = 1:726639239023:web:b104ea415f7961e346529a
VITE_FIREBASE_MEASUREMENT_ID = G-C0RZYXB6VL
VITE_RECAPTCHA_SITE_KEY = [YOUR_KEY_FROM_STEP_3]
VITE_RESEND_API_KEY = re_aQfAn3DG_DinaARaxK7Kcsnstf8n5wT8c
VITE_ENABLE_ANALYTICS = true
VITE_ENABLE_PWA = true
```

4. Click **Deploy**
5. Wait 3-5 minutes
6. Copy your deployment URL!

#### Option B: Via CLI

```bash
vercel login
vercel link

# Add each variable
vercel env add VITE_FIREBASE_API_KEY production
# ... (add all variables as shown in Option A)

vercel --prod
```

✅ Site is deploying!

---

### 5️⃣ Enable Firebase App Check (3 min)

1. Firebase Console: https://console.firebase.google.com
2. Select **cw-prod-v2**
3. **Build** → **App Check** → **Get started**
4. Add your web app with reCAPTCHA v3 (use key from Step 3)
5. Enable enforcement for Firestore, Functions, and Storage

✅ App Check enabled!

---

### 6️⃣ Grant Your Admin Access (3 min)

1. Sign up on your Vercel site using YOUR email
2. Firebase Console → **Authentication** → Copy your **UID**
3. **Firestore Database** → **users** → Your doc
4. Add: `role: "admin"`, `isAdmin: true`
5. **Authentication** → Your user → **Custom claims**
6. Set: `{"admin": true}`
7. **Sign out and back in** on your site

✅ You're now admin!

---

## 🎉 Done! Your Site is Live!

### Test Everything:

1. ✅ Sign up / Sign in
2. ✅ Google authentication
3. ✅ Access `/admin` panel
4. ✅ Create a blog post
5. ✅ Subscribe to newsletter

### Check Security:

```bash
curl -I https://your-app.vercel.app
# Should show security headers
```

---

## 📊 Your Deployment

- **GitHub**: https://github.com/Akshay18280/cwmedia
- **Vercel**: Check your dashboard for URL
- **Firebase**: cw-prod-v2
- **Status**: ✅ Production Ready

---

## 🆘 Issues?

### Build Failed?
- Check environment variables are set correctly
- View build logs in Vercel dashboard

### Can't Access Admin?
- Make sure custom claims are set
- Sign out and back in
- Use correct email from Step 1

### Firebase Errors?
- Check rules are deployed: `firebase deploy --only firestore:rules`
- Verify App Check is enabled

---

## 📚 More Help

- **Detailed Guide**: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
- **Troubleshooting**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Commands**: [COMMANDS.md](COMMANDS.md)

---

## ⚡ Quick Commands

```bash
# Redeploy Firebase
firebase deploy --only firestore:rules,functions

# Redeploy Vercel
git push origin update2  # Auto-deploys if linked

# Check deployment
vercel ls
firebase projects:list

# View logs
vercel logs
firebase functions:log
```

---

## 🎯 Next Steps After Deployment

1. Set up auto-deploy (Vercel → Settings → Git)
2. Add custom domain (optional)
3. Enable monitoring
4. Set budget alerts
5. Share with users!

---

**🚀 Start with Step 1 above and follow in order!**

**Total Time**: ~30 minutes
**Difficulty**: Easy (copy-paste commands)
**Result**: Production-ready site! ✅
