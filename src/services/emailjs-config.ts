// EmailJS Configuration
// This is an alternative to Gmail SMTP setup

export const emailjsConfig = {
  // Get these from https://www.emailjs.com/
  serviceID: 'your_service_id',      // Replace with your EmailJS service ID
  templateID: 'your_template_id',    // Replace with your EmailJS template ID
  publicKey: 'your_public_key'       // Replace with your EmailJS public key
};

// EmailJS Template Example:
// Subject: StyleEase - Email Verification
// Content:
// Hello {{to_email}},
//
// Your verification code is: {{otp_code}}
//
// This code will expire in {{expiry_minutes}} minutes.
//
// Thanks,
// {{app_name}} Team

export const sendOTPEmailViaEmailJS = async (email: string, otp: string): Promise<void> => {
  try {
    console.log('📧 Sending OTP via EmailJS to:', email);
    
    // Load EmailJS dynamically
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
      
      await window.emailjs.send(
        emailjsConfig.serviceID,
        emailjsConfig.templateID,
        templateParams
      );
      
      console.log('✅ Email sent successfully via EmailJS');
    } else {
      throw new Error('EmailJS not loaded');
    }
    
  } catch (error) {
    console.error('❌ EmailJS failed:', error);
    
    // Show OTP in console as fallback
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
    
    throw new Error('EmailJS failed - OTP displayed in console');
  }
};
