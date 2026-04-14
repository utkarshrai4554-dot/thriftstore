const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import email service directly
const emailService = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'styleease-email-service',
    version: '1.0.0'
  });
});

// Email API endpoints - direct implementation to avoid router conflicts
app.post('/api/send-otp', async (req, res) => {
  try {
    console.log('📧 OTP Request received:', req.body);
    
    // Direct email service implementation
    const nodemailer = require('nodemailer');
    
    const { email, otp, subject, template } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }
    
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    // Verify transporter
    await transporter.verify();
    console.log('✅ Gmail transporter verified');
    
    // Email content based on template
    let emailContent;
    if (template === 'otp_verification') {
      emailContent = {
        subject: subject || 'StyleEase - Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #ea580c; margin-bottom: 10px; }
              .otp-box { background-color: #f8f9fa; border: 2px dashed #ea580c; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 5px; margin: 10px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
              .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🛍️ StyleEase</div>
                <h2>Email Verification</h2>
              </div>
              
              <p>Hello,</p>
              <p>Thank you for registering with StyleEase! To complete your delivery guy registration, please use the verification code below:</p>
              
              <div class="otp-box">
                <p>Your verification code is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This code will expire in 10 minutes</li>
                  <li>Never share this code with anyone</li>
                  <li>StyleEase will never ask for your password via email</li>
                </ul>
              </div>
              
              <p>If you didn't request this verification code, you can safely ignore this email.</p>
              
              <div class="footer">
                <p>Best regards,<br>The StyleEase Team</p>
                <p>© 2024 StyleEase. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `StyleEase - Email Verification\n\nHello,\n\nThank you for registering with StyleEase! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes. Never share this code with anyone.\n\nIf you didn't request this verification code, you can safely ignore this email.\n\nBest regards,\nThe StyleEase Team`
      };
    } else {
      emailContent = {
        subject: subject || 'StyleEase Notification',
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
        text: `Your verification code is: ${otp}`
      };
    }
    
    // Send email
    const mailOptions = {
      from: `"StyleEase" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ OTP email sent successfully:', {
      messageId: info.messageId,
      to: email,
      subject: emailContent.subject
    });
    
    res.json({
      success: true,
      message: 'OTP email sent successfully',
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    let errorMessage = 'Failed to send OTP email';
    let statusCode = 500;
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check Gmail credentials.';
      statusCode = 401;
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to email service. Please try again.';
      statusCode = 503;
    } else if (error.code === 'EMESSAGE') {
      errorMessage = 'Invalid email address or message format.';
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const testOtp = '1234';
    
    // Use the same OTP sending logic
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    await transporter.verify();
    
    const mailOptions = {
      from: `"StyleEase Test" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'StyleEase - Test Email',
      html: `
        <h2>Test Email from StyleEase</h2>
        <p>This is a test email to verify Gmail configuration.</p>
        <p>If you receive this, your Gmail setup is working correctly!</p>
        <p>Test OTP: <strong>${testOtp}</strong></p>
      `,
      text: `Test Email from StyleEase\n\nThis is a test email. Test OTP: ${testOtp}`
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent:', info.messageId);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    availableEndpoints: ['/health', '/api/send-otp', '/api/test-email']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: error.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 StyleEase Email Server (FIXED) running on port', PORT);
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  console.log('📧 Email API: http://localhost:' + PORT + '/api/send-otp');
  console.log('🧪 Test Email: http://localhost:' + PORT + '/api/test-email');
  console.log('✅ Router conflicts eliminated - using direct implementation');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
