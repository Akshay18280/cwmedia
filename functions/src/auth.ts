import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Rate limiter configuration
 */
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Check rate limit for an identifier
 */
async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const docRef = admin.firestore().collection('rateLimits').doc(identifier);

  return await admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);

    let requests: number[] = [];
    if (doc.exists) {
      requests = doc.data()?.requests || [];
      // Filter out old requests
      requests = requests.filter((timestamp: number) => timestamp > windowStart);
    }

    if (requests.length >= config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    requests.push(now);
    transaction.set(docRef, { requests }, { merge: true });

    return {
      allowed: true,
      remaining: config.maxRequests - requests.length
    };
  });
}

/**
 * Send OTP via SMS (placeholder - integrate with Twilio/similar)
 * Rate limited to prevent abuse
 */
export const sendOTP = functions.https.onCall(async (data, context) => {
  const { phoneNumber } = data;

  // Validate input
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Phone number is required'
    );
  }

  // Rate limit by phone number and IP
  const identifier = context.auth?.uid || context.rawRequest.ip || 'anonymous';

  const rateCheck = await checkRateLimit(identifier, {
    maxRequests: 3, // 3 OTPs per hour
    windowMs: 60 * 60 * 1000 // 1 hour
  });

  if (!rateCheck.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many OTP requests. Please try again later.'
    );
  }

  try {
    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in Firestore
    await admin.firestore().collection('otp').doc(phoneNumber).set({
      phoneNumber,
      otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      verified: false,
      attempts: 0
    });

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // For now, log in development
    if (process.env.NODE_ENV === 'development') {
      functions.logger.info(`[DEV] OTP for ${phoneNumber}: ${otp}`);
    }

    // In production, send actual SMS:
    // await twilioClient.messages.create({
    //   body: `Your Carelwave Media verification code is: ${otp}. Valid for 10 minutes.`,
    //   to: phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toMillis()
    };
  } catch (error: any) {
    functions.logger.error('Error sending OTP:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to send OTP: ${error.message}`
    );
  }
});

/**
 * Verify OTP
 * Rate limited to prevent brute force attacks
 */
export const verifyOTP = functions.https.onCall(async (data, context) => {
  const { phoneNumber, otp } = data;

  // Validate input
  if (!phoneNumber || !otp) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Phone number and OTP are required'
    );
  }

  // Rate limit verification attempts
  const identifier = `verify_${phoneNumber}`;
  const rateCheck = await checkRateLimit(identifier, {
    maxRequests: 5, // 5 attempts per 15 minutes
    windowMs: 15 * 60 * 1000 // 15 minutes
  });

  if (!rateCheck.allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many verification attempts. Please request a new OTP.'
    );
  }

  try {
    const otpDoc = await admin.firestore().collection('otp').doc(phoneNumber).get();

    if (!otpDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'OTP not found. Please request a new OTP.'
      );
    }

    const otpData = otpDoc.data()!;
    const now = admin.firestore.Timestamp.now();

    // Check if OTP expired
    if (now.toMillis() > otpData.expiresAt.toMillis()) {
      await otpDoc.ref.delete(); // Clean up expired OTP
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'OTP has expired. Please request a new OTP.'
      );
    }

    // Check if already verified
    if (otpData.verified) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'OTP has already been used. Please request a new OTP.'
      );
    }

    // Check attempts
    const attempts = (otpData.attempts || 0) + 1;
    if (attempts > 5) {
      await otpDoc.ref.delete(); // Delete after too many attempts
      throw new functions.https.HttpsError(
        'permission-denied',
        'Too many incorrect attempts. Please request a new OTP.'
      );
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempt counter
      await otpDoc.ref.update({
        attempts: admin.firestore.FieldValue.increment(1)
      });

      throw new functions.https.HttpsError(
        'permission-denied',
        'Invalid OTP. Please check and try again.'
      );
    }

    // Mark as verified
    await otpDoc.ref.update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Clean up after successful verification (optional)
    setTimeout(async () => {
      await otpDoc.ref.delete();
    }, 5000);

    return {
      success: true,
      message: 'Phone number verified successfully'
    };
  } catch (error: any) {
    // If it's already a functions error, rethrow it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    functions.logger.error('Error verifying OTP:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to verify OTP: ${error.message}`
    );
  }
});
