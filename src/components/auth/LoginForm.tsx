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
import { loginUser, AuthError } from '../../services/authService';
import { useToast } from '../../hooks/use-toast';
import { auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../contexts/ThemeContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

type UserRole = 'customer' | 'delivery' | 'ngo';

export const LoginForm = ({ onSuccess, onRegisterClick }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const { toast } = useToast();
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedRole === 'customer') {
        // Normal customer login
        await loginUser(data.email, data.password);
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
        });
      } else if (selectedRole === 'delivery') {
        // Delivery agent login
        try {
          const user = await loginUser(data.email, data.password);
          console.log('🚚 Firebase login successful for delivery agent:', user.email);
          
          // Additional check for delivery agent approval
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('🚚 User document found:', userData);
            
            if (userData.role !== 'delivery') {
              console.log('🚚 User role is not delivery:', userData.role);
              await auth.signOut();
              throw {
                code: 'auth/not-delivery-agent',
                message: 'This account is not registered as a delivery agent.'
              } as AuthError;
            }
            
            // Check delivery agent approval status
            const deliveryAgentDoc = await getDoc(doc(db, 'deliveryAgents', user.uid));
            if (!deliveryAgentDoc.exists()) {
              console.log('🚚 Delivery agent document not found');
              await auth.signOut();
              throw {
                code: 'auth/delivery-agent-not-found',
                message: 'Your delivery agent account is not properly set up. Please contact support.'
              } as AuthError;
            }
            
            const agentData = deliveryAgentDoc.data();
            console.log('🚚 Delivery agent data:', agentData);
            
            if (agentData.status !== 'approved') {
              console.log('🚚 Delivery agent not approved:', agentData.status);
              await auth.signOut();
              throw {
                code: 'auth/delivery-agent-not-approved',
                message: 'Your delivery agent application is still pending approval. Please wait for admin approval.'
              } as AuthError;
            }
          } else {
            console.log('🚚 User document not found in Firestore');
            await auth.signOut();
            throw {
              code: 'auth/user-not-found',
              message: 'User account not found in system. Please register first.'
            } as AuthError;
          }
          
          toast({
            title: 'Login successful',
            description: 'Welcome to your delivery dashboard!',
          });
          
          // Redirect to delivery dashboard
          setTimeout(() => {
            window.location.href = '/delivery-dashboard';
          }, 1000);
        } catch (loginError) {
          console.error('🚚 Delivery agent login error:', loginError);
          throw loginError;
        }
        
      } else if (selectedRole === 'ngo') {
        // NGO login
        const user = await loginUser(data.email, data.password);
        
        // Check if user is an approved NGO
        const ngoDoc = await getDoc(doc(db, 'approvedNGOs', user.uid));
        const registrationDoc = await getDoc(doc(db, 'ngoRegistrations', user.uid));
        
        let ngoData = null;
        let isApproved = false;

        if (ngoDoc.exists()) {
          ngoData = ngoDoc.data();
          isApproved = ngoData.status === 'approved';
        } else if (registrationDoc.exists()) {
          ngoData = registrationDoc.data();
          isApproved = ngoData.status === 'approved';
        }

        if (!ngoData) {
          await auth.signOut();
          throw {
            code: 'auth/ngo-not-found',
            message: 'No NGO registration found for this account.'
          } as AuthError;
        }

        if (!isApproved) {
          await auth.signOut();
          throw {
            code: 'auth/ngo-not-approved',
            message: 'Your NGO registration is not yet approved. Please wait for admin approval.'
          } as AuthError;
        }

        toast({
          title: 'Login successful',
          description: `Welcome back, ${ngoData.name}!`,
        });
        
        // Store NGO session
        localStorage.setItem('ngoUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          ...ngoData
        }));
        
        // Redirect to NGO dashboard
        setTimeout(() => {
          window.location.href = '/ngo/dashboard';
        }, 1000);
      }
      
      onSuccess?.();
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      toast({
        title: 'Login failed',
        description: authError.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className={theme.getSelectedTextColor()}>Login</CardTitle>
        <CardDescription className={theme.getThemeColors().foreground}>
          Select your role and enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role Selection */}
        <div className="space-y-3 mb-6">
          <Label className={`text-sm font-medium ${theme.getThemeColors().foreground}`}>Select your role:</Label>
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
              className={`flex flex-col gap-1 h-auto py-3 ${
                selectedRole === 'delivery' ? (theme.theme === 'light' ? 'text-black' : 'text-yellow-100') : theme.getThemeColors().foreground
              }`}
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
                selectedRole === 'ngo' ? 'text-black' : 'text-gray-600'
              }`}
            >
              <Building className="h-4 w-4" />
              <span className="text-xs">NGO</span>
            </Button>
          </div>
        </div>

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
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

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
            <span className={selectedRole === 'delivery' ? theme.getSelectedTextColor() : selectedRole === 'ngo' ? theme.getSelectedTextColor() : theme.getThemeColors().foreground}>Login as {selectedRole === 'customer' ? 'Customer' : selectedRole === 'delivery' ? 'Delivery Agent' : 'NGO'}</span>
          </Button>
        </form>

        {onRegisterClick && (
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Button
              variant="link"
              className={`p-0 h-auto font-normal ${
                selectedRole === 'delivery' ? theme.getSelectedTextColor() : selectedRole === 'ngo' ? theme.getSelectedTextColor() : theme.getThemeColors().foreground
              }`}
              onClick={onRegisterClick}
            >
              Register here
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
