import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { donationCauses } from "@/lib/mockData";

const causeIcons: Record<string, any> = {
  'Education': Award,
  'Healthcare': Heart,
  'Environment': Gift,
  'Animals': Truck,
  'Emergency': Award,
  'Community': Heart,
  'Other': Gift
};

import { Gift, Heart, Award, Truck, ImagePlus, X, Package, Clock, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import FreeLocationPicker from "@/components/FreeLocationPicker";
import AddressInput from "@/components/AddressInput";

const Donate = () => {
  const [selectedCause, setSelectedCause] = useState("");
  const { user } = useAuth();
  const [donationImages, setDonationImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationRequests, setDonationRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeSection, setActiveSection] = useState<'requests' | 'donate'>('requests');
  const [address, setAddress] = useState<{
    streetAddress: string;
    apartment: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    fullAddress?: string;
    latitude?: number;
    longitude?: number;
  }>({
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDonationRequests();
  }, []);

  const fetchDonationRequests = async () => {
    try {
      const q = query(
        collection(db, 'donationRequests'),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDonationRequests(data);
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      toast.error('Failed to load donation requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleFulfillRequest = async (request: any) => {
    try {
      const donationData = {
        userId: user?.uid,
        donorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous Donor',
        donorEmail: user?.email,
        donorPhone: '',
        pickupAddress: request.pickupAddress,
        items: request.items,
        description: `Fulfilling NGO request: ${request.title}`,
        status: 'pending',
        requestedByNGO: request.requestedByNGO,
        originalRequestId: request.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const donationRef = doc(db, 'donations', `${Date.now()}_${user?.uid}`);
      await setDoc(donationRef, donationData);

      await updateDoc(doc(db, 'donationRequests', request.id), {
        status: 'fulfilled',
        fulfilledBy: user?.uid,
        fulfilledAt: serverTimestamp()
      });

      toast.success('Donation submitted! You\'ll receive pickup details soon.');
      fetchDonationRequests();
      
    } catch (error) {
      console.error('Error fulfilling request:', error);
      toast.error('Failed to fulfill donation request');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were invalid. Please upload only images under 5MB.');
    }

    setDonationImages(prev => [...prev, ...validFiles]);
    
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index: number) => {
    setDonationImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const donationData = {
        userId: user.uid,
        cause: selectedCause,
        description: formData.get('description') as string,
        pickupAddress: address.fullAddress || '',
        addressDetails: address,
        images: donationImages.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        })),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const donationRef = doc(db, 'donations', `${Date.now()}_${user.uid}`);
      await setDoc(donationRef, donationData);

      toast.success('Donation submitted successfully! We\'ll arrange a free pickup and send you a certificate.');
      
      e.currentTarget.reset();
      setDonationImages([]);
      setImagePreviews([]);
      setSelectedCause('');
      setAddress({
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      });
      
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('Failed to submit donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <Gift className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h1 className="font-display text-3xl font-bold mb-2">Donate & Make a Difference</h1>
          <p className="text-muted-foreground">Give your pre-loved items a second life. Earn bonus points and a certificate.</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border p-1 bg-muted">
            <button
              onClick={() => setActiveSection('requests')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === 'requests'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building className="h-4 w-4 mr-2" />
              NGO Requests
            </button>
            <button
              onClick={() => setActiveSection('donate')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === 'donate'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gift className="h-4 w-4 mr-2" />
              Make Donation
            </button>
          </div>
        </div>

        {activeSection === 'requests' ? (
          <Card className="mb-8 shadow-lg">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                NGO Donation Requests
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  {donationRequests.length} Active Requests
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRequests ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-blue-600">Loading donation requests...</p>
                </div>
              ) : donationRequests.length === 0 ? (
                <div className="text-center py-12 text-blue-600">
                  <Building className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <p className="text-lg font-medium">No active donation requests</p>
                  <p className="text-sm">NGOs haven't requested any donations yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-blue-50">
                      <TableRow>
                        <TableHead className="font-semibold text-blue-900">NGO</TableHead>
                        <TableHead className="font-semibold text-blue-900">Request Title</TableHead>
                        <TableHead className="font-semibold text-blue-900">Items Needed</TableHead>
                        <TableHead className="font-semibold text-blue-900">Category</TableHead>
                        <TableHead className="font-semibold text-blue-900">Urgency</TableHead>
                        <TableHead className="font-semibold text-blue-900">Pickup Address</TableHead>
                        <TableHead className="font-semibold text-blue-900 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donationRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-blue-600" />
                              {request.requestedByNGO || 'Unknown NGO'}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{request.title}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="truncate" title={request.items}>
                                {request.items}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {request.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                              request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                              request.urgency === 'low' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {request.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm text-blue-600 truncate">
                                {request.pickupAddress}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Button
                                size="sm"
                                onClick={() => handleFulfillRequest(request)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Fulfill Request
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="grid grid-cols-3 gap-3 mb-10">
                {[
                  { icon: Award, label: "Earn Points" },
                  { icon: Truck, label: "Free Pickup" },
                  { icon: Gift, label: "Get Certificate" },
                ].map((b, i) => (
                  <div key={i} className="text-center p-4 bg-card border rounded-xl">
                    <b.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    Make a Donation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Select a Cause</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {donationCauses.map((cause) => {
                          const Icon = causeIcons[cause] || Heart;
                          return (
                            <button
                              key={cause}
                              type="button"
                              onClick={() => setSelectedCause(cause)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selectedCause === cause
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <Icon className={`h-5 w-5 mb-2 ${selectedCause === cause ? "text-primary" : "text-muted-foreground"}`} />
                              <p className="font-medium text-sm">{cause}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Donation Images *</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Donation image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {imagePreviews.length < 3 && (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Add Image</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {imagePreviews.length === 0 && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload donation images</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each (max 3 images)</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Item Description</Label>
                      <Textarea name="description" placeholder="What are you donating?" rows={3} required />
                    </div>

                    <div className="space-y-4">
                      <Label>Pickup Location *</Label>
                      <AddressInput
                        onAddressChange={(addr) => setAddress(addr)}
                        required={true}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full text-base" disabled={isSubmitting}>
                      <Gift className="mr-2 h-5 w-5" />
                      {isSubmitting ? 'Submitting...' : 'Submit Donation'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donate;
