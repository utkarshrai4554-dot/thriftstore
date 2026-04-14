import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { loginUser, AuthError } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const deliveryLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type DeliveryLoginFormData = z.infer<typeof deliveryLoginSchema>;

interface DeliveryLoginProps {
  onSuccess?: () => void;
  onBackClick?: () => void;
}

export const DeliveryLogin = ({ onSuccess, onBackClick }: DeliveryLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryLoginFormData>({
    resolver: zodResolver(deliveryLoginSchema),
  });

  const onSubmit = async (data: DeliveryLoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚚 Starting delivery agent login:', { email: data.email });
      
      const user = await loginUser(data.email, data.password);
      console.log('✅ Delivery agent login successful:', user.email);
      
      toast({
        title: "Login Successful",
        description: "Welcome to your delivery dashboard!",
      });

      onSuccess?.();

    } catch (err) {
      const authError = err as AuthError;
      console.error('❌ Delivery agent login error:', authError);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (authError.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (authError.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (authError.code === 'auth/delivery-agent-not-approved') {
        errorMessage = 'Your delivery agent application is still pending approval.';
      } else if (authError.code === 'auth/delivery-agent-not-found') {
        errorMessage = 'Your delivery agent account is not properly set up. Please contact support.';
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-orange-600" />
              <CardTitle className="text-2xl">Delivery Login</CardTitle>
            </div>
            <CardDescription>
              Access your delivery dashboard and manage orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
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
                    Signing In...
                  </>
                ) : (
                  <>
                    <Truck className="mr-2 h-4 w-4" />
                    Sign In as Delivery Agent
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackClick}
                  disabled={isLoading}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to User Login
                </Button>
                
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => window.location.href = '/delivery-agent-register'}
                    className="p-0 h-auto font-normal text-orange-600 hover:text-orange-700"
                  >
                    Register as Delivery Agent
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
