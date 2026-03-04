# StyleEase Backend API

Complete backend system for StyleEase thrift store with product management, AI chatbot, and seller functionality.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
FRONTEND_URL=http://localhost:8080
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
```

### 3. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or use existing
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Save as `serviceAccountKey.json` in backend folder
6. Update Firestore security rules (see below)

### 4. Start Server
```bash
npm run dev
```

Server will run on: http://localhost:3001

## 📡 API Endpoints

### Products API
- `POST /api/products` - Create new product
- `GET /api/products` - Get approved products (public)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/seller/:sellerId` - Get seller's products
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/status` - Update product status (admin)

### Chat API
- `POST /api/chat` - AI-powered chat assistant
- `GET /api/chat/health` - Health check

## 🔥 Firestore Structure

### Products Collection
```javascript
{
  id: "auto-generated",
  title: "string",
  brand: "string", 
  category: "string",
  color: "string",
  size: "string",
  condition: "Like New | Good | Worn",
  originalPrice: number,
  sellingPrice: number,
  description: "string",
  images: ["url1", "url2"],
  sellerId: "user-id",
  status: "pending | approved | rejected",
  views: number,
  likes: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔐 Firestore Security Rules

Copy these rules to your Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if resource.data.status == 'approved';
      allow create: if request.auth != null;
      allow update: if (request.auth != null && 
        (resource.data.sellerId == request.auth.uid && resource.data.status == 'pending') ||
        request.auth.token.admin == true);
      allow delete: if (request.auth != null && 
        (resource.data.sellerId == request.auth.uid && resource.data.status == 'pending') ||
        request.auth.token.admin == true);
    }
    
    match /products/{productId}/likes/{likeId} {
      allow read, write: if request.auth != null;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🤖 AI-Ready Structure

The codebase is structured for easy AI integration:

### Future AI Functions (Placeholders)
- `generateDescription()` - AI-powered product descriptions
- `suggestPrice()` - AI price optimization
- `detectCondition()` - AI condition detection from images
- `generateTags()` - Smart product tagging
- `getSimilarProducts()` - AI-powered recommendations

### Integration Ready
All AI functions are already stubbed out in `services/productService.js` with proper error handling and structure for easy OpenAI integration.

## 🛡️ Security Features

- JWT authentication
- Rate limiting (30 requests/minute for chat, 100 requests/15min for products)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Firebase security rules

## 📊 Features

### Product Management
- ✅ Create, read, update, delete products
- ✅ Image upload to Firebase Storage
- ✅ Admin approval workflow
- ✅ Seller product management
- ✅ Public product listings
- ✅ Search and filtering
- ✅ View and like tracking

### Chatbot System
- ✅ AI-powered natural language processing
- ✅ Product search and recommendations
- ✅ Dynamic Firestore queries
- ✅ Mock responses for testing

### User Management
- ✅ Authentication middleware
- ✅ Role-based access control
- ✅ Seller and admin permissions

## 🧪 Testing

### Test Product Creation
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Shirt",
    "brand": "Nike",
    "category": "shirts",
    "sellingPrice": 299,
    "description": "A great shirt",
    "sellerId": "test-user-id"
  }'
```

### Test Chat API
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "show me black shirts under 500"}'
```

## 🚀 Deployment

1. Set production environment variables
2. Configure Firebase for production
3. Deploy to your preferred hosting platform
4. Update CORS origins for production domain

## 📝 Development Notes

- Uses Express.js with async/await
- Modular structure with controllers, services, routes
- Firebase Admin SDK for database operations
- JWT for authentication
- Comprehensive error handling
- Production-ready security measures
