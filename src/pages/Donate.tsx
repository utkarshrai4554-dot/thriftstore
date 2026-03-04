import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { donationCauses } from "@/lib/mockData";
import { Gift, Heart, Award, Truck, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were invalid. Please upload only images under 5MB.');
    }

    setDonationImages(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setDonationImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const causeIcons: Record<string, typeof Heart> = {
    "Charity": Heart,
    "Poor Families": Gift,
    "NGOs": Award,
    "Disaster Relief": Truck,
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a donation');
      return;
    }
    
    if (!selectedCause) {
      toast.error('Please select a cause');
      return;
    }
    
    if (!address.streetAddress || !address.city || !address.state || !address.postalCode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    if (donationImages.length === 0) {
      toast.error('Please add at least one image of the donation item');
      return;
    }

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
          url: URL.createObjectURL(file) // In production, upload to storage service
        })),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const donationRef = doc(db, 'donations', `${Date.now()}_${user.uid}`);
      await setDoc(donationRef, donationData);

      toast.success('Donation submitted successfully! We\'ll arrange a free pickup and send you a certificate.');
      
      // Reset form
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
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <Gift className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h1 className="font-display text-3xl font-bold mb-2">Donate & Make a Difference</h1>
          <p className="text-muted-foreground">Give your pre-loved items a second life. Earn bonus points and a certificate.</p>
        </div>

        {/* Benefits */}
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
      </div>
    </div>
  );
};

export default Donate;
