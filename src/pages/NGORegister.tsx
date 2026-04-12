import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createOTPRequest } from '@/services/otpService';
import OTPVerification from '@/components/auth/OTPVerification';

const NGORegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    registrationNumber: "",
    address: "",
    city: "",
    description: "",
    website: "",
    contactPerson: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpId, setOtpId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors(null);

    // Validate form data
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.city) {
      setFormErrors('Please fill all required fields');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormErrors('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

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
    
    const domain = formData.email.split('@')[1]?.toLowerCase();
    if (commonTypos[domain]) {
      setFormErrors('Please check your email domain. Did you mean gmail.com?');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Starting NGO registration with OTP verification:', formData.email);
      
      // Step 1: Create OTP request
      const otpRequestId = await createOTPRequest(formData.email);
      console.log('OTP request created:', otpRequestId);
      
      // Step 2: Show OTP verification screen
      setOtpId(otpRequestId);
      setShowOTP(true);
      
      toast({
        title: "Verification Code Sent",
        description: "A 4-digit code has been sent to your email address.",
      });
      
    } catch (error) {
      console.error('NGO registration error:', error);
      setFormErrors('Registration failed. Please try again.');
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Failed to send verification code. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPVerified = async () => {
    setIsSubmitting(true);
    setFormErrors(null);

    try {
      console.log('OTP verified, completing NGO registration...');
      
      // Step 3: Complete registration after OTP verification
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      console.log('Firebase auth successful for NGO! User UID:', user.uid);
      
      // Then save to ngoRegistrations collection
      const ngoData = {
        ...formData,
        status: 'pending',
        submittedAt: serverTimestamp(),
        approvedAt: null,
        uid: user.uid // Add Firebase UID for reference
      };

      const docRef = await addDoc(collection(db, 'ngoRegistrations'), ngoData);
      
      console.log('NGO registration saved to Firestore');
      toast({
        title: "Registration Successful",
        description: "NGO registration submitted! Admin will review your application.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        registrationNumber: "",
        address: "",
        city: "",
        description: "",
        website: "",
        contactPerson: ""
      });
      setShowOTP(false);
      setOtpId('');
      
    } catch (error) {
      console.error('NGO registration completion error:', error);
      setFormErrors('Registration failed. Please try again.');
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Failed to complete registration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPCancel = () => {
    setShowOTP(false);
    setOtpId('');
    setFormErrors(null);
  };

  const handleOTPBack = () => {
    // Go back to registration form to resend OTP
    setShowOTP(false);
    setOtpId('');
    // Keep formData to allow resending
  };

  // Show OTP verification screen
  if (showOTP) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <OTPVerification
          email={formData.email}
          otpId={otpId}
          onVerified={handleOTPVerified}
          onCancel={handleOTPCancel}
          onBack={handleOTPBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">NGO Registration</CardTitle>
            <p className="text-muted-foreground">Register your NGO to receive donations from our platform</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact Information */}
                <div className="space-y-4">
                  <Label>NGO Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter NGO name"
                    required
                  />
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="ngo@example.com"
                    required
                  />
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a password"
                    required
                  />
                  <Label>Confirm Password *</Label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Confirm your password"
                    required
                  />
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                {/* Organization Information */}
                <div className="space-y-4">
                  <Label>Registration Number *</Label>
                  <Input
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    placeholder="NGO-REG-12345"
                    required
                  />
                  <Label>Address *</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Full address of NGO office"
                    rows={3}
                    required
                  />
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="City where NGO is located"
                    required
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <Label>Website</Label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://www.ngowebsite.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    placeholder="Name of contact person"
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NGORegister;
