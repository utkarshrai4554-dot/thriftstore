const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create Gmail transporter using App Password
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail App Password (not regular password)
    },
  });
};

// Send OTP email endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email, otp, subject, template } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    console.log('🔄 Sending OTP email to:', email);

    // Create transporter
    const transporter = createGmailTransporter();

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Gmail transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Gmail transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      });
    }

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
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #ea580c;
                margin-bottom: 10px;
              }
              .otp-box {
                background-color: #f8f9fa;
                border: 2px dashed #ea580c;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
                border-radius: 8px;
              }
              .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #ea580c;
                letter-spacing: 5px;
                margin: 10px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
              }
              .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 10px;
                border-radius: 5px;
                margin: 20px 0;
              }
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
        text: `
          StyleEase - Email Verification
          
          Hello,
          
          Thank you for registering with StyleEase! Your verification code is: ${otp}
          
          This code will expire in 10 minutes. Never share this code with anyone.
          
          If you didn't request this verification code, you can safely ignore this email.
          
          Best regards,
          The StyleEase Team
        `
      };
    } else {
      // Default email content
      emailContent = {
        subject: subject || 'StyleEase Verification',
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
    
    // Provide more specific error messages
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

// Test email endpoint (for development)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const transporter = createGmailTransporter();
    await transporter.verify();

    const testOtp = '1234';
    
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
    
    console.log('✅ Test email sent successfully:', info.messageId);

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

// Send delivery agent approval email endpoint
router.post('/send-approval-email', async (req, res) => {
  try {
    const { email, displayName, password, subject, template } = req.body;

    if (!email || !displayName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, display name, and password are required'
      });
    }

    console.log('🚚 Sending delivery agent approval email to:', email);

    // Create transporter
    const transporter = createGmailTransporter();

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Gmail transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Gmail transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      });
    }

    // Email content for delivery agent approval
    let emailContent;
    if (template === 'delivery_agent_approval') {
      emailContent = {
        subject: subject || 'StyleEase - Delivery Agent Application Approved!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>StyleEase - Delivery Agent Application Approved</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e9ecef;
              }
              .welcome {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #2c3e50;
              }
              .info-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #28a745;
                margin: 20px 0;
              }
              .credentials {
                background: #fff3cd;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                border: 1px dashed #ffc107;
              }
              .login-btn {
                display: inline-block;
                background: #28a745;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #6c757d;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚚 StyleEase Delivery</h1>
              <p>Your Application Has Been Approved!</p>
            </div>
            
            <div class="content">
              <h2 class="welcome">Congratulations, ${displayName}!</h2>
              
              <p>We're pleased to inform you that your delivery agent application has been <strong>approved</strong> by our admin team.</p>
              
              <div class="info-box">
                <h3>🎉 Welcome to the StyleEase Delivery Team!</h3>
                <p>You can now start accepting deliveries and earning with our platform. Your account has been set up with the credentials you provided during registration.</p>
              </div>
              
              <div class="credentials">
                <h3>🔐 Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><em>Please keep these credentials secure and do not share them with anyone.</em></p>
              </div>
              
              <p style="text-align: center;">
                <a href="https://styleease-thrift.vercel.app/auth" class="login-btn">
                  Login to Your Delivery Dashboard
                </a>
              </p>
            </div>
            
            <div class="footer">
              <p>If you have any questions or need assistance, please contact our support team.</p>
              <p>Thank you for joining StyleEase Delivery!</p>
              <p>© 2024 StyleEase. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        text: `StyleEase - Delivery Agent Application Approved

Congratulations, ${displayName}!

We're pleased to inform you that your delivery agent application has been approved by our admin team.

Welcome to the StyleEase Delivery Team!

You can now start accepting deliveries and earning with our platform. Your account has been set up with the credentials you provided during registration.

Your Login Credentials:
Email: ${email}
Password: ${password}

Please keep these credentials secure and do not share them with anyone.

Login to your delivery dashboard: https://styleease-thrift.vercel.app/auth

If you have any questions or need assistance, please contact our support team.

Thank you for joining StyleEase Delivery!
© 2024 StyleEase. All rights reserved.`
      };
    }

    const mailOptions = {
      from: `"StyleEase" <${process.env.GMAIL_USER}>`,
      to: email,
      ...emailContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Delivery agent approval email sent successfully:', info.messageId);

    res.json({
      success: true,
      message: 'Approval email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Failed to send delivery agent approval email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send approval email';
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

module.exports = router;
