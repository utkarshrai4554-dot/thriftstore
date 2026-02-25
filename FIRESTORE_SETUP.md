# Firestore Security Rules Setup

## Problem
The cart and wishlist are falling back to localStorage because Firestore security rules are not configured properly.

## Solution

### Step 1: Deploy Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `styleease-2170f`
3. Go to **Firestore Database** → **Rules** tab
4. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own wishlist
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow read/write for test documents (remove in production)
    match /test/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click **Publish**

### Step 2: Verify Setup

After deploying the rules:

1. Open your browser console
2. Run: `testFirestoreConnection()`
3. You should see "✅" messages instead of "❌"

### Step 3: Test Cart/Wishlist

1. Login to your app
2. Add items to cart/wishlist
3. Refresh the page
4. Items should persist (using Firestore)

## Current Behavior

If you see "Using local storage - database unavailable" in the console:
- Firestore security rules are not properly configured
- The app is falling back to localStorage (which still works!)
- Your data is safe, just stored locally

## Benefits of Proper Setup

✅ **Multi-device sync**: Cart/wishlist syncs across all your devices  
✅ **Real-time updates**: Changes appear instantly  
✅ **Cloud backup**: Data is safely stored in Firebase  
✅ **User isolation**: Each user has their own private cart/wishlist  

## Fallback Behavior

Even if Firestore doesn't work:
- ✅ Cart and wishlist still function
- ✅ Data persists in localStorage
- ✅ Works offline
- ✅ No data loss

The localStorage fallback ensures your app always works!
