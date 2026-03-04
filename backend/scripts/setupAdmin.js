const { admin } = require('../config/firebase');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Create customer user in Firebase Auth
async function createCustomerUser() {
  try {
    const auth = getAuth();
    
    // Create customer user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'customer@styleease.com',
      'customer123456'
    );
    
    const user = userCredential.user;
    
    // Add customer role in Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: 'Customer User',
      role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Customer user created successfully!');
    console.log('📧 Email: customer@styleease.com');
    console.log('🔑 Password: customer123456');
    console.log('🌐 Login: http://localhost:8081/auth');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Customer user already exists');
    } else {
      console.error('❌ Error creating customer user:', error);
    }
  }
}

// Run the setup
createCustomerUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
