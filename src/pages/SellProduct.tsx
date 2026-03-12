import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ImagePlus, FileText, X } from "lucide-react";
import { categories } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import FreeLocationPicker from "@/components/FreeLocationPicker";
import AddressInput from "@/components/AddressInput";

const SellProduct = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [billFile, setBillFile] = useState<File | null>(null);
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
  const billInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Please upload only images under 5MB.",
        variant: "destructive",
      });
    }

    setProductImages(prev => [...prev, ...validFiles]);
    
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
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      setBillFile(file);
    } else {
      toast({
        title: "File too large",
        description: "Bill file must be under 10MB",
        variant: "destructive",
      });
    }
  };

  const removeBill = () => {
    setBillFile(null);
    if (billInputRef.current) {
      billInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to submit a product",
        variant: "destructive",
      });
      return;
    }
    
    if (!accepted) {
      toast({
        title: "Policy acceptance required",
        description: "Please accept the authenticity policy",
        variant: "destructive",
      });
      return;
    }

    if (!address.streetAddress || !address.city || !address.state || !address.postalCode) {
      toast({
        title: "Address required",
        description: "Please fill in all required address fields",
        variant: "destructive",
      });
      return;
    }

    if (productImages.length === 0) {
      toast({
        title: "Image required",
        description: "Please add at least one product image",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const productData = {
        title: formData.get('name') as string,
        brand: formData.get('brand') || 'Unknown',
        category: formData.get('category') as string,
        color: formData.get('color') as string || null,
        size: formData.get('size') as string || null,
        condition: formData.get('condition') as string,
        originalPrice: formData.get('originalUrl') ? parseFloat(formData.get('originalUrl') as string) : null,
        sellingPrice: parseFloat(formData.get('price') as string),
        description: formData.get('description') as string,
        images: imagePreviews,
        quantity: parseInt(formData.get('quantity') as string) || 1, // Add quantity field
        sellerId: user.uid,
        status: 'pending',
        views: 0,
        likes: 0,
        address: address.fullAddress || '',
        addressDetails: address,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Debug: Log the product data being submitted
      console.log('Submitting product data:', productData);
      console.log('Collection target: sellProducts');
      console.log('User ID:', user.uid);

      // Save to Firestore sellProducts collection
      const productRef = doc(db, 'sellProducts', `${Date.now()}_${user.uid}`);
      console.log('Document path:', productRef.path);
      
      await setDoc(productRef, productData);

      console.log('✅ Product saved to sellProducts with ID:', productRef.id);
      console.log('🔍 Check sellProducts collection in Firebase Console');

      toast({
        title: "Product submitted for review!",
        description: "Your product has been sent to admin for approval. You'll be notified once it's approved.",
      });
      
      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }
      setProductImages([]);
      setImagePreviews([]);
      setBillFile(null);
      setAccepted(false);
      setAddress({
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      });
      
    } catch (error) {
      console.error('Error submitting product:', error);
      toast({
        title: "Failed to submit product",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Sell Your Item</h1>
          <p className="text-muted-foreground">List your pre-loved items. We'll verify and handle the rest.</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input name="name" placeholder="e.g. Vintage Denim Jacket" required />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input name="brand" placeholder="e.g. Levi's, Nike, etc." required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category" required>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c !== "All").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select name="condition" required>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  {["Excellent", "Good", "Fair", "Poor"].map(c => (
                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <Input name="color" placeholder="e.g. Blue, Black, etc." />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Input name="size" placeholder="e.g. M, L, XL, etc." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Original Store URL</Label>
            <Input name="originalUrl" type="url" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Input name="price" type="number" min="1" placeholder="0.00" required />
          </div>

          <div className="space-y-4">
            <Label>Pickup Location *</Label>
            <AddressInput
              onAddressChange={(addr) => setAddress(addr)}
              required={true}
            />
          </div>

          <div className="space-y-2">
            <Label>Damage Details</Label>
            <Textarea name="damageDetails" placeholder="Describe any damage or wear..." rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" placeholder="Tell buyers about your item..." rows={4} required />
          </div>

          <div className="space-y-3">
            <Label>Product Images *</Label>
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
                      alt={`Product image ${index + 1}`}
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
                {imagePreviews.length < 5 && (
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
                <p className="text-sm text-muted-foreground">Click to upload product images</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each (max 5 images)</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                name="quantity" 
                type="number" 
                min="1" 
                placeholder="Enter quantity" 
                required 
              />
            </div>

          <div className="space-y-3">
            <Label>Original Bill (Optional)</Label>
            <input
              ref={billInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleBillUpload}
              className="hidden"
            />
            
            {billFile ? (
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{billFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(billFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeBill}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => billInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              >
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload bill for +50 bonus points</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
            )}
          </div>

          <div className="bg-muted rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox id="policy" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
              <label htmlFor="policy" className="text-sm leading-relaxed cursor-pointer">
                I confirm this product is authentic and accurately described. I understand that if the item is found to be fake or significantly different from the description, a <strong>25% penalty + delivery charges</strong> will apply.
              </label>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full text-base" disabled={isSubmitting}>
            <Upload className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SellProduct;
