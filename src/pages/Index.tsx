import { Link } from "react-router-dom";
import { ArrowRight, Gift, ShoppingBag, Truck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { mockProducts, rewardTiers } from "@/lib/mockData";
import heroImage from "@/assets/hero-thrift.jpg";

const features = [
  { icon: ShoppingBag, title: "Buy & Sell", desc: "Curated thrift finds verified for authenticity" },
  { icon: Gift, title: "Donate", desc: "Give to causes that matter, earn certificates" },
  { icon: Truck, title: "Free Pickup", desc: "We collect from your doorstep" },
  { icon: Award, title: "Earn Rewards", desc: "Points on every purchase and donation" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <img src={heroImage} alt="StyleEase curated thrift" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-xl animate-fade-in">
            <p className="text-primary-foreground/80 font-medium text-sm tracking-widest uppercase mb-4">Curated Pre-Loved Fashion</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground leading-tight mb-6">
              Style That <br /><span className="italic">Tells a Story</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-md">
              Buy, sell, and donate pre-loved treasures. Every piece verified. Every purchase earns rewards.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg" className="bg-green-600 text-white hover:bg-green-700 text-base px-8">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/sell">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 text-base px-8">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="text-center p-6 rounded-xl hover:bg-muted transition-colors" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Curated Picks</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold">Trending Now</h2>
            </div>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {mockProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* Rewards */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Award className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Reward Points Program</h2>
          <p className="text-primary-foreground/70 mb-10 max-w-md mx-auto">Earn points on every purchase and donation. Redeem for discounts and free delivery.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {rewardTiers.map((t, i) => (
              <div key={i} className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="font-display text-2xl font-bold">{t.points}</p>
                <p className="text-xs opacity-70 mb-2">points</p>
                <p className="text-sm font-semibold">{t.discount} off</p>
                <p className="text-xs opacity-70">{t.delivery}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Thrift?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of conscious shoppers making sustainable fashion choices.</p>
          <Link to="/auth">
            <Button size="lg" className="px-10 text-base">Get Started</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground text-lg">StyleEase</span>
          <p>© 2026 StyleEase. Curated pre-loved fashion.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
