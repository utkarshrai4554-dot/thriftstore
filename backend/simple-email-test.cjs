const express = require('express');
const emailRoutes = require('./routes/email-simple');
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
    service: 'styleease-simple-test',
    version: '1.0.0'
  });
});

// Simple email status endpoint
app.get('/api/email-status', (req, res) => {
  try {
    // Check if environment variables are set
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({ 
        success: false, 
        message: 'Gmail credentials not configured',
        user: gmailUser ? 'configured' : 'missing',
        password: gmailAppPassword ? 'configured' : 'missing'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Email service is configured',
      service: 'Gmail SMTP',
      user: gmailUser,
      password_status: 'configured'
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
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }
    
    console.log('📧 Would send OTP email to:', email);
    console.log('🔢 OTP code:', otp);
    
    res.json({ 
      success: true, 
      message: 'OTP endpoint working (nodemailer needs to be installed)',
      email: email,
      otp: otp
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process OTP',
      error: error.message 
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple Email Test Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Email Status: http://localhost:${PORT}/api/email-status`);
  console.log(`📨 Send OTP: POST http://localhost:${PORT}/api/send-otp`);
});

module.exports = app;
