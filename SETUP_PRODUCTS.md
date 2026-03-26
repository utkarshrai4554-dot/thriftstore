# Setup Products for StyleEase

## Quick Fix for Products Not Displaying

I've already updated the code to use Firebase instead of mock data. Now you need to populate your Firebase database with products.

## Option 1: Easy Browser Method (Recommended)

1. **Open the HTML tool** in your browser:
   ```
   file:///c:/palak/cpe/thriftstore/add-products-to-firebase.html
   ```

2. **Click "Add Sample Products to Firebase"** - this will add 8 sample products directly to your database

3. **Wait for success message** - you should see "Successfully added 8 products to Firebase!"

4. **Visit your products page** at `http://localhost:8081/products` to see the products

## Option 2: Backend Script Method

If you prefer using the backend:

1. **Open PowerShell as Administrator** and run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Navigate to the scripts directory**:
   ```powershell
   cd "c:\palak\cpe\thriftstore\backend\scripts"
   ```

3. **Run the sample products script**:
   ```powershell
   node addSampleProducts.cjs
   ```

## What I've Fixed

✅ **Removed mock data** from `src/pages/Products.tsx`
✅ **Restored Firebase integration** to fetch from the "products" collection
✅ **Fixed Firebase configuration** in backend files
✅ **Created tools** to populate your database with sample products

## Expected Results

After adding products, you should see:
- 8 products displayed on the products page
- All categories populated (Clothes, Shoes, Jewellery, Artifacts, Vintage)
- Proper filtering and search functionality
- "8 items found" instead of "0 items found"

## Troubleshooting

If products still don't appear:
1. Check browser console for Firebase errors
2. Ensure Firebase project is active
3. Verify products have `status: 'approved'`
4. Check network connectivity

The products page now correctly fetches from your Firebase "products" collection!
