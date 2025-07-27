# Carelwave Media - Personal Blog & Portfolio

A modern, full-stack blogging platform and personal portfolio built with React, TypeScript, and Supabase.

## 🚀 Features

- **Modern Blog System**: Dynamic blog posts with rich content, categories, and tags
- **Individual Post Pages**: Detailed post views with like/view tracking
- **Professional About Section**: World-class portfolio page with achievements and skills
- **Admin Dashboard**: Complete post management system
- **Newsletter Subscription**: Email subscription with preferences
- **Authentication**: Secure phone-based OTP authentication
- **Responsive Design**: Mobile-first design with dark/light theme support
- **SEO Optimized**: Semantic HTML and accessibility features

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Infrastructure**: Row Level Security (RLS) policies
- **Deployment**: Vercel-ready configuration

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cwmedia
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. **Configure Supabase**
- Create a new Supabase project
- Update `.env` with your Supabase URL and anon key
- Run the database migrations in `supabase/migrations/`

5. **Start development server**
```bash
npm run dev
```

## 🗃 Database Schema

The project uses the following main tables:
- `users` - User profiles and authentication
- `posts` - Blog posts with metadata
- `comments` - Post comments system
- `newsletters` - Email subscriptions

## 🔧 Configuration

### Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/20250410143606_nameless_portal.sql`

### Authentication Setup
- Phone authentication is configured for admin access
- Update the admin login component with your phone number

## 📱 Usage

### For Visitors
- Browse blog posts on the main page
- Read individual posts with engagement tracking
- Subscribe to newsletter
- View professional about section

### For Admins
- Access admin dashboard at `/admin/dashboard`
- Create, edit, and delete blog posts
- Monitor post analytics and engagement
- Manage newsletter subscriptions

## 🚀 Deployment

The project is configured for Vercel deployment:

```bash
npm run build
```

Deploy to Vercel or your preferred hosting platform.

## 🎨 Features Implemented

### Core Functionality
- ✅ Individual post pages with dynamic routing
- ✅ Complete posts service with CRUD operations  
- ✅ Dynamic featured posts (replaces hardcoded content)
- ✅ Admin dashboard with post management
- ✅ Proper TypeScript types for Supabase
- ✅ Error boundary for graceful error handling
- ✅ **UPGRADED**: World-class Home page with modern design
- ✅ **UPGRADED**: Professional Blog page with advanced filtering
- ✅ **UPGRADED**: Production-ready About section

### Home Page Features
- ✅ Stunning gradient hero section with animations
- ✅ Dynamic statistics display
- ✅ Interactive feature highlights
- ✅ Responsive featured posts grid
- ✅ Call-to-action sections with hover effects
- ✅ Modern card designs with smooth transitions

### Blog Page Features  
- ✅ Advanced search and filtering system
- ✅ Category-based content organization
- ✅ Multiple sorting options (latest, popular, reading time)
- ✅ Interactive tag system with click-to-search
- ✅ Real-time blog statistics
- ✅ Professional article layout with engagement metrics
- ✅ Responsive grid with hover animations

### About Section Features
- ✅ First-person voice with warm, confident tone
- ✅ Personal tagline and mission statement
- ✅ STAR method story (Context → Action → Impact)
- ✅ Skills showcase with visual icons
- ✅ Key achievements and metrics
- ✅ Recognition and awards section
- ✅ Professional testimonial
- ✅ Call-to-action buttons
- ✅ Responsive design with animations
- ✅ SEO-friendly and accessible markup

## 📞 Contact

**Akshay Verma**
- Email: akshayvermajan28@gmail.com
- LinkedIn: [akshay-verma-024aa0152](https://linkedin.com/in/akshay-verma-024aa0152/)
- GitHub: [Akshay18280](https://github.com/Akshay18280)

## 📄 License

© 2024 Carelwave Media. All rights reserved. 