#!/usr/bin/env node

/**
 * Set Admin Role Script
 *
 * This script grants admin role to a user using Firebase Admin SDK.
 * It sets both Custom Claims and Firestore user document.
 *
 * Usage:
 *   node scripts/set-admin.js user@example.com
 *
 * Prerequisites:
 *   1. Firebase service account key file
 *   2. npm install firebase-admin
 */

const admin = require('firebase-admin');
const path = require('path');

// Get email from command line argument
const adminEmail = process.argv[2];

if (!adminEmail) {
  console.error('❌ Error: Email address is required');
  console.log('Usage: node scripts/set-admin.js user@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(adminEmail)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  // Try to load service account key
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

  console.log('🔧 Initializing Firebase Admin...');

  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized with service account');
  } catch (error) {
    // If service account file not found, try default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('✅ Firebase Admin initialized with application default credentials');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n📝 Instructions:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save as "serviceAccountKey.json" in project root');
  console.log('4. Re-run this script\n');
  console.log('OR set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}

async function setAdmin() {
  try {
    console.log(`\n🔍 Looking for user with email: ${adminEmail}`);

    // Get user by email
    const user = await admin.auth().getUserByEmail(adminEmail);
    console.log(`✅ Found user: ${user.uid}`);

    // Set custom claims
    console.log('🔐 Setting admin custom claims...');
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    });
    console.log('✅ Custom claims set');

    // Update Firestore user document
    console.log('📝 Updating Firestore user document...');
    await admin.firestore().collection('users').doc(user.uid).set({
      role: 'admin',
      isAdmin: true,
      adminGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminGrantedBy: 'set-admin-script'
    }, { merge: true });
    console.log('✅ Firestore document updated');

    // Log security event
    await admin.firestore().collection('securityEvents').add({
      type: 'admin_role_granted',
      grantedTo: user.uid,
      grantedToEmail: adminEmail,
      grantedBy: 'set-admin-script',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'high'
    });

    console.log('\n✅ SUCCESS! Admin role granted to:', adminEmail);
    console.log('\n⚠️  IMPORTANT: User must sign out and sign back in for changes to take effect.\n');

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌ Error: No user found with email: ${adminEmail}`);
      console.log('💡 The user must sign up first before being granted admin role.\n');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
setAdmin();
