import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, User, Truck, Building } from 'lucide-react';
import { registerUser, AuthError } from '../../services/authService';
import { createDeliveryAgentRequest } from '../../services/deliveryAgentService';
import { createOTPRequest } from '../../services/otpService';
import { useToast } from '../../hooks/use-toast';
import { useTheme } from '../../contexts/ThemeContext';
import OTPVerification from './OTPVerification';

const registerSchema = z.object({
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
  phone: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  // Delivery-specific fields
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  drivingLicense: z.string().optional(),
  experience: z.string().optional(),
  availability: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

type UserRole = 'customer' | 'delivery' | 'ngo';

export const RegisterForm = ({ onSuccess, onLoginClick }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpId, setOtpId] = useState<string>('');
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const { toast } = useToast();
  const theme = useTheme();

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
      if (selectedRole === 'delivery') {
        // For delivery agents, create a delivery agent request instead of direct registration
        if (!formData.vehicleType || !formData.vehicleNumber || !formData.drivingLicense || !formData.experience || !formData.availability) {
          throw new Error('All delivery agent fields are required: vehicle type, vehicle number, driving license, experience, and availability');
        }
        
        await createDeliveryAgentRequest(formData.email, formData.password, {
          displayName: formData.displayName,
          phone: formData.phone,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          drivingLicense: formData.drivingLicense,
          address: formData.address,
          experience: formData.experience,
          availability: formData.availability
        });

        toast({
          title: "Delivery Agent Request Submitted!",
          description: "Your delivery agent request has been submitted. You will be notified once approved.",
        });
      } else {
        // For customers and NGOs, use regular registration
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
      }

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
        <CardTitle className="text-black">
          {selectedRole === 'ngo' ? 'NGO Registration' : 'Create Account'}
        </CardTitle>
        <CardDescription className={theme.getThemeColors().foreground}>
          {selectedRole === 'ngo' 
            ? 'Register your NGO to receive donations from our platform'
            : 'Fill in your details to create a new account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role Selection */}
        <div className="space-y-3 mb-6">
          <Label className="text-sm font-medium text-black">Select your role:</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={selectedRole === 'customer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole('customer')}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Customer</span>
            </Button>
            <Button
              type="button"
              variant={selectedRole === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole('delivery')}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Truck className="h-4 w-4" />
              <span className="text-xs">Delivery</span>
            </Button>
            <Button
              type="button"
              variant={selectedRole === 'ngo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole('ngo')}
              className={`flex flex-col gap-1 h-auto py-3 ${
                selectedRole === 'ngo' ? (theme.theme === 'light' ? 'text-black' : 'text-yellow-100') : ''
              }`}
            >
              <Building className="h-4 w-4" />
              <span className="text-xs">NGO</span>
            </Button>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className={theme.getThemeColors().foreground}>Full Name</Label>
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
            <Label htmlFor="email" className={theme.getThemeColors().foreground}>Email</Label>
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
            <Label htmlFor="password" className={theme.getThemeColors().foreground}>Password</Label>
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
            <Label htmlFor="confirmPassword" className={theme.getThemeColors().foreground}>Confirm Password</Label>
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
            <Label htmlFor="phone" className={theme.getThemeColors().foreground}>Phone Number (Optional)</Label>
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
            <Label htmlFor="address" className={theme.getThemeColors().foreground}>Address (Optional)</Label>
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
            <Label htmlFor="birthdate" className={theme.getThemeColors().foreground}>Birth Date (Optional)</Label>
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

          {/* Delivery-specific fields */}
          {selectedRole === 'delivery' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="vehicleType" className={theme.getThemeColors().foreground}>Vehicle Type *</Label>
                <select
                  id="vehicleType"
                  {...register('vehicleType')}
                  disabled={isLoading}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your vehicle type</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                </select>
                {errors.vehicleType && (
                  <p className="text-sm text-destructive">{errors.vehicleType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className={theme.getThemeColors().foreground}>Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  type="text"
                  placeholder="Enter your vehicle number"
                  {...register('vehicleNumber')}
                  disabled={isLoading}
                />
                {errors.vehicleNumber && (
                  <p className="text-sm text-destructive">{errors.vehicleNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="drivingLicense" className={theme.getThemeColors().foreground}>Driving License Number *</Label>
                <Input
                  id="drivingLicense"
                  type="text"
                  placeholder="Enter your driving license number"
                  {...register('drivingLicense')}
                  disabled={isLoading}
                />
                {errors.drivingLicense && (
                  <p className="text-sm text-destructive">{errors.drivingLicense.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className={theme.getThemeColors().foreground}>Delivery Experience *</Label>
                <select
                  id="experience"
                  {...register('experience')}
                  disabled={isLoading}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your experience</option>
                  <option value="Less than 6 months">Less than 6 months</option>
                  <option value="6 months - 1 year">6 months - 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-5 years">2-5 years</option>
                  <option value="More than 5 years">More than 5 years</option>
                </select>
                {errors.experience && (
                  <p className="text-sm text-destructive">{errors.experience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability" className={theme.getThemeColors().foreground}>Availability *</Label>
                <select
                  id="availability"
                  {...register('availability')}
                  disabled={isLoading}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your availability</option>
                  <option value="Full-time (8+ hours/day)">Full-time (8+ hours/day)</option>
                  <option value="Part-time (4-8 hours/day)">Part-time (4-8 hours/day)</option>
                  <option value="Flexible (as needed)">Flexible (as needed)</option>
                  <option value="Weekends only">Weekends only</option>
                  <option value="Evenings only">Evenings only</option>
                </select>
                {errors.availability && (
                  <p className="text-sm text-destructive">{errors.availability.message}</p>
                )}
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedRole === 'delivery' && <Truck className="mr-2 h-4 w-4" />}
            {selectedRole === 'ngo' && <Building className="mr-2 h-4 w-4" />}
            {selectedRole === 'customer' && <User className="mr-2 h-4 w-4" />}
            <span className={`flex flex-col gap-1 h-auto py-3 ${
                selectedRole === 'delivery' ? 'text-black' : 'text-gray-600'
              }`}>Create Account</span>
          </Button>

          {onLoginClick && (
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-gray-900"
                onClick={onLoginClick}
              >
                Login here
              </Button>
            </div>
          )}
        </form>
        )
      </CardContent>
    </Card>
  );
};
