import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const DeliveryAgentRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting delivery agent registration with approval credentials:', formData.email);
      
      // Check if there's an approved request for this email
      const deliveryAgentsQuery = doc(db, 'deliveryAgents', `approved_${formData.email}`);
      const querySnapshot = await getDoc(deliveryAgentsQuery);
      
      if (!querySnapshot.exists()) {
        setError('No approved delivery agent request found for this email. Please wait for admin approval.');
        setIsLoading(false);
        return;
      }

      const approvalData = querySnapshot.data();
      
      // Verify the password matches the temporary password
      if (approvalData.tempPassword !== formData.password) {
        setError('Invalid credentials. Please use the password from your approval email.');
        setIsLoading(false);
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      console.log('Firebase auth successful for delivery agent! User UID:', user.uid);
      
      // Create user profile with delivery role
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: approvalData.displayName,
        phone: approvalData.phone,
        role: 'delivery',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Move approval data to permanent delivery agent record
      await setDoc(doc(db, 'deliveryAgents', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: approvalData.displayName,
        phone: approvalData.phone,
        vehicleType: approvalData.vehicleType,
        vehicleNumber: approvalData.vehicleNumber,
        drivingLicense: approvalData.drivingLicense,
        address: approvalData.address,
        experience: approvalData.experience,
        availability: approvalData.availability,
        status: 'approved',
        approvedAt: approvalData.approvedAt,
        approvedBy: approvalData.approvedBy,
        totalDeliveries: 0,
        rating: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Delete the temporary approval record
      await deleteDoc(doc(db, 'deliveryAgents', `approved_${formData.email}`));
      
      console.log('Delivery agent registration completed successfully!');
      setIsRegistered(true);
      
      toast({
        title: "Registration Successful",
        description: "Your delivery agent account is now active!",
      });
      
    } catch (error: any) {
      console.error('Delivery agent registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError('Registration failed. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your delivery agent account is now active. You can login and start receiving delivery assignments.
            </p>
            <Button 
              onClick={() => navigate('/delivery-login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Delivery Agent Registration</CardTitle>
          <p className="text-muted-foreground">
            Use the credentials from your approval email
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password from email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Truck className="h-3 w-3 mr-1" />
              Approved agents only
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryAgentRegister;
