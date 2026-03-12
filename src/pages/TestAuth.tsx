import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { registerUser, loginUser, checkUserExists, getCurrentUser } from '@/services/authService';

const TestAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      toast.error('Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(email, password, displayName);
      toast.success('Registration successful! Try logging in.');
    } catch (error: any) {
      toast.error(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please fill email and password');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckUser = async () => {
    if (!email) {
      toast.error('Please enter email');
      return;
    }

    try {
      const result = await checkUserExists(email);
      toast.success(`User check - Firestore: ${result.inFirestore ? '✅' : '❌'}, Auth: ${result.inAuth ? '✅' : '❌'}`);
    } catch (error: any) {
      toast.error(`Check failed: ${error.message}`);
    }
  };

  const handleShowCurrentUser = () => {
    const user = getCurrentUser();
    if (user) {
      toast.success(`Current user: ${user.email} (UID: ${user.uid})`);
    } else {
      toast.error('No user logged in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Authentication Test</h1>
          <p className="text-gray-600">Test registration and login flow</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Auth Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleRegister} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Registering...' : 'Register User'}
              </Button>
              
              <Button 
                onClick={handleLogin} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Logging in...' : 'Login User'}
              </Button>
              
              <Button 
                onClick={handleCheckUser} 
                disabled={isLoading}
                variant="secondary"
                className="w-full"
              >
                Check User Exists
              </Button>
              
              <Button 
                onClick={handleShowCurrentUser} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Show Current User
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>Use this page to test if registration creates users correctly.</p>
          <p>After registering, try logging in with the same credentials.</p>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;
