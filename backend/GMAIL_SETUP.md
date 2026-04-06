# Gmail SMTP Setup for OTP Emails

This guide will help you configure Gmail SMTP to send OTP emails for user registration.

## 🚀 Quick Setup

### 1. Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification"
4. Follow the setup process

### 2. Generate App Password
1. Go to Google Account Security: https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Scroll down and click on "App passwords"
4. Select "Mail" for the app
5. Select "Other (Custom name)" and enter "StyleEase OTP"
6. Click "Generate"
7. **Copy the 16-character password** (this is your GMAIL_APP_PASSWORD)

### 3. Update Environment Variables
Create or update your `.env` file in the backend directory:

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### 4. Install Required Packages
In your backend directory, run:

```bash
npm install nodemailer
```

### 5. Start the Backend Server
```bash
cd backend
npm start
```

## 📧 Email Template Features

The OTP email includes:
- ✅ Professional HTML design
- ✅ 4-digit OTP code display
- ✅ 10-minute expiry notice
- ✅ Security warnings
- ✅ Branding with StyleEase logo
- ✅ Responsive design for mobile

## 🔧 Alternative Setup Options

### Option 1: EmailJS (Client-side)
1. Sign up at https://www.emailjs.com/
2. Create an email service
3. Create an email template
4. Update the EmailJS configuration in `otpService.ts`:

```javascript
const emailjsServiceId = 'your_service_id';
const emailjsTemplateId = 'your_template_id';
const emailjsPublicKey = 'your_public_key';
```

### Option 2: SendGrid (Production)
1. Sign up at https://sendgrid.com/
2. Create an API key
3. Verify your sender domain
4. Update the email service to use SendGrid API

### Option 3: AWS SES (Production)
1. Set up AWS SES
2. Verify your domain or email address
3. Create SMTP credentials
4. Update the Gmail configuration with AWS SES credentials

## 🧪 Testing the Setup

### Test Email Service
```bash
curl -X POST http://localhost:3001/api/email-status
```

### Test OTP Sending
```bash
curl -X POST http://localhost:3001/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "1234",
    "subject": "Test OTP"
  }'
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Gmail authentication failed"**
   - Ensure 2-factor authentication is enabled
   - Use the 16-character app password (not your regular password)
   - Check that the app password is correctly copied

2. **"Failed to connect to Gmail SMTP"**
   - Check your internet connection
   - Ensure firewall allows SMTP connections (port 587)
   - Verify Gmail credentials are correct

3. **"Email not received"**
   - Check spam/junk folder
   - Verify recipient email address is correct
   - Check Gmail sending limits (100/day for free accounts)

4. **"Invalid email address"**
   - Ensure email format is correct
   - Check for typos in the email address
   - Verify the email exists

### Gmail Sending Limits:
- **Free Gmail Account**: 100 emails/day
- **Google Workspace**: Higher limits based on plan
- **Rate Limiting**: Wait between bulk sends

## 🚀 Production Deployment

For production use, consider:

1. **Use a dedicated email service** (SendGrid, AWS SES, Mailgun)
2. **Set up domain verification** for better deliverability
3. **Monitor email metrics** (open rates, bounce rates)
4. **Implement email queueing** for bulk sends
5. **Add unsubscribe links** for compliance

## 📱 Mobile Email Support

The email template is fully responsive and works on:
- ✅ Gmail mobile app
- ✅ iOS Mail app
- ✅ Android email apps
- ✅ Desktop email clients

## 🔒 Security Notes

- ✅ App passwords are more secure than regular passwords
- ✅ OTP codes expire after 10 minutes
- ✅ Maximum 3 verification attempts
- ✅ Email addresses are validated before sending
- ✅ No sensitive information is logged

## 📊 Monitoring

Check the backend console for:
- ✅ Email sending logs
- ✅ Error messages
- ✅ Success confirmations
- ✅ Gmail SMTP connection status

Your Gmail OTP email service is now ready to use! 🎉
