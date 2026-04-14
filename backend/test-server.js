const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import email routes
const emailRoutes = require('./routes/email');

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
    service: 'styleease-email-test',
    version: '1.0.0'
  });
});

// Email routes
console.log('📧 Using real Gmail service for OTP email');
app.use('/api', emailRoutes);

// Login endpoint for delivery agents
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Delivery agent login attempt:', { email });
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // For now, just return success (in real app, this would validate against Firebase)
    console.log('✅ Mock login successful for:', email);
    
    res.json({
      success: true,
      message: 'Login successful (mock)',
      user: {
        uid: 'mock-uid-' + Date.now(),
        email: email,
        role: 'delivery'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in login endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Approval email endpoint
app.post('/api/send-approval-email', async (req, res) => {
  try {
    const { email, displayName, password, subject, template } = req.body;
    console.log('🔄 Sending approval email to:', email);
    
    if (!email || !displayName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, displayName, and password are required'
      });
    }
    
    // Gmail transporter
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    // Verify transporter
    await transporter.verify();
    console.log('✅ Gmail transporter verified for approval email');
    
    // Email content for delivery agent approval
    const mailOptions = {
      from: `"StyleEase" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject || 'StyleEase - Delivery Agent Application Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delivery Agent Approval</title>
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
            .approval-box {
              background-color: #e8f5e8;
              border: 2px solid #22c55e;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
              border-radius: 8px;
            }
            .password {
              font-family: monospace;
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #ddd;
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚚 StyleEase</div>
              <h2>Delivery Agent Application Approved!</h2>
            </div>
            
            <p>Congratulations <strong>${displayName}</strong>!</p>
            <p>Your delivery agent application has been approved by our admin team.</p>
            <p>You can now login to the delivery dashboard and start accepting orders.</p>
            
            <div class="approval-box">
              <p><strong>Login Credentials:</strong></p>
              <p>Email: ${email}</p>
              <p>Temporary Password: <span class="password">${password}</span></p>
            </div>
            
            <div class="footer">
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Go to the delivery login page</li>
                <li>Use your email: ${email}</li>
                <li>Use the temporary password provided above</li>
                <li>Change your password after first login</li>
              </ol>
              <p>Best regards,<br>The StyleEase Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `StyleEase - Delivery Agent Approval\n\nCongratulations ${displayName}!\n\nYour delivery agent application has been approved.\n\nLogin Credentials:\nEmail: ${email}\nTemporary Password: ${password}\n\nNext Steps:\n1. Go to delivery login page\n2. Use your email and temporary password\n3. Change password after first login\n\nBest regards,\nThe StyleEase Team`
    };
    
    // Send approval email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Approval email sent successfully:', {
      messageId: info.messageId,
      to: email,
      subject: mailOptions.subject
    });
    
    res.json({
      success: true,
      message: 'Approval email sent successfully',
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    
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

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Email Test Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Email API: http://localhost:${PORT}/api/email-status`);
  console.log(`📧 Approval API: http://localhost:${PORT}/api/send-approval-email`);
});

module.exports = app;
