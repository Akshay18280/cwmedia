// Re-export Firebase auth service
export { firebaseAuthService as authService, type SocialUser } from './firebase/auth.service';

// Export IP-based authentication service
export { ipAuthService, type IPAuthResult, type IPAdminUser } from './firebase/ip-auth.service';
