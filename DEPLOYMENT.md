# Deployment Guide — Zero-Cost Stack

Total monthly cost: **$0**

---

## Architecture

```
[Vercel — Frontend]  →  [Render — Go API]  →  [Neon — PostgreSQL + pgvector]
                                            →  [Gemini API — LLM]
                                            →  [Groq API — LLM (optional)]
                                            →  [Tavily API — Web Search]
```

---

## 1. Database — Neon.tech (Free Tier)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → choose **PostgreSQL 16**
3. Enable the `vector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the connection string (format: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)

**Free tier limits:** 0.5 GB storage, 190 compute hours/month, 1 project.

---

## 2. Backend — Render.com (Free Tier)

1. Sign up at [render.com](https://render.com)
2. Create a **New Web Service** → connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Environment:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** Free
4. Set environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `GROQ_API_KEY` | Groq API key (enables Llama/Mixtral models) | No |
| `TAVILY_API_KEY` | Tavily web search API key | Yes |
| `ALLOWED_ORIGINS` | Frontend URL (e.g., `https://your-app.vercel.app`) | Yes |
| `PORT` | `8080` (Render default) | Yes |

5. Deploy — Render builds from the Dockerfile automatically.

**Free tier limits:** 750 hours/month, spins down after 15 min inactivity (cold start ~30s).

---

## 3. Frontend — Vercel (Free Tier)

1. Sign up at [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Vercel auto-detects `vercel.json` config (Vite framework, `dist` output)
4. Set environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Render backend URL (e.g., `https://your-backend.onrender.com`) |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

5. Deploy — automatic on every push to `main`.

**Free tier limits:** 100 GB bandwidth/month, unlimited deployments.

---

## 4. Firebase (Free — Spark Plan)

Already configured in the project. Ensure:
- **Authentication:** Google Sign-In enabled
- **Firestore:** `posts` collection for blog publishing
- **Cloud Functions:** Deploy admin functions (`functions/src/admin.ts`)

```bash
cd functions && npm install && npx firebase deploy --only functions
```

**Free tier limits:** 50K reads/day, 20K writes/day, 1 GB storage.

---

## 5. API Keys (All Free)

### Google Gemini
- Get key at [aistudio.google.com](https://aistudio.google.com)
- **Free tier:** 15 RPM, 1M tokens/day, 1500 requests/day

### Groq (Optional)
- Get key at [console.groq.com](https://console.groq.com)
- **Free tier:** 30 RPM, 14.4K tokens/min (Llama 3.3 70B)
- Models: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it`

### Tavily
- Get key at [tavily.com](https://tavily.com)
- **Free tier:** 1000 searches/month

---

## Quick Start

```bash
# 1. Clone and install frontend
npm install

# 2. Create .env for local development
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
EOF

# 3. Run frontend
npm run dev

# 4. Run backend (in another terminal)
cd backend
export DATABASE_URL="postgresql://..."
export GEMINI_API_KEY="..."
export TAVILY_API_KEY="..."
export GROQ_API_KEY="..."  # optional
export ALLOWED_ORIGINS="http://localhost:5173"
go run ./cmd/server
```

---

## CORS Configuration

The backend reads `ALLOWED_ORIGINS` (comma-separated) to configure CORS. For production, set this to your Vercel domain:

```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend cold start on Render | First request after inactivity takes ~30s. Frontend shows "Checking..." status during this time. |
| Groq rate limit errors | The system auto-detects rate limits and shows a toast. Switch to Gemini model or wait. |
| Neon connection timeout | Ensure `?sslmode=require` in `DATABASE_URL`. Neon suspends after 5 min inactivity on free tier. |
| Firebase auth not working | Verify `VITE_FIREBASE_*` env vars match your Firebase console config. Ensure Google Sign-In is enabled. |
