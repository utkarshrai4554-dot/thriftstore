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
import { toast } from "sonner";
import FreeLocationPicker from "@/components/FreeLocationPicker";

const SellProduct = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const billInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were invalid. Please upload only images under 5MB.');
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
      toast.error('Bill file must be under 10MB');
    }
  };

  const removeBill = () => {
    setBillFile(null);
    if (billInputRef.current) {
      billInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a product');
      return;
    }
    
    if (!accepted) {
      toast.error('Please accept the authenticity policy');
      return;
    }

    if (productImages.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const productData = {
        userId: user.uid,
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        age: formData.get('age') as string,
        condition: formData.get('condition') as string,
        originalUrl: formData.get('originalUrl') as string,
        price: parseFloat(formData.get('price') as string),
        damageDetails: formData.get('damageDetails') as string,
        description: formData.get('description') as string,
        images: productImages.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file) // In production, upload to storage service
        })),
        hasBill: !!billFile,
        billFile: billFile ? {
          name: billFile.name,
          size: billFile.size,
          type: billFile.type
        } : null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const productRef = doc(db, 'sellProducts', `${Date.now()}_${user.uid}`);
      await setDoc(productRef, productData);

      toast.success('Product submitted successfully! Your item will be reviewed by our team.');
      
      // Reset form
      e.currentTarget.reset();
      setProductImages([]);
      setImagePreviews([]);
      setBillFile(null);
      setAccepted(false);
      
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error('Failed to submit product. Please try again.');
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input name="name" placeholder="e.g. Vintage Denim Jacket" required />
            </div>
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Age of Product</Label>
              <Input name="age" placeholder="e.g. 3 years" required />
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

          <div className="space-y-2">
            <Label>Original Store URL</Label>
            <Input name="originalUrl" type="url" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Input name="price" type="number" min="1" placeholder="0.00" required />
          </div>

          <div className="space-y-4">
            <Label>Location *</Label>
            <FreeLocationPicker
              onLocationSelect={(location) => setSelectedLocation(location)}
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
