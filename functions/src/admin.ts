import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * SUPER ADMIN EMAIL
 * This is the only email that can grant/remove admin roles
 * Change this to your actual super admin email
 */
const SUPER_ADMIN_EMAIL = 'admin@carelwavemedia.com';

/**
 * Grant admin role to a user using Firebase Custom Claims
 * This ensures server-side admin verification
 *
 * Only the super admin can call this function
 */
export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to perform this action'
    );
  }

  // Verify caller is the super admin
  const callerEmail = context.auth.token.email;
  if (callerEmail !== SUPER_ADMIN_EMAIL) {
    // Log security event
    await admin.firestore().collection('securityEvents').add({
      type: 'unauthorized_admin_attempt',
      userId: context.auth.uid,
      email: callerEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: 'setAdminRole',
      severity: 'high'
    });

    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the super admin can grant admin roles'
    );
  }

  // Validate input
  const { uid } = data;
  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID (uid) is required'
    );
  }

  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      admin: true
    });

    // Update user document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      role: 'admin',
      isAdmin: true,
      adminGrantedBy: context.auth.uid,
      adminGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log security event
    await admin.firestore().collection('securityEvents').add({
      type: 'admin_role_granted',
      grantedBy: context.auth.uid,
      grantedTo: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'medium'
    });

    functions.logger.info(`Admin role granted to user ${uid} by ${context.auth.uid}`);

    return {
      success: true,
      message: `Admin role granted to user ${uid}. User must sign out and sign back in for changes to take effect.`
    };
  } catch (error: any) {
    functions.logger.error('Error setting admin role:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to set admin role: ${error.message}`
    );
  }
});

/**
 * Remove admin role from a user
 * Only the super admin can call this function
 */
export const removeAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to perform this action'
    );
  }

  // Verify caller is the super admin
  const callerEmail = context.auth.token.email;
  if (callerEmail !== SUPER_ADMIN_EMAIL) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the super admin can remove admin roles'
    );
  }

  // Validate input
  const { uid } = data;
  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID (uid) is required'
    );
  }

  // Prevent removing admin from super admin
  try {
    const user = await admin.auth().getUser(uid);
    if (user.email === SUPER_ADMIN_EMAIL) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot remove admin role from super admin'
      );
    }
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'not-found',
      `User not found: ${error.message}`
    );
  }

  try {
    // Remove custom claims
    await admin.auth().setCustomUserClaims(uid, {
      admin: false
    });

    // Update user document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      role: 'user',
      isAdmin: false,
      adminRevokedBy: context.auth.uid,
      adminRevokedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log security event
    await admin.firestore().collection('securityEvents').add({
      type: 'admin_role_revoked',
      revokedBy: context.auth.uid,
      revokedFrom: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'medium'
    });

    functions.logger.info(`Admin role removed from user ${uid} by ${context.auth.uid}`);

    return {
      success: true,
      message: `Admin role removed from user ${uid}. User must sign out and sign back in for changes to take effect.`
    };
  } catch (error: any) {
    functions.logger.error('Error removing admin role:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to remove admin role: ${error.message}`
    );
  }
});

/**
 * Check admin status of current user
 * Returns the custom claims for the authenticated user
 */
export const checkAdminStatus = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to check admin status'
    );
  }

  try {
    const user = await admin.auth().getUser(context.auth.uid);
    const customClaims = user.customClaims || {};

    return {
      uid: user.uid,
      email: user.email,
      isAdmin: customClaims.admin === true,
      customClaims
    };
  } catch (error: any) {
    functions.logger.error('Error checking admin status:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to check admin status: ${error.message}`
    );
  }
});
