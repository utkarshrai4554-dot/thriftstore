import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { DeliveryGuyRegisterForm } from './DeliveryGuyRegisterForm';
import { Button } from '@/components/ui/button';
import { Building, Truck, User } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authType, setAuthType] = useState<'user' | 'ngo' | 'delivery'>('user');

  const handleAuthSuccess = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">StyleEase</h1>
          <p className="mt-2 text-sm text-gray-600">Your curated thrift platform</p>
        </div>
        
        {/* Registration Type Selection */}
        {!isLogin && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center mb-2">Register as:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={authType === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuthType('user')}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <User className="h-4 w-4" />
                <span className="text-xs">Customer</span>
              </Button>
              <Button
                variant={authType === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuthType('delivery')}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Truck className="h-4 w-4" />
                <span className="text-xs">Delivery</span>
              </Button>
              <Button
                variant={authType === 'ngo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuthType('ngo')}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Building className="h-4 w-4" />
                <span className="text-xs">NGO</span>
              </Button>
            </div>
          </div>
        )}
        
        {/* Login/Register Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={isLogin ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setIsLogin(true)}
            className="flex-1"
          >
            Login
          </Button>
          <Button
            variant={!isLogin ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setIsLogin(false)}
            className="flex-1"
          >
            Register
          </Button>
        </div>
        
        {/* Forms */}
        {authType === 'user' ? (
          isLogin ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onRegisterClick={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onLoginClick={() => setIsLogin(true)}
            />
          )
        ) : authType === 'delivery' ? (
          isLogin ? (
            <div className="text-center py-8">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <Truck className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="text-lg font-semibold mb-2">Delivery Portal</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access your delivery dashboard and manage orders.
                </p>
                <Button
                  onClick={() => window.location.href = '/delivery-login'}
                  className="w-full mb-4"
                >
                  Delivery Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/delivery-register'}
                  className="w-full"
                >
                  Register New Delivery Guy
                </Button>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setAuthType('user')}
                  className="text-sm"
                >
                  ← Back to User Login
                </Button>
              </div>
            </div>
          ) : (
            <DeliveryGuyRegisterForm
              onSuccess={handleAuthSuccess}
              onLoginClick={() => setIsLogin(true)}
            />
          )
        ) : (
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <Building className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">NGO Portal</h3>
              <p className="text-sm text-gray-600 mb-4">
                Access your NGO dashboard and manage donations.
              </p>
              <Button
                onClick={() => window.location.href = '/ngo-login'}
                className="w-full mb-4"
              >
                NGO Login
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/ngo-register'}
                className="w-full"
              >
                Register New NGO
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setAuthType('user')}
                className="text-sm"
              >
                ← Back to User Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
