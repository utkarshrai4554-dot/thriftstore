const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Gmail SMTP configuration
const createGmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Simple OTP email template
const getSimpleOTPTemplate = (otp, email) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">🛍️ StyleEase - Email Verification</h2>
      <p>Hello,</p>
      <p>Thank you for registering with StyleEase! Your verification code is:</p>
      
      <div style="background: #2563eb; color: white; font-size: 24px; font-weight: bold; 
                  padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      
      <p><strong>This code will expire in 10 minutes.</strong></p>
      <p>If you didn't request this code, please ignore this email.</p>
      
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 14px;">
        Need help? Contact us at support@styleease.com<br>
        © 2024 StyleEase. All rights reserved.
      </p>
    </div>
  `;
};

// POST /api/send-otp
router.post('/send-otp', async (req, res) => {
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
      console.log('⚠️ Gmail credentials not configured - showing OTP in console');
      
      // Show OTP in console for development
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
        otp: otp
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
      html: getSimpleOTPTemplate(otp, email),
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'OTP email sent successfully',
      messageId: info.messageId,
      email: email,
      otp: otp // Include OTP for development testing
    });
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    // Detailed error handling
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

// GET /api/email-status
router.get('/email-status', async (req, res) => {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailAppPassword) {
      return res.json({ 
        success: false, 
        message: 'Gmail credentials not configured',
        user: gmailUser || 'not set',
        password: gmailAppPassword ? 'configured' : 'not set',
        instructions: 'Please set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env'
      });
    }
    
    const transporter = createGmailTransporter();
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: 'Email service is working',
      service: 'Gmail SMTP',
      user: gmailUser,
      connection_status: 'verified'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Email service not configured',
      error: error.message 
    });
  }
});

module.exports = router;
