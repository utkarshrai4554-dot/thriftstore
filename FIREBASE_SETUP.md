# Firebase Setup Guide

This guide will help you set up Firebase for the Style Revival Hub authentication system.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter project name (e.g., "style-revival-hub")
4. Continue through the setup steps
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** from the left sidebar
2. Click **"Get started"** if it's your first time
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"** under the "Native providers" section
5. Enable **"Email/Password"** toggle
6. Click **"Save"**

## Step 3: Set Up Firestore Database

1. Go to **Firestore Database** from the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location for your database (choose closest to your users)
5. Click **"Create database"**

## Step 4: Get Firebase Configuration

1. Go to **Project Settings** (click the gear icon ⚙️ in the left sidebar)
2. Under **"Your apps"** section, click the **Web app** icon (`</>`)
3. Give your app a nickname (e.g., "Style Revival Web")
4. Click **"Register app"**
5. Copy the **firebaseConfig** object

## Step 5: Update Firebase Configuration

1. Open `src/lib/firebase.ts` in your project
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};
```

## Step 6: Set Up Firestore Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Add more rules for other collections as needed
  }
}
```

4. Click **"Publish"**

## Step 7: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/auth`

3. Test registration:
   - Click "Register" tab
   - Enter email, name, and password
   - Submit the form

4. Test login:
   - Click "Sign In" tab
   - Enter your registered credentials
   - Submit the form

## Step 8: Verify Data in Firestore

1. Go to Firebase Console → Firestore Database
2. Click on **"users"** collection
3. You should see user documents created during registration

## Common Issues & Solutions

### Issue: "auth/email-already-in-use"
**Solution:** The email is already registered. Try logging in or use a different email.

### Issue: "auth/invalid-email"
**Solution:** Check the email format. Make sure it's a valid email address.

### Issue: "auth/weak-password"
**Solution:** Password must be at least 6 characters long.

### Issue: Network errors
**Solution:** Check your internet connection and Firebase configuration.

### Issue: "Permission denied" in Firestore
**Solution:** Update your Firestore security rules to allow proper access.

## Production Deployment

When moving to production:

1. **Update Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /products/{productId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

2. **Enable Email Verification:**
   - Go to Authentication → Settings
   - Enable "Email verification" in the "Sign-in methods" section

3. **Configure Email Templates:**
   - Customize verification and password reset emails in Authentication → Templates

## Additional Features (Optional)

### Password Reset
The authentication system already supports password reset. To add a reset form:

```typescript
import { sendPasswordResetEmail } from 'firebase/auth';

const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    // Show success message
  } catch (error) {
    // Handle error
  }
};
```

### Google Sign-In
1. In Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add Google sign-in to your forms

### User Profile Updates
The `userService.ts` already includes methods to update user profiles.

## Support

If you encounter issues:

1. Check the Firebase Console for error messages
2. Verify your configuration in `src/lib/firebase.ts`
3. Check browser console for detailed error messages
4. Ensure Firestore rules are properly configured

## Next Steps

Once Firebase is set up:

1. Test all authentication flows
2. Implement additional features like email verification
3. Add more authentication providers if needed
4. Set up proper error handling and user feedback
5. Configure production-ready security rules
