import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authType, setAuthType] = useState<'user' | 'ngo'>('user');

  const handleAuthSuccess = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Style Revival Hub</h1>
          <p className="mt-2 text-sm text-gray-600">Your curated thrift platform</p>
        </div>
        
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
            <div>
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onLoginClick={() => setIsLogin(true)}
              />
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/ngo-register'}
                  className="w-full"
                >
                  Register as NGO
                </Button>
              </div>
            </div>
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
