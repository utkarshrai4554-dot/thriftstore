import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, RefreshCw, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { verifyOTP, resendOTP } from '@/services/otpService';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationProps {
  email: string;
  otpId: string;
  onVerified: () => void;
  onCancel: () => void;
  onBack?: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  otpId,
  onVerified,
  onCancel,
  onBack
}) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 4) {
      setError('Please enter a 4-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyOTP(otpId, otp);
      
      if (result.success) {
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });
        onVerified();
      } else {
        setError(result.message);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Verification failed. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to verify OTP. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    try {
      const newOtpId = await resendOTP(email);
      
      // Update parent with new OTP ID
      if (onBack) {
        onBack(); // Go back to registration form with new OTP ID
      }
      
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
      
      // Reset timer
      setTimeLeft(600);
      setCanResend(false);
      setOtp('');
      
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Failed to resend OTP. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to resend OTP. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    // Only allow numbers and max 1 character per input
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    
    // Update the OTP string at the specific index
    const newOtp = otp.split('');
    newOtp[index] = numericValue;
    setOtp(newOtp.join(''));
    setError(null);
    
    // Auto-focus next input if a digit was entered
    if (numericValue && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Auto-focus previous input if backspace was pressed
    if (!numericValue && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
    
    if (e.key === 'ArrowRight' && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    setOtp(pastedData);
    setError(null);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = pastedData.length < 4 ? pastedData.length : 3;
    const nextInput = document.getElementById(`otp-${nextEmptyIndex}`) as HTMLInputElement;
    if (nextInput) {
      nextInput.focus();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <p className="text-muted-foreground">
          We've sent a 4-digit verification code to
        </p>
        <p className="text-sm font-medium text-primary">{email}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Enter Verification Code</Label>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={otp[index] || ''}
                onChange={(e) => handleOTPChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-semibold"
                disabled={isVerifying || isResending}
                inputMode="numeric"
                pattern="[0-9]"
                autoComplete="one-time-code"
              />
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={otp.length !== 4 || isVerifying || isResending}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Email
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Code expires in {formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="link"
              onClick={onCancel}
              disabled={isVerifying || isResending}
              className="text-sm"
            >
              Cancel
            </Button>

            <Button
              variant="link"
              onClick={handleResend}
              disabled={!canResend || isVerifying || isResending}
              className="text-sm"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Mail className="h-3 w-3 mr-1" />
            Check your spam folder if you don't see the email
          </Badge>
          
          {/* Development OTP Display */}
          {window.location.hostname === 'localhost' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <Eye className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-1">
                  <p className="font-medium">🔔 Development Mode:</p>
                  <p>Check the browser console for the OTP code</p>
                  <p>You should also see an alert popup with the code</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OTPVerification;
