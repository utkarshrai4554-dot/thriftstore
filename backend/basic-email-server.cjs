const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'styleease-basic-email',
    version: '1.0.0'
  });
});

// Email status endpoint
app.get('/api/email-status', (req, res) => {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailAppPassword || gmailUser === 'your-gmail@gmail.com') {
      return res.json({ 
        success: false, 
        message: 'Gmail credentials not configured',
        user: gmailUser || 'not set',
        password: gmailAppPassword ? 'configured' : 'not set',
        instructions: 'Please set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Email service is configured',
      service: 'Gmail SMTP',
      user: gmailUser,
      connection_status: 'ready'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Email service error',
      error: error.message 
    });
  }
});

// Simple OTP endpoint (without nodemailer for now)
app.post('/api/send-otp', (req, res) => {
  try {
    const { email, otp, subject } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }
    
    console.log('📧 Would send OTP email to:', email);
    console.log('🔢 OTP code:', otp);
    
    // Check if Gmail is configured
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailAppPassword || gmailUser === 'your-gmail@gmail.com') {
      console.log('⚠️ Gmail not configured - showing OTP in console');
      
      // Show OTP in console
      console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                    STYLEESE VERIFICATION                   ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  Your 4-digit verification code is: ${otp}                     ║
    ║                                                              ║
    ║  This code will expire in 10 minutes.                           ║
    ║  Please do not share this code with anyone.                     ║
    ╚══════════════════════════════════════════════════════════════╝
    
    Email: ${email}
      `);
      
      return res.json({ 
        success: true, 
        message: 'OTP displayed in console (Gmail not configured)',
        development_mode: true,
        email: email,
        otp: otp,
        gmail_configured: false
      });
    }
    
    // If Gmail is configured, we would send the email here
    console.log('✅ Gmail configured - ready to send email');
    
    res.json({ 
      success: true, 
      message: 'Email sending simulated (nodemailer needs to be installed)',
      email: email,
      otp: otp,
      gmail_configured: true,
      note: 'Install nodemailer and update routes to send actual emails'
    });
    
  } catch (error) {
    console.error('❌ Error processing OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process OTP',
      error: error.message 
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Basic Email Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Email Status: http://localhost:${PORT}/api/email-status`);
  console.log(`📨 Send OTP: POST http://localhost:${PORT}/api/send-otp`);
  console.log(`\n📝 To send actual emails:`);
  console.log(`1. Configure Gmail credentials in backend/.env`);
  console.log(`2. Install nodemailer: npm install nodemailer`);
  console.log(`3. Update server to use email routes with nodemailer`);
});

module.exports = app;
