/**
 * Security Middleware for Carelwave Media
 * Comprehensive security layer with 2025 standards
 * CSRF, XSS, SQL injection, rate limiting, input validation protection
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';

// Security configuration interface
interface SecurityConfig {
  enableCSRFProtection: boolean;
  enableXSSProtection: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerWindow: number;
  windowSizeMs: number;
  enableInputSanitization: boolean;
  enableSQLInjectionProtection: boolean;
  trustedDomains: string[];
  secretKey: string;
}

// Rate limiting storage interface
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// Request context interface
interface RequestContext {
  ip: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

// Security violation interface
interface SecurityViolation {
  type: 'csrf' | 'xss' | 'rate_limit' | 'sql_injection' | 'malicious_input';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  context: RequestContext;
  blocked: boolean;
}

class SecurityMiddleware {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private csrfTokens: Map<string, { token: string; expiry: number }> = new Map();
  private violations: SecurityViolation[] = [];
  private blockedIPs: Set<string> = new Set();

  // SQL injection patterns
  private sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\bOR\b.*=.*\bOR\b)/gi,
    /(\bAND\b.*=.*\bAND\b)/gi,
    /(INFORMATION_SCHEMA|sys\.)/gi,
    /(xp_|sp_)/gi
  ];

  // XSS patterns
  private xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];

  // Malicious input patterns
  private maliciousPatterns = [
    /\.\.\/|\.\.\\/, // Directory traversal
    /\0/, // Null bytes
    /%00/, // URL encoded null bytes
    /\$\{.*\}/, // Expression language injection
    /#\{.*\}/, // Spring expression language
    /<%.*%>/, // Server-side template injection
    /\{\{.*\}\}/, // Template injection
    /__proto__|constructor|prototype/, // Prototype pollution
    /file:\/\/|ftp:\/\/|data:/, // Dangerous protocols
    /wget|curl|nc|netcat|telnet|ssh/, // System commands
  ];

  constructor(config: SecurityConfig) {
    this.config = config;
    this.startCleanupTasks();
  }

  /**
   * Main security validation method
   */
  public validateRequest(
    input: any,
    context: RequestContext
  ): { valid: boolean; violations: SecurityViolation[]; sanitized?: any } {
    const violations: SecurityViolation[] = [];
    let sanitizedInput = input;

    // Check if IP is blocked
    if (this.blockedIPs.has(context.ip)) {
      violations.push({
        type: 'rate_limit',
        severity: 'critical',
        details: 'Request from blocked IP address',
        context,
        blocked: true
      });
      return { valid: false, violations };
    }

    // Rate limiting check
    if (this.config.enableRateLimiting) {
      const rateLimitViolation = this.checkRateLimit(context);
      if (rateLimitViolation) {
        violations.push(rateLimitViolation);
      }
    }

    // Input sanitization and validation
    if (this.config.enableInputSanitization) {
      const sanitizationResult = this.sanitizeInput(input, context);
      sanitizedInput = sanitizationResult.sanitized;
      violations.push(...sanitizationResult.violations);
    }

    // SQL injection protection
    if (this.config.enableSQLInjectionProtection) {
      const sqlViolations = this.checkSQLInjection(input, context);
      violations.push(...sqlViolations);
    }

    // XSS protection
    if (this.config.enableXSSProtection) {
      const xssViolations = this.checkXSS(input, context);
      violations.push(...xssViolations);
    }

    // Store violations for monitoring
    this.violations.push(...violations);

    // Auto-block IPs with multiple critical violations
    this.checkForAutoBlock(context, violations);

    const hasBlockingViolations = violations.some(v => v.blocked);
    
    return {
      valid: !hasBlockingViolations,
      violations,
      sanitized: sanitizedInput
    };
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(context: RequestContext): SecurityViolation | null {
    const key = `${context.ip}:${context.userId || 'anonymous'}`;
    const now = Date.now();
    const windowStart = now - this.config.windowSizeMs;

    let entry = this.rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowSizeMs,
        blocked: false
      };
    } else {
      entry.count++;
    }

    this.rateLimitStore.set(key, entry);

    if (entry.count > this.config.maxRequestsPerWindow) {
      entry.blocked = true;
      
      // Block IP for repeated violations
      if (entry.count > this.config.maxRequestsPerWindow * 2) {
        this.blockedIPs.add(context.ip);
        
        // Temporary block for 1 hour
        setTimeout(() => {
          this.blockedIPs.delete(context.ip);
        }, 60 * 60 * 1000);
      }

      return {
        type: 'rate_limit',
        severity: 'high',
        details: `Rate limit exceeded: ${entry.count} requests in window`,
        context,
        blocked: true
      };
    }

    return null;
  }

  /**
   * Input sanitization with deep object support
   */
  private sanitizeInput(
    input: any, 
    context: RequestContext
  ): { sanitized: any; violations: SecurityViolation[] } {
    const violations: SecurityViolation[] = [];

    const sanitizeValue = (value: any, path: string = ''): any => {
      if (typeof value === 'string') {
        // Check for malicious patterns
        for (const pattern of this.maliciousPatterns) {
          if (pattern.test(value)) {
            violations.push({
              type: 'malicious_input',
              severity: 'high',
              details: `Malicious pattern detected in ${path}: ${pattern}`,
              context,
              blocked: true
            });
            return '';
          }
        }

        // HTML sanitization
        if (value.includes('<') || value.includes('>')) {
          const originalValue = value;
          value = DOMPurify.sanitize(value, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
            ALLOWED_ATTR: []
          });
          
          if (originalValue !== value) {
            violations.push({
              type: 'xss',
              severity: 'medium',
              details: `HTML content sanitized in ${path}`,
              context,
              blocked: false
            });
          }
        }

        // Encode special characters
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');

      } else if (Array.isArray(value)) {
        return value.map((item, index) => 
          sanitizeValue(item, `${path}[${index}]`)
        );
      } else if (value && typeof value === 'object') {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          // Sanitize the key itself
          const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
          if (cleanKey !== key) {
            violations.push({
              type: 'malicious_input',
              severity: 'medium',
              details: `Object key sanitized: ${key} -> ${cleanKey}`,
              context,
              blocked: false
            });
          }
          sanitized[cleanKey] = sanitizeValue(val, `${path}.${cleanKey}`);
        }
        return sanitized;
      }

      return value;
    };

    return {
      sanitized: sanitizeValue(input),
      violations
    };
  }

  /**
   * SQL injection detection
   */
  private checkSQLInjection(input: any, context: RequestContext): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    const checkValue = (value: any, path: string = ''): void => {
      if (typeof value === 'string') {
        for (const pattern of this.sqlPatterns) {
          if (pattern.test(value)) {
            violations.push({
              type: 'sql_injection',
              severity: 'critical',
              details: `SQL injection pattern detected in ${path}: ${pattern}`,
              context,
              blocked: true
            });
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => 
          checkValue(val, `${path}.${key}`)
        );
      }
    };

    checkValue(input);
    return violations;
  }

  /**
   * XSS detection
   */
  private checkXSS(input: any, context: RequestContext): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    const checkValue = (value: any, path: string = ''): void => {
      if (typeof value === 'string') {
        for (const pattern of this.xssPatterns) {
          if (pattern.test(value)) {
            violations.push({
              type: 'xss',
              severity: 'high',
              details: `XSS pattern detected in ${path}: ${pattern}`,
              context,
              blocked: true
            });
          }
        }

        // Check for encoded XSS attempts
        const decodedValue = decodeURIComponent(value);
        if (decodedValue !== value) {
          for (const pattern of this.xssPatterns) {
            if (pattern.test(decodedValue)) {
              violations.push({
                type: 'xss',
                severity: 'high',
                details: `Encoded XSS pattern detected in ${path}`,
                context,
                blocked: true
              });
            }
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => 
          checkValue(val, `${path}.${key}`)
        );
      }
    };

    checkValue(input);
    return violations;
  }

  /**
   * CSRF token generation and validation
   */
  public generateCSRFToken(sessionId: string): string {
    const token = CryptoJS.lib.WordArray.random(32).toString();
    const expiry = Date.now() + (60 * 60 * 1000); // 1 hour

    this.csrfTokens.set(sessionId, { token, expiry });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  public validateCSRFToken(sessionId: string, providedToken: string): boolean {
    const stored = this.csrfTokens.get(sessionId);
    
    if (!stored || stored.expiry < Date.now()) {
      return false;
    }

    return stored.token === providedToken;
  }

  /**
   * Auto-blocking for repeated violations
   */
  private checkForAutoBlock(context: RequestContext, violations: SecurityViolation[]): void {
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    
    if (criticalViolations.length > 0) {
      // Count recent violations from this IP
      const recentViolations = this.violations.filter(v => 
        v.context.ip === context.ip && 
        v.context.timestamp > Date.now() - (5 * 60 * 1000) && // Last 5 minutes
        v.severity === 'critical'
      );

      if (recentViolations.length >= 3) {
        this.blockedIPs.add(context.ip);
        
        // Auto-unblock after 24 hours
        setTimeout(() => {
          this.blockedIPs.delete(context.ip);
        }, 24 * 60 * 60 * 1000);

        console.warn(`Auto-blocked IP ${context.ip} for repeated security violations`);
      }
    }
  }

  /**
   * Content Security Policy header generation
   */
  public generateCSPHeader(): string {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.github.com https://analytics.google.com wss:",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];

    return csp.join('; ');
  }

  /**
   * Security headers for HTTP responses
   */
  public getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.generateCSPHeader(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Permitted-Cross-Domain-Policies': 'none'
    };
  }

  /**
   * Get security analytics
   */
  public getSecurityAnalytics(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    blockedIPs: number;
    recentViolations: SecurityViolation[];
    topAttackerIPs: Array<{ ip: string; violations: number }>;
  } {
    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    const ipViolations: Map<string, number> = new Map();

    this.violations.forEach(violation => {
      violationsByType[violation.type] = (violationsByType[violation.type] || 0) + 1;
      violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
      
      const ip = violation.context.ip;
      ipViolations.set(ip, (ipViolations.get(ip) || 0) + 1);
    });

    const topAttackerIPs = Array.from(ipViolations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, violations]) => ({ ip, violations }));

    const recentViolations = this.violations
      .filter(v => v.context.timestamp > Date.now() - (24 * 60 * 60 * 1000))
      .slice(-50);

    return {
      totalViolations: this.violations.length,
      violationsByType,
      violationsBySeverity,
      blockedIPs: this.blockedIPs.size,
      recentViolations,
      topAttackerIPs
    };
  }

  /**
   * Cleanup expired tokens and old violations
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    
    for (const [sessionId, token] of this.csrfTokens.entries()) {
      if (token.expiry < now) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }

  /**
   * Start periodic cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (entry.resetTime < now) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Clean up old violations every hour (keep last 7 days)
    setInterval(() => {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.violations = this.violations.filter(v => v.context.timestamp > cutoff);
    }, 60 * 60 * 1000);

    // Clean up expired CSRF tokens every 10 minutes
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 10 * 60 * 1000);
  }

  /**
   * Manually block an IP address
   */
  public blockIP(ip: string, duration?: number): void {
    this.blockedIPs.add(ip);
    
    if (duration) {
      setTimeout(() => {
        this.blockedIPs.delete(ip);
      }, duration);
    }
  }

  /**
   * Manually unblock an IP address
   */
  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  /**
   * Check if an IP is blocked
   */
  public isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Reset security state (for testing)
   */
  public reset(): void {
    this.rateLimitStore.clear();
    this.csrfTokens.clear();
    this.violations = [];
    this.blockedIPs.clear();
  }
}

