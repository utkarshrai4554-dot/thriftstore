// Check if nodemailer is available
try {
  const nodemailer = require('nodemailer');
  console.log('✅ nodemailer is available');
  
  // Test Gmail configuration
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass || user === 'your-gmail@gmail.com') {
    console.log('❌ Gmail credentials not configured');
    console.log('Please update backend/.env with your Gmail credentials');
    process.exit(1);
  }
  
  console.log('✅ Gmail credentials configured');
  console.log('User:', user);
  console.log('Password configured:', !!pass);
  
  // Create transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: { user, pass }
  });
  
  // Test connection
  transporter.verify().then(() => {
    console.log('✅ Gmail SMTP connection successful!');
    console.log('🎉 Ready to send OTP emails!');
  }).catch(error => {
    console.error('❌ Gmail connection failed:', error.message);
    if (error.code === 'EAUTH') {
      console.log('💡 Check your Gmail app password');
    }
  });
  
} catch (error) {
  console.log('❌ nodemailer not installed');
  console.log('💡 Run: npm install nodemailer');
}
