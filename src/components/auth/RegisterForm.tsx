import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { registerUser, AuthError } from '../../services/authService';
import { createOTPRequest } from '../../services/otpService';
import OTPVerification from './OTPVerification';
import { useToast } from '../../hooks/use-toast';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export const RegisterForm = ({ onSuccess, onLoginClick }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpId, setOtpId] = useState<string>('');
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting registration with OTP verification:', { email: data.email, displayName: data.displayName });
      
      // Step 1: Create OTP request
      const otpRequestId = await createOTPRequest(data.email);
      console.log('✅ OTP request created:', otpRequestId);
      
      // Step 2: Show OTP verification screen
      setFormData(data);
      setOtpId(otpRequestId);
      setShowOTP(true);
      
      toast({
        title: "Verification Code Sent",
        description: "A 4-digit code has been sent to your email address.",
      });
      
    } catch (err) {
      const authError = err as AuthError;
      console.error('❌ Registration error:', authError);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    if (!formData) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 OTP verified, completing registration...');
      
      // Step 3: Complete registration after OTP verification
      await registerUser(
        formData.email,
        formData.password,
        formData.displayName,
        formData.phone,
        formData.address,
        formData.birthdate
      );

      toast({
        title: "Registration Successful!",
        description: "Your account has been created successfully.",
      });

      console.log('✅ Registration completed successfully');
      onSuccess?.();

    } catch (err) {
      const authError = err as AuthError;
      console.error('❌ Registration completion error:', authError);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPCancel = () => {
    setShowOTP(false);
    setOtpId('');
    setFormData(null);
    setError(null);
  };

  const handleOTPBack = () => {
    // Go back to registration form to resend OTP
    setShowOTP(false);
    setOtpId('');
    // Keep formData to allow resending
  };

  // Show OTP verification screen
  if (showOTP && formData && otpId) {
    return (
      <OTPVerification
        email={formData.email}
        otpId={otpId}
        onVerified={handleOTPVerified}
        onCancel={handleOTPCancel}
        onBack={handleOTPBack}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Fill in your details to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Enter your full name"
              {...register('displayName')}
              disabled={isLoading}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              {...register('phone')}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              type="text"
              placeholder="Enter your address"
              {...register('address')}
              disabled={isLoading}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthdate">Birth Date (Optional)</Label>
            <Input
              id="birthdate"
              type="date"
              placeholder="Enter your birth date"
              {...register('birthdate')}
              disabled={isLoading}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birthdate && (
              <p className="text-sm text-destructive">{errors.birthdate.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        {onLoginClick && (
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={onLoginClick}
            >
              Login here
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
