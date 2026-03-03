# 🔥 Firebase Upgrade Required for Cloud Functions

## ❌ Current Issue

Firebase Cloud Functions deployment failed with error:
```
Your project cw-prod-v2 must be on the Blaze (pay-as-you-go) plan to complete this command.
```

**Reason**: Cloud Functions require the Blaze plan (pay-as-you-go) to deploy.

---

## ✅ Solution: Upgrade to Blaze Plan (5 minutes)

### Step 1: Upgrade Firebase Project

1. **Visit**: https://console.firebase.google.com/project/cw-prod-v2/usage/details

2. **Click "Modify plan"** or **"Upgrade to Blaze"**

3. **Select Blaze plan**:
   - Pay only for what you use
   - Includes generous free tier
   - Required for Cloud Functions

4. **Add billing account**:
   - You'll need a credit/debit card
   - Google will verify your payment method

5. **Confirm upgrade**

### Step 2: Set Budget Alerts (Recommended)

After upgrading:

1. Go to: https://console.firebase.google.com/project/cw-prod-v2/usage/details
2. Click **"Set budget alerts"**
3. Set alerts at:
   - $10 (50% of typical monthly usage)
   - $20 (100% alert)
   - $30 (150% warning)

This ensures you won't have surprise bills!

---

## 💰 Cost Estimation

### Free Tier (Generous - You'll Likely Stay Free)

**Firestore**:
- 50,000 reads/day FREE
- 20,000 writes/day FREE
- 20,000 deletes/day FREE
- 1GB storage FREE

**Cloud Functions**:
- 2 million invocations/month FREE
- 400,000 GB-seconds compute time FREE
- 200,000 GHz-seconds compute time FREE
- 5GB outbound data transfer FREE

**Authentication**:
- Unlimited FREE (phone auth may have SMS costs)

**Storage**:
- 5GB stored FREE
- 1GB downloaded/day FREE

### Expected Monthly Cost for Your App

**With 1,000 users/month**:
- Firestore: FREE (under limits)
- Functions: FREE (under limits)
- Auth: FREE
- Storage: FREE
- **Total: $0**

**With 10,000 users/month**:
- Firestore: ~$1-2
- Functions: ~$2-3
- Auth: FREE
- Storage: ~$1
- **Total: ~$4-6/month**

**With 100,000 users/month**:
- Firestore: ~$10-15
- Functions: ~$15-20
- Auth: FREE
- Storage: ~$5-10
- **Total: ~$30-45/month**

---

## 🛡️ Safety Tips

1. **Enable billing alerts** (see Step 2 above)
2. **Monitor usage** regularly in Firebase Console
3. **Implement rate limiting** (already done in our code!)
4. **Use Firestore indexes** efficiently (already configured)
5. **Review costs** weekly during first month

---

## 🚀 After Upgrading

Once your project is on Blaze plan, run:

```bash
# Deploy Cloud Functions
firebase deploy --only functions
```

Expected output:
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

## 📊 What We've Deployed So Far

- ✅ **Firestore Rules**: Deployed successfully
- ❌ **Cloud Functions**: Waiting for Blaze upgrade
- ⏳ **Environment Variables**: Need to be added to Vercel
- ⏳ **reCAPTCHA v3**: Need to configure
- ⏳ **Firebase App Check**: Need to enable
- ⏳ **Admin Access**: Need to grant

---

## 🔄 Complete Deployment Steps

### Already Done ✅
1. Code pushed to GitHub
2. Vercel build succeeds (Node.js 24.x)
3. Firestore rules deployed

### Need to Do Now ⏳
1. **Upgrade Firebase to Blaze plan** ← YOU ARE HERE
2. **Deploy Cloud Functions** (after upgrade)
3. **Add environment variables to Vercel**
4. **Configure reCAPTCHA v3**
5. **Enable Firebase App Check**
6. **Grant admin access**

---

## 📞 Need Help?

If you're concerned about costs or have billing questions:
- Firebase pricing: https://firebase.google.com/pricing
- Firebase support: https://firebase.google.com/support

---

**Updated**: 2026-03-03
**Status**: 🔴 Action Required - Upgrade to Blaze Plan
**Next Step**: Visit https://console.firebase.google.com/project/cw-prod-v2/usage/details
