import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Update metadata (categories and tags) when posts are created/updated
 * This allows for fast category/tag queries without loading all posts
 */
export const updateMetadataOnPostWrite = functions.firestore
  .document('posts/{postId}')
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const metadataRef = db.collection('metadata');

    // Get the post data
    const post = change.after.exists ? change.after.data() : null;

    try {
      // If post is being deleted or unpublished
      if (!post || post.status !== 'published') {
        // Optionally rebuild metadata to remove deleted/unpublished post data
        // For now, we'll just skip - metadata will still show historical categories
        return null;
      }

      // Update categories
      if (post.category) {
        await metadataRef.doc('categories').set({
          items: admin.firestore.FieldValue.arrayUnion(post.category),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Update tags
      if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
        await metadataRef.doc('tags').set({
          items: admin.firestore.FieldValue.arrayUnion(...post.tags),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      functions.logger.info(`Metadata updated for post ${context.params.postId}`);
      return null;
    } catch (error) {
      functions.logger.error('Error updating metadata:', error);
      // Don't throw - we don't want to fail the post write
      return null;
    }
  });

/**
 * Similar function for video posts
 */
export const updateMetadataOnVideoPostWrite = functions.firestore
  .document('videoPosts/{videoId}')
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const metadataRef = db.collection('metadata');

    const post = change.after.exists ? change.after.data() : null;

    try {
      if (!post || post.status !== 'published') {
        return null;
      }

      // Update categories
      if (post.category) {
        await metadataRef.doc('videoCategories').set({
          items: admin.firestore.FieldValue.arrayUnion(post.category),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Update tags
      if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
        await metadataRef.doc('videoTags').set({
          items: admin.firestore.FieldValue.arrayUnion(...post.tags),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      return null;
    } catch (error) {
      functions.logger.error('Error updating video metadata:', error);
      return null;
    }
  });
