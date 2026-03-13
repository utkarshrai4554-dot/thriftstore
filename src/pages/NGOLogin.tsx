import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const NGOLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

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
        toast.error('No NGO registration found for this account');
        await auth.signOut();
        return;
      }

      if (!isApproved) {
        toast.error('Your NGO registration is not yet approved. Please wait for admin approval.');
        await auth.signOut();
        return;
      }

      toast.success(`Welcome back, ${ngoData.name}!`);
      
      // Store NGO session
      localStorage.setItem('ngoUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        ...ngoData
      }));
      
      // Redirect to NGO dashboard
      navigate('/ngo/dashboard');
    } catch (error: any) {
      console.error('NGO login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
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
