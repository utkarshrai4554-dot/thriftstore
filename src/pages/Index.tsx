import { Link } from "react-router-dom";
import { ArrowRight, Gift, ShoppingBag, Truck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { BirthdayBonusAlert } from "@/components/BirthdayBonusAlert";
import { rewardTiers } from "@/lib/mockData";
import heroImage from "@/assets/hero-thrift.jpg";
import heroImageDark from "@/assets/hero-thrift-dark.jpg";
import { useTheme } from "@/contexts/ThemeContext";
import { useReviews } from "@/contexts/ReviewContext";
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  color?: string;
  size?: string;
  condition: string;
  originalPrice?: number;
  sellingPrice: number;
  description: string;
  images: string[];
  sellerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const features = [
  { icon: ShoppingBag, title: "Buy & Sell", desc: "Curated thrift finds verified for authenticity" },
  { icon: Gift, title: "Donate", desc: "Give to causes that matter, earn certificates" },
  { icon: Truck, title: "Free Pickup", desc: "We collect from your doorstep" },
  { icon: Award, title: "Earn Rewards", desc: "Points on every purchase and donation" },
];

const Index = () => {
  const { theme } = useTheme();
  const { getProductAverageRating, getProductTotalReviews } = useReviews();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef,
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedProducts: Product[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedProducts.push({
            id: doc.id,
            title: data.title || '',
            brand: data.brand || '',
            category: data.category || '',
            color: data.color,
            size: data.size,
            condition: data.condition || 'Good',
            originalPrice: data.originalPrice,
            sellingPrice: data.sellingPrice || 0,
            description: data.description || '',
            images: data.images || [],
            sellerId: data.sellerId || '',
            status: data.status || 'approved',
            views: data.views || 0,
            likes: data.likes || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  return (
    <div className="min-h-screen">
      <BirthdayBonusAlert />
      {/* Hero */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <img src={theme === 'dark' ? heroImageDark : heroImage} alt="StyleEase curated thrift" className="absolute inset-0 w-full h-full object-cover" />
        {theme === 'light' && (
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        )}
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
                <Button size="lg" className={`text-base px-8 ${theme === 'dark' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/sell">
                <Button size="lg" variant="outline" className={`text-base px-8 ${theme === 'dark' ? 'border-warm text-warm-foreground hover:bg-warm hover:text-card-foreground' : 'border-green-600 text-green-600 hover:bg-green-50'}`}>
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
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-64 mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No approved products available yet.</p>
              </div>
            ) : (
              products.map((p) => (
                <ProductCard 
                  key={p.id} 
                  id={p.id}
                  name={p.title}
                  price={p.sellingPrice}
                  category={p.category}
                  condition={p.condition}
                  image={p.images[0] || '/placeholder.jpg'}
                  views={p.views}
                  averageRating={getProductAverageRating(p.id)}
                  totalReviews={getProductTotalReviews(p.id)}
                />
              ))
            )}
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
          <Link to="/get-started">
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
