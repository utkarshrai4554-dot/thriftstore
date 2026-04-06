const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Installing nodemailer...');

try {
  // Try to install nodemailer
  execSync('npm install nodemailer', { stdio: 'inherit' });
  console.log('✅ nodemailer installed successfully!');
  
  // Check if it's installed
  try {
    require('nodemailer');
    console.log('✅ nodemailer is ready to use!');
    
    // Update the backend to use real email sending
    console.log('📧 Ready to send real OTP emails!');
    
  } catch (error) {
    console.log('❌ nodemailer installation failed');
  }
  
} catch (error) {
  console.log('❌ Could not install nodemailer automatically');
  console.log('💡 Please run manually: npm install nodemailer');
}

console.log('\n📋 Next steps:');
console.log('1. Restart the backend server');
console.log('2. Test OTP sending');
