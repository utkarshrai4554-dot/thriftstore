const { admin } = require('../config/firebase');

// Change user role from admin to customer
async function changeUserRole(email, newRole) {
  try {
    console.log(`🔄 Changing role for ${email} to ${newRole}...`);
    
    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    
    if (!userRecord) {
      console.log('❌ User not found with email:', email);
      return;
    }
    
    console.log(`👤 Found user: ${userRecord.uid}`);
    
    // Update role in Firestore users collection
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If changing from admin to customer, remove from admins collection
    if (newRole === 'customer') {
      await admin.firestore().collection('admins').doc(email).delete();
      console.log('🗑️ Removed from admins collection');
    }
    
    // If changing from customer to admin, add to admins collection
    if (newRole === 'admin') {
      await admin.firestore().collection('admins').doc(email).set({
        uid: userRecord.uid,
        email: userRecord.email,
        role: 'admin',
        permissions: [
          'manage_products',
          'manage_orders', 
          'manage_users',
          'view_analytics'
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });
      console.log('➕ Added to admins collection');
    }
    
    console.log(`✅ Successfully changed role to ${newRole} for ${email}`);
    console.log(`🌐 User can now login at: http://localhost:8081/auth`);
    
  } catch (error) {
    console.error('❌ Error changing user role:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const newRole = args[1];

if (!email || !newRole) {
  console.log('Usage: node changeUserRole.js <email> <role>');
  console.log('Example: node changeUserRole.js admin@styleease.com customer');
  console.log('Available roles: admin, customer');
  process.exit(1);
}

if (!['admin', 'customer'].includes(newRole)) {
  console.log('❌ Invalid role. Available roles: admin, customer');
  process.exit(1);
}

// Run the role change
changeUserRole(email, newRole).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Role change failed:', error);
  process.exit(1);
});
