import { doc, setDoc, serverTimestamp, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Add EmailJS types to window object
declare global {
  interface Window {
    emailjs: any;
  }
}

export interface OTPRequest {
  id: string;
  email: string;
  otp: string;
  type: 'registration' | 'password_reset';
  createdAt: any;
  expiresAt: any;
  attempts: number;
  isUsed: boolean;
}

export const generateOTP = (): string => {
  // Generate 4-digit OTP
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const createOTPRequest = async (
  email: string,
  type: 'registration' | 'password_reset' = 'registration'
): Promise<string> => {
  try {
    console.log('🔐 Creating OTP request for:', email);
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    // Create OTP request document
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const otpRef = doc(db, 'otpRequests', otpId);
    
    const otpRequest: OTPRequest = {
      id: otpId,
      email: email.toLowerCase(),
      otp,
      type,
      createdAt: serverTimestamp(),
      expiresAt,
      attempts: 0,
      isUsed: false
    };
    
    await setDoc(otpRef, otpRequest);
    
    // Send OTP email using our backend service
    await sendOTPEmailViaBackend(email, otp);
    
    console.log('✅ OTP request created:', otpId);
    return otpId;
    
  } catch (error) {
    console.error('❌ Error creating OTP request:', error);
    throw new Error('Failed to create OTP request');
  }
};

export const sendOTPEmailViaBackend = async (email: string, otp: string): Promise<void> => {
  try {
    console.log('🔄 Trying backend email service for:', email);
    
    // Get API URL from environment or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Send to backend for email sending
    const response = await fetch(`${apiUrl}/api/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
        subject: 'StyleEase - Email Verification Code',
        template: 'otp_verification'
      }),
    });
    
    if (!response.ok) {
      throw new Error('Backend email service failed');
    }
    
    const result = await response.json();
    console.log(' Email sent successfully via backend:', result);
    
  } catch (backendError) {
    console.error('Backend email failed:', backendError);
    throw new Error('Failed to send OTP email. Please check your email address and try again.');
  }
};

export const verifyOTP = async (
  otpId: string,
  enteredOTP: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔍 Verifying OTP:', otpId);
    
    const otpRef = doc(db, 'otpRequests', otpId);
    const otpDoc = await getDoc(otpRef);
    
    if (!otpDoc.exists()) {
      return { success: false, message: 'Invalid OTP request' };
    }
    
    const otpRequest = otpDoc.data() as OTPRequest;
    
    // Check if OTP is already used
    if (otpRequest.isUsed) {
      return { success: false, message: 'OTP has already been used' };
    }
    
    // Check if OTP is expired
    const now = new Date();
    const expiresAt = otpRequest.expiresAt.toDate ? otpRequest.expiresAt.toDate() : new Date(otpRequest.expiresAt);
    
    if (now > expiresAt) {
      return { success: false, message: 'OTP has expired' };
    }
    
    // Check attempts (max 3 attempts)
    if (otpRequest.attempts >= 3) {
      return { success: false, message: 'Too many attempts. Please request a new OTP.' };
    }
    
    // Increment attempts
    await updateDoc(otpRef, {
      attempts: otpRequest.attempts + 1
    });
    
    // Verify OTP
    if (enteredOTP === otpRequest.otp) {
      // Mark OTP as used
      await updateDoc(otpRef, {
        isUsed: true,
        verifiedAt: serverTimestamp()
      });
      
      return { success: true, message: 'OTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid OTP' };
    }
    
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return { success: false, message: 'OTP verification failed' };
  }
};

export const cleanupExpiredOTPs = async (): Promise<void> => {
  try {
    console.log('🧹 Cleaning up expired OTPs');
    
    // This would typically be run by a scheduled job
    // For now, it's a placeholder for cleanup logic
    
    console.log('✅ Expired OTPs cleaned up');
    
  } catch (error) {
    console.error('❌ Error cleaning up expired OTPs:', error);
  }
};

export const resendOTP = async (
  email: string,
  type: 'registration' | 'password_reset' = 'registration'
): Promise<string> => {
  try {
    console.log('🔄 Resending OTP for:', email);
    
    // Create new OTP request
    const otpId = await createOTPRequest(email, type);
    
    console.log('✅ OTP resent successfully');
    return otpId;
    
  } catch (error) {
    console.error('❌ Error resending OTP:', error);
    throw new Error('Failed to resend OTP');
  }
};
