const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const router = express.Router();

// Gmail SMTP configuration
const createGmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail app password (not regular password)
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

/**
 * POST /api/send-otp
 * Send OTP email via Gmail SMTP
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, otp, subject, template } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }
    
    console.log('📧 Sending OTP email via Gmail SMTP:', email);
    
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
      preview: nodemailer.getTestMessageUrl(info)
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

/**
 * GET /api/email-status
 * Check email service status
 */
router.get('/email-status', async (req, res) => {
  try {
    const transporter = createGmailTransporter();
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: 'Email service is working',
      service: 'Gmail SMTP',
      user: process.env.GMAIL_USER
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Email service not configured',
      error: error.message 
    });
  }
});

// Delivery Agent Approval email template
const getDeliveryAgentApprovalTemplate = (displayName, password) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>StyleEase - Delivery Agent Application Approved!</title>
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
        .approval-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 24px;
          font-weight: bold;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        .credentials {
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
        .next-steps {
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          color: #0369a1;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">StyleEase</div>
          <h1>Congratulations! You're Approved!</h1>
        </div>
        
        <p>Dear ${displayName},</p>
        <p>We're thrilled to inform you that your delivery agent application has been <strong>approved</strong>! Welcome to the StyleEase team.</p>
        
        <div class="approval-badge">
          APPLICATION APPROVED!
        </div>
        
        <div class="credentials">
          <h3> Your Login Credentials:</h3>
          <p><strong>Email:</strong> Your registered email address</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><em>Please change your password after your first login for security.</em></p>
        </div>
        
        <div class="next-steps">
          <h3> Next Steps:</h3>
          <ul>
            <li>Log in to your StyleEase delivery agent account</li>
            <li>Update your profile and availability</li>
            <li>Start receiving delivery assignments</li>
            <li>Begin earning with every successful delivery!</li>
          </ul>
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

/**
 * POST /api/send-approval-email
 * Send delivery agent approval email
 */
router.post('/send-approval-email', async (req, res) => {
  try {
    const { email, displayName, password, subject, template } = req.body;
    
    if (!email || !displayName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, display name, and password are required' 
      });
    }
    
    console.log('Sending delivery agent approval email:', email);
    
    // Create Gmail transporter
    const transporter = createGmailTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    console.log('Gmail SMTP connection verified');
    
    // Email content
    const mailOptions = {
      from: `"StyleEase" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject || 'StyleEase - Delivery Agent Application Approved!',
      html: getDeliveryAgentApprovalTemplate(displayName, password),
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Approval email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Delivery agent approval email sent successfully',
      messageId: info.messageId,
      preview: nodemailer.getTestMessageUrl(info)
    });
    
  } catch (error) {
    console.error('Error sending approval email:', error);
    
    // Detailed error handling
    let errorMessage = 'Failed to send approval email';
    
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

module.exports = router;
