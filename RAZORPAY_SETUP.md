# Razorpay Payment Gateway Setup Guide

This guide will help you set up Razorpay payment gateway for your StyleEase multi-vendor thrift e-commerce platform.

## **🚀 Step-by-Step Setup**

### **Step 1: Create Razorpay Account**

1. **Go to [razorpay.com](https://razorpay.com)**
2. **Click "Sign up"**
3. **Fill in your details**:
   - Email: Your email address
   - Phone: Your phone number
   - Business type: Individual/Sole Proprietorship
   - Industry: Retail/E-commerce
4. **Verify email and phone**
5. **Complete basic KYC** (can do minimal verification for testing)

### **Step 2: Get Your API Keys**

1. **Login to Razorpay Dashboard**
2. **Go to Settings → API Keys**
3. **Generate Test Keys** (for development)
4. **Copy your keys**:
   - **Key ID**: `rzp_test_...`
   - **Key Secret**: Your secret key

### **Step 3: Update Environment Variables**

Edit `backend/.env`:
```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_secret_key_here

# Platform Configuration
PLATFORM_COMMISSION_RATE=0.10
PLATFORM_EMAIL=support@styleease.com

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### **Step 4: Install Dependencies**

```bash
# Backend dependencies
cd backend
npm install razorpay

# Frontend dependencies (already installed)
cd ..
npm install @types/razorpay
```

### **Step 5: Start Backend Server**

```bash
cd backend
npm start
```

You should see:
```
🚀 StyleEase API Server running on port 3001
💳 Razorpay API: http://localhost:3001/api/razorpay
```

### **Step 6: Start Frontend**

```bash
npm run dev
```

### **Step 7: Test Payment Flow**

1. **Add products to cart**
2. **Click "Proceed to Checkout"**
3. **Fill shipping address**
4. **Click "Pay ₹XX.XX"**
5. **Complete Razorpay payment**

## **🧪 Test Cards for Razorpay**

### **Successful Payment**
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

### **Failed Payment**
- **Card Number**: `4111 1111 1111 1112`
- **Expiry**: Any past date

## **🔧 Razorpay Features Available**

### **✅ Payment Methods**
- Credit/Debit Cards
- Net Banking
- UPI
- Wallets (Paytm, PhonePe, etc.)
- EMI options

### **✅ Security Features**
- PCI DSS compliance
- 3D Secure authentication
- Fraud detection
- Secure checkout

### **✅ Business Features**
- Multi-vendor support
- Commission handling
- Order management
- Payment tracking
- Refund processing

## **📱 Mobile App Support**

Razorpay provides excellent mobile SDKs for:
- **React Native**
- **Flutter**
- **Android Native**
- **iOS Native**

## **🌐 Production Setup**

### **Step 1: Get Live Keys**
1. **Go to Razorpay Dashboard**
2. **Switch to Live Mode**
3. **Generate Live API Keys**
4. **Update environment variables**

### **Step 2: Domain Configuration**
1. **Update FRONTEND_URL** in backend:
```bash
FRONTEND_URL=https://yourdomain.com
```

### **Step 3: Webhook Setup**
1. **Go to Settings → Webhooks**
2. **Add webhook URL**: `https://yourdomain.com/api/razorpay/webhook`
3. **Select events**:
   - `order.paid`
   - `payment.failed`
   - `refund.processed`

### **Step 4: Compliance**
1. **Complete full KYC**
2. **Add business details**
3. **Set up bank account**
4. **Enable auto-refunds**

## **🎯 Key Differences: Razorpay vs Stripe**

| Feature | Razorpay | Stripe |
|---------|----------|--------|
| **India Support** | ✅ Excellent | ❌ Invite only |
| **Setup Time** | ⚡ 5 minutes | 🕐 30+ minutes |
| **Test Mode** | ✅ Easy | ✅ Complex |
| **Pricing** | 💰 2% + GST | 💰 2.9% + 3% |
| **UPI Support** | ✅ Built-in | ❌ Not available |
| **Mobile SDK** | ✅ Excellent | ✅ Excellent |
| **Documentation** | ✅ Clear | ✅ Extensive |

## **🚨 Common Issues & Solutions**

### **Issue: "Invalid API Key"**
- **Solution**: Check if you're using test keys for development
- **Test keys start with**: `rzp_test_`

### **Issue: "Order creation failed"**
- **Solution**: Ensure backend server is running
- **Check**: PORT=3001 is available

### **Issue: "Payment verification failed"**
- **Solution**: Check webhook signature verification
- **Ensure**: RAZORPAY_KEY_SECRET is correct

### **Issue: "Cart navigation not working"**
- **Solution**: Check if `/checkout` route exists in App.tsx
- **Ensure**: Cart component has `useNavigate` hook

## **🎉 Success Checklist**

Before going live:
- [ ] Razorpay account created and verified
- [ ] API keys configured in backend
- [ ] Backend server running on port 3001
- [ ] Frontend running on port 5173
- [ ] Cart to checkout navigation working
- [ ] Test payment successful
- [ ] Order creation working
- [ ] Payment verification working
- [ ] Refund functionality tested

## **📞 Support**

- **Razorpay Support**: support@razorpay.com
- **Documentation**: https://razorpay.com/docs
- **Developer Forum**: https://razorpay.com/forum
- **Status Page**: https://status.razorpay.com

## **🚀 Next Steps**

Once Razorpay is working:
1. **Test with real payments** (small amounts)
2. **Set up webhooks** for production
3. **Configure auto-refunds**
4. **Add email notifications**
5. **Set up analytics and reporting**

## **💡 Pro Tips**

1. **Always use test keys for development**
2. **Test all payment methods** (Cards, UPI, NetBanking)
3. **Test refund process**
4. **Monitor webhook logs**
5. **Keep your keys secure and never commit them**

Your Razorpay payment gateway is now ready! 🎉
