interface IPAuthConfig {
  allowedIPs: string[];
  enabled: boolean;
}

interface IPAuthResult {
  success: boolean;
  isAllowedIP: boolean;
  userIP: string;
  message: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  provider: 'ip';
  verified: true;
  ipAddress: string;
}

// Import Firebase auth for signing in
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

class IPAuthService {
  private config: IPAuthConfig = {
    // Default allowed IPs - can be configured via environment variables
    allowedIPs: [
      '192.168.0.100',  // Only allowed admin IP
      // Add more IPs as needed
    ],
    enabled: true
  };

  // Admin credentials for Firebase sign-in
  private readonly ADMIN_EMAIL = 'admin@carelwavemedia.com';
  private readonly ADMIN_PASSWORD = process.env.VITE_ADMIN_AUTO_PASSWORD || 'your-admin-password';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    // Load configuration from environment variables or localStorage
    const envAllowedIPs = process.env.VITE_ADMIN_ALLOWED_IPS;
    const envEnabled = process.env.VITE_IP_AUTH_ENABLED;
    
    if (envAllowedIPs) {
      this.config.allowedIPs = envAllowedIPs.split(',').map(ip => ip.trim());
    }
    
    if (envEnabled !== undefined) {
      this.config.enabled = envEnabled === 'true';
    }

    // Also check localStorage for runtime configuration
    const storedConfig = localStorage.getItem('ipAuthConfig');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        this.config = { ...this.config, ...parsed };
      } catch (error) {
        console.error('Invalid IP auth config in localStorage:', error);
      }
    }
  }

  private async getUserIP(): Promise<string> {
    try {
      // Try multiple IP detection services for reliability
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.my-ip.io/ip.json'
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          // Different services return IP in different fields
          const ip = data.ip || data.query || data.ipAddress;
          if (ip) {
            return ip;
          }
        } catch (error) {
          console.warn(`IP service ${service} failed:`, error);
          continue;
        }
      }

      // Fallback: try to get from request headers (if available)
      return 'unknown';
    } catch (error) {
      console.error('Failed to get user IP:', error);
      return 'unknown';
    }
  }

  private isIPInRange(ip: string, range: string): boolean {
    if (range.includes('/')) {
      // CIDR notation (e.g., 192.168.1.0/24)
      return this.isIPInCIDR(ip, range);
    } else {
      // Exact IP match
      return ip === range;
    }
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    try {
      const [network, prefixLength] = cidr.split('/');
      const prefix = parseInt(prefixLength);
      
      // Convert IP addresses to numbers for comparison
      const ipToNumber = (ip: string) => {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
      };
      
      const ipNum = ipToNumber(ip);
      const networkNum = ipToNumber(network);
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
      
      return (ipNum & mask) === (networkNum & mask);
    } catch (error) {
      console.error('Error checking CIDR range:', error);
      return false;
    }
  }

  async checkIPAuth(): Promise<IPAuthResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        isAllowedIP: false,
        userIP: 'disabled',
        message: 'IP-based authentication is disabled'
      };
    }

    try {
      const userIP = await this.getUserIP();
      
      if (userIP === 'unknown') {
        return {
          success: false,
          isAllowedIP: false,
          userIP: 'unknown',
          message: 'Could not determine user IP address'
        };
      }

      const isAllowed = this.config.allowedIPs.some(allowedIP => 
        this.isIPInRange(userIP, allowedIP)
      );

      return {
        success: isAllowed,
        isAllowedIP: isAllowed,
        userIP,
        message: isAllowed 
          ? 'IP address is authorized for admin access'
          : `IP address ${userIP} is not authorized for admin access`
      };
    } catch (error) {
      console.error('IP authentication check failed:', error);
      return {
        success: false,
        isAllowedIP: false,
        userIP: 'error',
        message: 'IP authentication check failed'
      };
    }
  }

  async authenticateByIP(): Promise<{ success: boolean; user?: AdminUser; message: string }> {
    const ipCheck = await this.checkIPAuth();
    
    if (!ipCheck.success) {
      return {
        success: false,
        message: ipCheck.message
      };
    }

    try {
      // **CRITICAL FIX**: Actually sign into Firebase as admin
      // This ensures Firestore security rules recognize the user as authenticated admin
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        this.ADMIN_EMAIL, 
        this.ADMIN_PASSWORD
      );

      // Create admin user object for IP-based authentication
      const adminUser: AdminUser = {
        id: userCredential.user.uid, // Use Firebase UID
        email: this.ADMIN_EMAIL,
        name: 'Admin (IP Authenticated)',
        isAdmin: true,
        provider: 'ip',
        verified: true,
        ipAddress: ipCheck.userIP
      };

      // Store authentication in localStorage for session persistence
      localStorage.setItem('ipAuthUser', JSON.stringify(adminUser));
      localStorage.setItem('ipAuthTimestamp', Date.now().toString());

      return {
        success: true,
        user: adminUser,
        message: `Admin access granted via IP authentication (${ipCheck.userIP}). Firebase authentication completed.`
      };

    } catch (firebaseError: any) {
      console.error('Firebase authentication failed for IP user:', firebaseError);
      
      // If Firebase auth fails, still allow local-only authentication
      // but warn that Firestore operations may fail
      const adminUser: AdminUser = {
        id: `admin_ip_${ipCheck.userIP.replace(/\./g, '_')}`,
        email: 'admin@carelwavemedia.com',
        name: 'Admin (IP Authenticated - Local Only)',
        isAdmin: true,
        provider: 'ip',
        verified: true,
        ipAddress: ipCheck.userIP
      };

      localStorage.setItem('ipAuthUser', JSON.stringify(adminUser));
      localStorage.setItem('ipAuthTimestamp', Date.now().toString());

      return {
        success: true,
        user: adminUser,
        message: `IP authentication granted (${ipCheck.userIP}), but Firebase auth failed. Some admin operations may not work. Error: ${firebaseError.message}`
      };
    }
  }

  isIPAuthenticated(): AdminUser | null {
    try {
      const storedUser = localStorage.getItem('ipAuthUser');
      const storedTimestamp = localStorage.getItem('ipAuthTimestamp');
      
      if (!storedUser || !storedTimestamp) {
        return null;
      }

      // Check if session is still valid (24 hours)
      const timestamp = parseInt(storedTimestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (Date.now() - timestamp > twentyFourHours) {
        // Session expired
        this.clearIPAuth();
        return null;
      }

      return JSON.parse(storedUser) as AdminUser;
    } catch (error) {
      console.error('Error checking IP authentication:', error);
      return null;
    }
  }

  clearIPAuth(): void {
    localStorage.removeItem('ipAuthUser');
    localStorage.removeItem('ipAuthTimestamp');
  }

  // Configuration methods
  updateConfig(newConfig: Partial<IPAuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('ipAuthConfig', JSON.stringify(this.config));
  }

  getConfig(): IPAuthConfig {
    return { ...this.config };
  }

  addAllowedIP(ip: string): void {
    if (!this.config.allowedIPs.includes(ip)) {
      this.config.allowedIPs.push(ip);
      this.updateConfig(this.config);
    }
  }

  removeAllowedIP(ip: string): void {
    this.config.allowedIPs = this.config.allowedIPs.filter(allowedIP => allowedIP !== ip);
    this.updateConfig(this.config);
  }
}

export const ipAuthService = new IPAuthService();
export type { IPAuthResult, AdminUser as IPAdminUser }; 