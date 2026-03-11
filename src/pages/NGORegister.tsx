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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form data
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.city) {
      console.error('❌ Missing required fields');
      toast.error('Please fill all required fields');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      console.error('❌ Passwords do not match');
      toast.error('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const ngoData = {
        ...formData,
        status: 'pending',
        submittedAt: serverTimestamp(),
        approvedAt: null
      };

      const docRef = await addDoc(collection(db, 'ngoRegistrations'), ngoData);
      
      toast.success('NGO registration submitted! Admin will review your application.');
      
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

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('NGO registration error:', error);
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
