# 🚀 Quick Command Reference

## Essential Commands for Deployment

### 🔥 Firebase Commands

```bash
# Login to Firebase
firebase login

# Select project
firebase use cw-prod-v2

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy everything
firebase deploy

# View function logs
firebase functions:log

# Test functions locally
cd functions && npm run serve
```

---

### ⚡ Vercel Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variable
vercel env add VARIABLE_NAME production

# List environment variables
vercel env ls

# View deployment logs
vercel logs
```

---

### 📦 Build Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

### 🔧 Functions Commands

```bash
# Navigate to functions
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run functions locally
npm run serve

# Deploy functions
cd .. && firebase deploy --only functions
```

---

### 🛡️ Security Commands

```bash
# Check security headers
curl -I https://your-domain.vercel.app

# Check for secrets in build
grep -r "AIza" dist/
grep -r "sk-" dist/

# Audit dependencies
npm audit

# Check bundle size
npm run build && ls -lh dist/assets/
```

---

### 🧪 Testing Commands

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.vercel.app --view

# Test Firebase rules locally
firebase emulators:start --only firestore

# Load testing (requires artillery)
npx artillery quick --count 100 --num 10 https://your-url
```

---

### 📊 Monitoring Commands

```bash
# View Firebase logs
firebase functions:log

# View specific function logs
firebase functions:log --only setAdminRole

# Check Firebase usage
firebase projects:get cw-prod-v2

# Vercel deployment logs
vercel logs your-deployment-url
```

---

## 🎯 Quick Deployment Flow

```bash
# 1. Update code and test locally
npm run build && npm run preview

# 2. Deploy Firestore rules
firebase deploy --only firestore:rules

# 3. Deploy Cloud Functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# 4. Deploy to Vercel
vercel --prod

# 5. Verify
curl -I https://your-domain.vercel.app
```

---

## 🔐 Admin Management

```bash
# Grant admin role (using script)
node scripts/set-admin.js user@example.com

# Check admin status via Firebase Console
# Go to: Authentication → Users → Custom claims
```

---

## 📝 Git Commands (Recommended)

```bash
# Create a new commit
git add .
git commit -m "feat: implement security fixes"

# Push to remote
git push origin main

# Create a new branch for features
git checkout -b feature/new-feature

# View git status
git status

# View commit history
git log --oneline -10
```

---

## 🐛 Debugging Commands

```bash
# View Firebase project info
firebase projects:list

# Check current Firebase project
firebase use

# View all Firebase resources
firebase projects:get cw-prod-v2

# Check Vercel project info
vercel inspect your-deployment-url

# View environment variables (local)
cat .env

# Test environment variable loading
npm run build && grep -r "cw-prod-v2" dist/
```

---

## 🔄 Update Commands

```bash
# Update dependencies
npm update

# Update Firebase tools
npm install -g firebase-tools@latest

# Update Vercel CLI
npm install -g vercel@latest

# Check for outdated packages
npm outdated
```

---

## 📊 Common Workflows

### Deploy New Features
```bash
git checkout -b feature/new-feature
# ... make changes ...
npm run build
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
vercel  # Test in preview
vercel --prod  # Deploy to production
```

### Fix Production Bug
```bash
git checkout -b hotfix/bug-fix
# ... fix bug ...
npm run build && npm run preview
git add .
git commit -m "fix: resolve production bug"
git push origin hotfix/bug-fix
firebase deploy --only firestore:rules  # If rules changed
firebase deploy --only functions  # If functions changed
vercel --prod
```

### Update Security Rules
```bash
# Edit firestore.rules
firebase deploy --only firestore:rules
# Test in production
```

### Add New Cloud Function
```bash
cd functions/src
# Create new function file
cd ..
npm run build
cd ..
firebase deploy --only functions
```

---

## 🆘 Emergency Commands

```bash
# Rollback Vercel deployment
vercel rollback your-deployment-url

# Disable problematic function
firebase functions:delete functionName

# Check Firebase quota
firebase projects:get cw-prod-v2

# View recent errors
firebase functions:log --limit 50

# Force rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📱 Mobile Testing

```bash
# Test on mobile device (local network)
npm run dev -- --host

# Then access from mobile:
# http://YOUR_LOCAL_IP:5173
```

---

## 🎨 Development Tips

```bash
# Watch mode for TypeScript
cd functions && npm run build -- --watch

# Clear build cache
rm -rf dist node_modules/.vite

# Analyze bundle size
npm run build
npx vite-bundle-visualizer dist/stats.html
```

---

## ✅ Quick Checklist Commands

```bash
# Full deployment verification
firebase deploy --only firestore:rules && \
firebase deploy --only functions && \
npm run build && \
vercel --prod && \
echo "✅ Deployment complete!"
```

---

## 📚 Documentation Links

- Firebase CLI: https://firebase.google.com/docs/cli
- Vercel CLI: https://vercel.com/docs/cli
- Vite: https://vitejs.dev/guide/
- npm: https://docs.npmjs.com/cli/

---

**Pro Tip**: Create aliases in your shell for common commands:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias fd="firebase deploy --only firestore:rules"
alias ff="firebase deploy --only functions"
alias vd="vercel --prod"
alias build="npm run build"
```
