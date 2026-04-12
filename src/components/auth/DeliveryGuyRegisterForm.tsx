import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Truck, User, Phone, MapPin, CheckCircle } from 'lucide-react';
import { registerDeliveryGuy, AuthError } from '../../services/authService';
import { createOTPRequest } from '../../services/otpService';
import OTPVerification from './OTPVerification';
import { useToast } from '../../hooks/use-toast';

const deliveryGuyRegisterSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => {
      // Check for common email domain typos
      const commonTypos = {
        'gmaill.com': 'gmail.com',
        'gamil.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmaol.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'outlookt.com': 'outlook.com',
        'hotmaill.com': 'hotmail.com'
      };
      
      const domain = email.split('@')[1]?.toLowerCase();
      if (commonTypos[domain]) {
        return false;
      }
      
      return true;
    }, 'Please check your email domain. Did you mean gmail.com?'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  vehicleType: z.enum(['bike', 'scooter', 'car', 'van', 'truck'], {
    required_error: 'Please select a vehicle type'
  }),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  drivingLicense: z.string().min(5, 'Driving license number is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  experience: z.string().optional(),
  availability: z.enum(['full-time', 'part-time', 'weekend'], {
    required_error: 'Please select availability'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type DeliveryGuyRegisterFormData = z.infer<typeof deliveryGuyRegisterSchema>;

interface DeliveryGuyRegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export const DeliveryGuyRegisterForm = ({ onSuccess, onLoginClick }: DeliveryGuyRegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpId, setOtpId] = useState<string>('');
  const [formData, setFormData] = useState<DeliveryGuyRegisterFormData | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<DeliveryGuyRegisterFormData>({
    resolver: zodResolver(deliveryGuyRegisterSchema)
  });

  const onSubmit = async (data: DeliveryGuyRegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚚 Starting delivery guy registration with OTP verification:', { 
        email: data.email, 
        displayName: data.displayName,
        phone: data.phone,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        availability: data.availability
      });

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
      console.error('❌ Delivery guy registration error:', authError);
      
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
      console.log('🔍 OTP verified, completing delivery guy registration...');
      
      // Step 3: Complete registration after OTP verification
      const requestId = await registerDeliveryGuy(
        formData.email,
        formData.password,
        formData.displayName,
        formData.phone,
        formData.vehicleType,
        formData.vehicleNumber,
        formData.drivingLicense,
        formData.address,
        formData.experience,
        formData.availability
      );

      toast({
        title: "Registration Request Submitted!",
        description: "Your delivery agent registration has been submitted for admin approval. You'll be notified once approved.",
      });

      console.log('✅ Delivery guy registration request successful');
      onSuccess?.();

    } catch (err) {
      const authError = err as AuthError;
      console.error('❌ Delivery guy registration completion error:', authError);
      
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
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-2xl">Delivery Guy Registration</CardTitle>
        </div>
        <CardDescription>
          Join our delivery team and start earning!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            
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
                <p className="text-sm text-red-600">{errors.displayName.message}</p>
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
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                {...register('phone')}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your full address"
                rows={3}
                {...register('address')}
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Vehicle Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                onValueChange={(value) => setValue('vehicleType', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
              {errors.vehicleType && (
                <p className="text-sm text-red-600">{errors.vehicleType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                type="text"
                placeholder="e.g., MH-12-AB-1234"
                {...register('vehicleNumber')}
                disabled={isLoading}
              />
              {errors.vehicleNumber && (
                <p className="text-sm text-red-600">{errors.vehicleNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="drivingLicense">Driving License Number</Label>
              <Input
                id="drivingLicense"
                type="text"
                placeholder="Enter your driving license number"
                {...register('drivingLicense')}
                disabled={isLoading}
              />
              {errors.drivingLicense && (
                <p className="text-sm text-red-600">{errors.drivingLicense.message}</p>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Work Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (Optional)</Label>
              <Textarea
                id="experience"
                placeholder="Tell us about your delivery experience"
                rows={2}
                {...register('experience')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select
                onValueChange={(value) => setValue('availability', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="weekend">Weekend Only</SelectItem>
                </SelectContent>
              </Select>
              {errors.availability && (
                <p className="text-sm text-red-600">{errors.availability.message}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
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
                <p className="text-sm text-red-600">{errors.password.message}</p>
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
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Truck className="mr-2 h-4 w-4" />
                Register as Delivery Guy
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onLoginClick}
              disabled={isLoading}
              className="text-sm"
            >
              Already have an account? Login here
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
