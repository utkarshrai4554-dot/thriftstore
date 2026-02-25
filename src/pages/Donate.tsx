import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { donationCauses } from "@/lib/mockData";
import { Gift, Heart, Award, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Donate = () => {
  const [selectedCause, setSelectedCause] = useState("");
  const { toast } = useToast();

  const causeIcons: Record<string, typeof Heart> = {
    "Charity": Heart,
    "Poor Families": Gift,
    "NGOs": Award,
    "Disaster Relief": Truck,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Donation submitted!", description: "We'll arrange a free pickup. You'll receive a certificate soon." });
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

          <div className="space-y-2">
            <Label>Item Description</Label>
            <Textarea placeholder="What are you donating?" rows={3} required />
          </div>

          <div className="space-y-2">
            <Label>Pickup Address</Label>
            <Input placeholder="Your address for free pickup" required />
          </div>

          <Button type="submit" size="lg" className="w-full text-base">
            <Gift className="mr-2 h-5 w-5" /> Submit Donation
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Donate;
