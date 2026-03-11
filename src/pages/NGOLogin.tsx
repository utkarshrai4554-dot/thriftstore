import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { Building, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NGOLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For now, we'll use a simple email-based login
      // In production, you might want to implement proper NGO authentication
      const response = await fetch('/api/ngo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Welcome back, ${data.ngoName}!`);
        
        // Store NGO session
        localStorage.setItem('ngoUser', JSON.stringify(data));
        
        // Redirect to NGO dashboard
        window.location.href = '/ngo-dashboard';
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('NGO login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">NGO Portal</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your NGO account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>NGO Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ngo@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            to="/auth" 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Login
          </Link>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/ngo-register" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Register your NGO
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NGOLogin;
