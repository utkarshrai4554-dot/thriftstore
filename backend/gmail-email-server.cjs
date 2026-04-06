const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Gmail SMTP configuration
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// OTP email template
const getOTPTemplate = (otp, email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>StyleEase - Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .otp-code {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 32px;
          font-weight: bold;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          letter-spacing: 8px;
          margin: 20px 0;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .security-notice {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🛍️ StyleEase</div>
          <h1>Email Verification</h1>
        </div>
        
        <p>Hello,</p>
        <p>Thank you for registering with StyleEase! To complete your registration, please use the verification code below:</p>
        
        <div class="otp-code">${otp}</div>
        
        <div class="info">
          <h3>📋 Important Information:</h3>
          <ul>
            <li>This code will expire in <strong>10 minutes</strong></li>
            <li>Enter this code in the verification screen</li>
            <li>Do not share this code with anyone</li>
          </ul>
        </div>
        
        <div class="security-notice">
          <h3>🔒 Security Notice:</h3>
          <p>StyleEase will never ask for your password or verification code via email. If you didn't request this code, please ignore this email.</p>
        </div>
        
        <div class="footer">
          <p>Need help? Contact us at <a href="mailto:support@styleease.com">support@styleease.com</a></p>
          <p>&copy; 2024 StyleEase. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'styleease-gmail-email',
    version: '1.0.0'
  });
});

// Email status endpoint
app.get('/api/email-status', async (req, res) => {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailAppPassword) {
      return res.json({ 
        success: false, 
        message: 'Gmail credentials not configured',
        user: gmailUser || 'not set',
        password: gmailAppPassword ? 'configured' : 'not set'
      });
    }
    
    const transporter = createGmailTransporter();
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: 'Gmail SMTP connection verified',
      service: 'Gmail SMTP',
      user: gmailUser,
      connection_status: 'verified'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Gmail connection failed',
      error: error.message 
    });
  }
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, otp, subject } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }
    
    console.log('📧 Sending OTP email to:', email);
    console.log('🔢 OTP code:', otp);
    
    // Check Gmail credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        success: false, 
        message: 'Gmail credentials not configured'
      });
    }
    
    // Create Gmail transporter
    const transporter = createGmailTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    
    // Email content
    const mailOptions = {
      from: `"StyleEase" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject || 'StyleEase - Email Verification Code',
      html: getOTPTemplate(otp, email),
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'OTP email sent successfully',
      messageId: info.messageId,
      email: email,
      note: 'Check your inbox (and spam folder)'
    });
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    let errorMessage = 'Failed to send OTP email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Check your Gmail credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to Gmail SMTP. Check your internet connection.';
    } else if (error.code === 'EMESSAGE') {
      errorMessage = 'Invalid email address or message format.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.message 
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Gmail Email Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Email Status: http://localhost:${PORT}/api/email-status`);
  console.log(`📨 Send OTP: POST http://localhost:${PORT}/api/send-otp`);
  console.log(`📬 Gmail configured: ${process.env.GMAIL_USER}`);
});

module.exports = app;
