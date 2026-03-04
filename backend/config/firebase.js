import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpKm4tr8kg9-fy4psyAajPhU8T9IHAzQ0",
  authDomain: "styleease-2170f.firebaseapp.com",
  projectId: "styleease-2170f",
  storageBucket: "styleease-2170f.firebasestorage.app",
  messagingSenderId: "921047643742",
  appId: "1:921047643742:web:29a1189bd75f69cf42e6cf",
  measurementId: "G-DM4BG77729"
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      "type": "service_account",
      "project_id": "styleease-2170f",
      "private_key_id": "your-private-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-xxxxx@styleease-2170f.iam.gserviceaccount.com",
      "client_id": "123456789012345678901",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/yourproject.iam.gserviceaccount.com"
    }),
    databaseURL: "https://styleease-2170f.firebaseio.com"
  });
}

// Export Firestore instance
const db = admin.firestore();

// Export for use in other modules
export { db, admin };

// Initialize Firebase App for client-side operations
const app = initializeApp(firebaseConfig);

export default app;
