const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqkq8y8nL0Qr5t9n0m2l1k9j8f7g6d5e4",
  authDomain: "thriftstore-123.firebaseapp.com",
  projectId: "thriftstore-123",
  storageBucket: "thriftstore-123.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndCreateOrders() {
  try {
    console.log('🔍 Checking existing orders...');
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    
    console.log(`📊 Found ${snapshot.size} orders in database`);
    
    if (snapshot.size === 0) {
      console.log('📝 No orders found. Creating sample orders...');
      
      // Sample order data
      const sampleOrders = [
        {
          userId: "test-user-123",
          orderNumber: "ORD-20240413-001",
          items: [
            {
              productId: "product-1",
              productName: "Vintage Denim Jacket",
              productImage: "/placeholder.jpg",
              quantity: 1,
              price: 1299,
              size: "M",
              color: "Blue",
              category: "Clothing"
            }
          ],
          totalAmount: 1299,
          finalAmount: 1299,
          status: "delivered",
          shippingAddress: {
            street: "123 Fashion Street",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001",
            country: "India"
          },
          paymentMethod: "Credit Card",
          paymentStatus: "paid",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          estimatedDelivery: serverTimestamp(),
          trackingNumber: "TRK123456789",
          deliveryPartnerName: "Express Delivery"
        },
        {
          userId: "test-user-123",
          orderNumber: "ORD-20240413-002",
          items: [
            {
              productId: "product-2",
              productName: "Leather Handbag",
              productImage: "/placeholder.jpg",
              quantity: 2,
              price: 899,
              size: "One Size",
              color: "Brown",
              category: "Accessories"
            }
          ],
          totalAmount: 1798,
          finalAmount: 1698,
          couponCode: "SAVE10",
          pointsUsed: 100,
          status: "shipped",
          shippingAddress: {
            street: "456 Style Avenue",
            city: "Delhi",
            state: "Delhi",
            zipCode: "110001",
            country: "India"
          },
          paymentMethod: "Debit Card",
          paymentStatus: "paid",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          estimatedDelivery: serverTimestamp(),
          trackingNumber: "TRK987654321",
          deliveryPartnerName: "Quick Ship"
        }
      ];
      
      for (const orderData of sampleOrders) {
        const docRef = await addDoc(ordersRef, orderData);
        console.log(`✅ Created sample order: ${docRef.id}`);
      }
      
      console.log('🎉 Sample orders created successfully!');
    } else {
      console.log('📋 Existing orders:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  📦 Order ${doc.id}: ${data.orderNumber} - Status: ${data.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateOrders();
