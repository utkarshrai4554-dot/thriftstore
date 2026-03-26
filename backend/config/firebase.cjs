const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with minimal config for development
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "styleease-2170f",
    // For development, we'll use the client-side config approach
    // In production, you should use proper service account credentials
  });
}

// Export Firestore instance
const db = admin.firestore();

// Export for use in other modules
module.exports = { db, admin };