// Express.js middleware wrapper
export const createSecurityMiddleware = (config: SecurityConfig) => {
  const security = new SecurityMiddleware(config);

  return {
    middleware: (req: any, res: any, next: any) => {
      // Add security headers
      const securityHeaders = security.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Validate request
      const context: RequestContext = {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: Date.now(),
        userId: req.user?.id,
        sessionId: req.sessionID
      };

      // Check CSRF token for state-changing requests
      if (config.enableCSRFProtection && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
        if (!security.validateCSRFToken(context.sessionId, csrfToken)) {
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }
      }

      // Validate and sanitize request data
      const requestData = { ...req.body, ...req.query };
      const validationResult = security.validateRequest(requestData, context);

      if (!validationResult.valid) {
        const blockedViolations = validationResult.violations.filter(v => v.blocked);
        if (blockedViolations.length > 0) {
          return res.status(403).json({ 
            error: 'Request blocked by security policy',
            violations: blockedViolations.map(v => ({ type: v.type, severity: v.severity }))
          });
        }
      }

      // Attach sanitized data
      if (validationResult.sanitized) {
        req.sanitized = validationResult.sanitized;
      }

      // Add CSRF token generator to response
      res.generateCSRFToken = () => security.generateCSRFToken(context.sessionId);

      next();
    },
    security
  };
};

export default SecurityMiddleware;
export type { SecurityConfig, SecurityViolation, RequestContext }; 