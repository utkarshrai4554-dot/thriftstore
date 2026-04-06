// EmailJS OTP Service - Alternative to Gmail SMTP
// This doesn't require app passwords

export interface EmailJSConfig {
  serviceID: string;
  templateID: string;
  publicKey: string;
}

// EmailJS Configuration (you'll get these from EmailJS)
const emailjsConfig: EmailJSConfig = {
  serviceID: 'service_demo123',  // Replace with your EmailJS service ID
  templateID: 'template_demo123', // Replace with your EmailJS template ID  
  publicKey: 'demo_public_key'   // Replace with your EmailJS public key
};

export const sendOTPViaEmailJS = async (email: string, otp: string): Promise<void> => {
  try {
    console.log('📧 Sending OTP via EmailJS to:', email);
    
    // Load EmailJS if not already loaded
    if (typeof window !== 'undefined' && !window.emailjs) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.async = true;
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
    
    if (typeof window !== 'undefined' && window.emailjs) {
      window.emailjs.init(emailjsConfig.publicKey);
      
      const templateParams = {
        to_email: email,
        otp_code: otp,
        expiry_minutes: 10,
        app_name: 'StyleEase',
        support_email: 'support@styleease.com'
      };
      
      const result = await window.emailjs.send(
        emailjsConfig.serviceID,
        emailjsConfig.templateID,
        templateParams
      );
      
      console.log('✅ Email sent successfully via EmailJS:', result);
      
    } else {
      throw new Error('EmailJS not loaded');
    }
    
  } catch (error) {
    console.error('❌ EmailJS failed:', error);
    
    // Fallback: Show OTP in console
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
    
    // Show alert for development
    alert(`🔔 OTP CODE: ${otp}\n\nEmail: ${email}\n\nEmailJS not configured - using console fallback.`);
  }
};

// Quick setup guide for EmailJS
export const emailjsSetupGuide = `
📧 EmailJS Setup Guide:

1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Create an email service:
   - Go to Email Services → Add New Service
   - Choose Gmail (or any email provider)
   - Connect your email account
4. Create an email template:
   - Go to Email Templates → Create New Template
   - Use this template:
     Subject: StyleEase - Email Verification
     Content: Hello {{to_email}}, your verification code is: {{otp_code}}
5. Update the config in this file with your IDs:
   - serviceID: From Email Services
   - templateID: From Email Templates  
   - publicKey: From Account → General

EmailJS is free for up to 200 emails/month!
`;
