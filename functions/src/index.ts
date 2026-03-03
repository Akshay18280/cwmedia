import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import and export individual function modules
export { setAdminRole, removeAdminRole, checkAdminStatus } from './admin';
export { sendOTP, verifyOTP } from './auth';
export { updateMetadataOnPostWrite, updateMetadataOnVideoPostWrite } from './metadata';
