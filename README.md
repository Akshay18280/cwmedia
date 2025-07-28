# Carelwave Media

A modern, professional blog and portfolio website featuring advanced design systems, real-time analytics, and comprehensive content management capabilities.

## Features

- **Flowing Gradient System**: Dynamic color animations with smooth transitions
- **Holographic Effects**: Color-shifting elements with rainbow iridescence
- **Modern Design Variants**: Neumorphism, Glass Morphism, Brutalism support
- **Real-time Analytics**: Live visitor tracking and engagement metrics
- **Newsletter Management**: AI-powered personalization and email automation
- **Content Management**: Full blog post creation, editing, and publishing
- **User Authentication**: Phone-based login with admin verification
- **Review System**: Professional review collection with admin approval
- **Theme System**: Light, dark, and auto modes with accent color selection
- **Performance Optimized**: 60 FPS animations with mobile optimization
- **Accessibility**: WCAG 2.1 AA compliance with reduced motion support
- **Progressive Web App**: Full PWA capabilities with offline support

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/cwmedia.git

# Install dependencies
cd cwmedia
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase configuration

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Installation

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher
- Firebase account
- Vercel account (for deployment)

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Email Service (Resend)
VITE_RESEND_API_KEY=your_resend_api_key

# SMS Service (Twilio)
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone

# Analytics
VITE_GA_MEASUREMENT_ID=your_ga_id
```

### Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Phone and Google providers
3. Create a Firestore database in production mode
4. Enable Storage for file uploads
5. Copy your configuration to the `.env` file

### Local Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test
```

## Usage

### Blog Management

Create and manage blog posts through the admin dashboard:

```typescript
// Navigate to /admin/dashboard after admin login
// Use the Posts Management tab to:
// - Create new posts with rich text editor
// - Upload featured images
// - Set categories and tags
// - Publish or save as drafts
```

### Newsletter System

Manage newsletter subscriptions and send automated emails:

```typescript
// Newsletter features include:
// - AI-powered content personalization
// - Automated welcome email sequences
// - New post notifications to subscribers
// - Advanced analytics and engagement tracking
```

### Theme Customization

Customize the visual appearance:

```typescript
// Access theme controls via the navigation menu:
// - Choose from 5 gradient color schemes
// - Toggle between light, dark, and auto modes
// - Experience flowing gradients and holographic effects
// - All changes persist across sessions
```

### Authentication Flow

Handle user and admin authentication:

```typescript
// User authentication supports:
// - Phone number with OTP verification
// - Google OAuth sign-in
// - Admin verification with custom phone number
// - Session management and persistence
```

## Architecture

### Frontend Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and developer experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Consistent icon library

### Backend Services

- **Firebase Firestore**: NoSQL database for content and user data
- **Firebase Auth**: Authentication and user management
- **Firebase Storage**: File and image storage
- **Firebase Analytics**: User behavior tracking
- **Resend**: Email delivery service
- **Twilio**: SMS delivery for OTP verification

### Design System

- **Flowing Gradients**: Dynamic color animations
- **Holographic Effects**: Color-shifting visual elements
- **Neumorphism**: Soft, tactile design elements
- **Glass Morphism**: Translucent components with blur effects
- **Brutalism**: Bold, high-contrast design patterns

## API Reference

### Authentication Service

```typescript
// Sign in with phone number
await unifiedAuthService.signInWithPhone('+1234567890');

// Verify OTP code
await unifiedAuthService.verifyOTP('123456');

// Sign in with Google
await unifiedAuthService.signInWithGoogle();

// Admin verification
await unifiedAuthService.verifyAdminOTP('654321');
```

### Posts Service

```typescript
// Get all posts
const posts = await firebasePostsService.getAllPosts();

// Get post by ID
const post = await firebasePostsService.getPostById('post-id');

// Create new post (admin only)
await firebasePostsService.createPost(postData);

// Update post (admin only)
await firebasePostsService.updatePost('post-id', updates);
```

### Newsletter Service

```typescript
// Subscribe to newsletter
await firebaseNewsletterService.subscribe('user@example.com', preferences);

// Unsubscribe with token
await firebaseNewsletterService.unsubscribe('unsubscribe-token');

// Send newsletter (admin only)
await firebaseNewsletterService.sendBulkNewsletter(content, recipients);
```

For complete API documentation, see [docs/API.md](docs/API.md)

## Contributing

We welcome contributions from the community. Please read our [Contributing Guide](docs/CONTRIBUTING.md) for details on our development process and coding standards.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our [Style Guide](docs/DOCUMENTATION_STYLE_GUIDE.md)
4. Add tests for new functionality
5. Run the test suite: `npm run test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards

- Follow the TypeScript and React best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive JSDoc comments
- Include unit tests for new features
- Ensure accessibility compliance

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Connect your GitHub repository for automatic deployments
```

### Firebase Hosting (Alternative)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

## Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: All green ratings
- **Animation Performance**: Consistent 60 FPS
- **Bundle Size**: Optimized with code splitting
- **Mobile Performance**: Battery-efficient animations

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- Mobile browsers with modern JavaScript support

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or support requests:

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/cwmedia/issues)
- **Email**: contact@carelwave.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and version releases.

---

Built with excellence for the modern web. Designed for performance, accessibility, and user experience. 