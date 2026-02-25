import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ImagePlus, FileText } from "lucide-react";
import { categories } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

const SellProduct = () => {
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast({ title: "Please accept the authenticity policy", variant: "destructive" });
      return;
    }
    toast({ title: "Product submitted!", description: "Your item will be reviewed by our team." });
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
              <Input placeholder="e.g. Vintage Denim Jacket" required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select required>
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
              <Input placeholder="e.g. 3 years" required />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select required>
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
            <Input type="url" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input type="number" min="1" placeholder="0.00" required />
          </div>

          <div className="space-y-2">
            <Label>Damage Details</Label>
            <Textarea placeholder="Describe any damage or wear..." rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Tell buyers about your item..." rows={4} required />
          </div>

          <div className="space-y-3">
            <Label>Product Images</Label>
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload images</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Original Bill (Optional)</Label>
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload bill for +50 bonus points</p>
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox id="policy" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
              <label htmlFor="policy" className="text-sm leading-relaxed cursor-pointer">
                I confirm this product is authentic and accurately described. I understand that if the item is found to be fake or significantly different from the description, a <strong>25% penalty + delivery charges</strong> will apply.
              </label>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full text-base">
            <Upload className="mr-2 h-5 w-5" /> Submit for Review
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SellProduct;
