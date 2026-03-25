import { Link } from "react-router-dom";
import { ArrowRight, Gift, ShoppingBag, Truck, Award, Trophy, Heart, Calendar, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { BirthdayBonusAlert } from "@/components/BirthdayBonusAlert";
import { rewardTiers } from "@/lib/mockData";
import heroImage from "@/assets/hero-thrift.jpg";
import heroImageDark from "@/assets/hero-thrift-dark.jpg";
import { useTheme } from "@/contexts/ThemeContext";
import { useReviews } from "@/contexts/ReviewContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  const [topDonors, setTopDonors] = useState<any[]>([]);

  useEffect(() => {
    console.log('🏠 Home: Component loaded!');
    
    const fetchProducts = async () => {
      try {
        console.log('🔍 Home: Starting fetchProducts...');
        setLoading(true);
        const productsRef = collection(db, 'products');
        
        const q = query(
          productsRef,
          where('status', '==', 'approved')
        );
        
        const querySnapshot = await getDocs(q);
        console.log(`📊 Home: Found ${querySnapshot.docs.length} approved products`);
        
        const fetchedProducts: Product[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📦 Home: Product data:', {
            id: doc.id,
            title: data.title,
            status: data.status,
            createdAt: data.createdAt
          });
          
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
        
        fetchedProducts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const limitedProducts = fetchedProducts.slice(0, 4);
        
        console.log('📦 Home: Setting products:', limitedProducts.length);
        console.log('📦 Home: Products array:', limitedProducts);
        setProducts(limitedProducts);
      } catch (error) {
        console.error('❌ Home: Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    console.log('🏠 Home: About to call fetchProducts...');
    fetchProducts();
    fetchDonorData();
    console.log('🏠 Home: fetchProducts and fetchDonorData called');
  }, []);

  useEffect(() => {
    console.log('📦 Home: Products state updated:', products);
  }, [products]);

  const fetchDonorData = async () => {
    try {
      console.log('🚀 Home fetchDonorData called!');
      
      const donationsQuery = query(collection(db, 'donations'));
      const donationsSnapshot = await getDocs(donationsQuery);
      
      const ngoAcceptedOrdersQuery = query(collection(db, 'ngoAcceptedOrders'));
      const ngoAcceptedOrdersSnapshot = await getDocs(ngoAcceptedOrdersQuery);
      
      console.log(`📊 Home Found ${donationsSnapshot.docs.length} donation documents, ${ngoAcceptedOrdersSnapshot.docs.length} NGO accepted orders`);
      
      const donorMap = new Map();
      
      donationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || data.donorId;
        
        console.log('🔍 Home Donation data:', {
          docId: doc.id,
          userId: userId,
          donorName: data.donorName,
          donorEmail: data.donorEmail
        });
        
        if (!donorMap.has(userId)) {
          let donorName = data.donorName || 'Anonymous Donor';
          
          if (donorName.includes('@')) {
            donorName = donorName.split('@')[0];
          }
          
          console.log('👤 Home Creating donor entry:', {
            userId: userId,
            name: donorName,
            email: data.donorEmail
          });
          
          donorMap.set(userId, {
            id: userId,
            name: donorName,
            email: data.donorEmail || '',
            totalItems: 0,
            totalDonations: 0,
            uniqueItems: new Set(),
            causes: new Set(),
            firstDonation: null,
            lastDonation: null,
            impactScore: 0,
            badges: [],
            ngoHelpCount: 0
          });
        }
        
        const donor = donorMap.get(userId);
        donor.totalDonations++;
        donor.totalItems += data.quantity || 1;
        donor.uniqueItems.add(data.items || 'Unknown');
        if (data.cause) donor.causes.add(data.cause);
        
        const donationDate = data.createdAt?.toDate();
        if (donationDate) {
          if (!donor.firstDonation || donationDate < donor.firstDonation) {
            donor.firstDonation = donationDate;
          }
          if (!donor.lastDonation || donationDate > donor.lastDonation) {
            donor.lastDonation = donationDate;
          }
        }
        
        donor.impactScore += (data.quantity || 1) * 10;
        if (data.cause === 'Education') donor.impactScore += 5;
        if (data.cause === 'Healthcare') donor.impactScore += 5;
        if (data.cause === 'Emergency') donor.impactScore += 8;
      });
      
      ngoAcceptedOrdersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const helperId = data.donorId || data.userId;
        const ngoId = data.ngoId;
        
        if (helperId && ngoId) {
          console.log('🤝 Home NGO Help data:', {
            helperId: helperId,
            ngoId: ngoId,
            items: data.items,
            quantity: data.quantity
          });
          
          if (donorMap.has(helperId)) {
            const donor = donorMap.get(helperId);
            donor.ngoHelpCount++;
            donor.totalItems += data.quantity || 1;
            donor.uniqueItems.add(data.items || 'NGO Help');
            donor.causes.add('NGO Support');
            
            donor.impactScore += (data.quantity || 1) * 15;
            
            const helpDate = data.createdAt?.toDate();
            if (helpDate && (!donor.lastDonation || helpDate > donor.lastDonation)) {
              donor.lastDonation = helpDate;
            }
          }
        }
      });
      
      const donors = Array.from(donorMap.values());
      donors.sort((a, b) => b.impactScore - a.impactScore);
      
      donors.forEach((donor, index) => {
        const badges = [];
        
        if (donor.totalDonations >= 10) badges.push({ label: 'Dedicated', color: 'bg-blue-100 text-blue-800' });
        if (donor.totalDonations >= 25) badges.push({ label: 'Super', color: 'bg-purple-100 text-purple-800' });
        if (donor.totalDonations >= 50) badges.push({ label: 'Elite', color: 'bg-yellow-100 text-yellow-800' });
        
        if (donor.causes.size >= 3) badges.push({ label: 'Versatile', color: 'bg-green-100 text-green-800' });
        if (donor.uniqueItems.size >= 10) badges.push({ label: 'Variety Pack', color: 'bg-orange-100 text-orange-800' });
        
        if (donor.ngoHelpCount >= 1) badges.push({ label: '🤝 NGO Helper', color: 'bg-purple-100 text-purple-800' });
        if (donor.ngoHelpCount >= 3) badges.push({ label: '🌟 NGO Supporter', color: 'bg-purple-200 text-purple-900' });
        if (donor.ngoHelpCount >= 5) badges.push({ label: '💜 NGO Champion', color: 'bg-purple-300 text-purple-900' });
        if (donor.ngoHelpCount >= 10) badges.push({ label: '👑 NGO Hero', color: 'bg-purple-500 text-white' });
        
        if (index === 0) badges.push({ label: '👑 Top', color: 'bg-yellow-500 text-white' });
        
        donor.badges = badges;
      });
      
      setTopDonors(donors.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching donor data:', error);
    }
  };
  
  return (
    <div className="min-h-screen">
      <BirthdayBonusAlert />
      
      {/* Hero */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <img src={theme === 'dark' ? heroImageDark : heroImage} alt="StyleEase curated thrift" className="absolute inset-0 w-full h-full object-cover" />
        {theme === 'light' && (
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent animate-pulse" />
        )}
        {theme === 'dark' && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent animate-pulse" />
        )}
        <div className="relative container mx-auto px-4">
          <div className="max-w-xl animate-fade-in">
            <div className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm rounded-full border mb-6 hover:scale-105 transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-warm/20 border-warm/30 hover:bg-warm/30' 
                : 'bg-white/10 border-white/20 hover:bg-white/20'
            }`}>
              <Gift className={`h-4 w-4 ${theme === 'dark' ? 'text-warm-foreground' : 'text-primary-foreground'}`} />
              <p className={`font-medium text-sm tracking-widest uppercase ${
                theme === 'dark' ? 'text-warm-foreground' : 'text-primary-foreground'
              }`}>
                Curated Pre-Loved Fashion
              </p>
            </div>
            <h1 className={`font-display text-5xl md:text-7xl font-bold leading-tight mb-6 drop-shadow-lg ${
              theme === 'dark' ? 'text-warm-foreground' : 'text-primary-foreground'
            }`}>
              Style That <br /><span className={`italic bg-gradient-to-r ${
                theme === 'dark' 
                  ? 'from-amber-400 to-orange-400' 
                  : 'from-green-400 to-emerald-400'
              } bg-clip-text text-transparent`}>Tells a Story</span>
            </h1>
            <p className={`text-lg mb-8 max-w-md leading-relaxed backdrop-blur-sm ${
              theme === 'dark' ? 'text-warm-foreground/80' : 'text-primary-foreground/90'
            }`}>
              Buy, sell, and donate pre-loved treasures. Every piece verified. Every purchase earns rewards.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg" className="text-base px-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <ShoppingBag className="mr-2 h-4" />
                  Shop Now <ArrowRight className="ml-2 h-4" />
                </Button>
              </Link>
              <Link to="/sell">
                <Button size="lg" className="text-base px-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <ShoppingBag className="mr-2 h-4" />
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Donor Section */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-card' : 'bg-card'}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className={`text-3xl font-bold mb-8 ${theme === 'dark' ? 'text-foreground' : 'text-foreground'}`}>
            Thank You to Our Donors
          </h2>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            Your generosity makes a difference in our community.
          </p>
          <Link to="/donate">
            <Button size="lg" className="px-8 py-3">
              <Heart className="h-5 w-5 mr-2" />
              Make a Donation
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-card' : 'bg-card'}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`text-center p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-card to-muted border border-warm/20 hover:border-warm/40 hover:shadow-warm/20' 
                  : 'bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg'
              }`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-warm/20 to-accent/20' 
                    : 'bg-gradient-to-br from-primary/10 to-primary/20'
                }`}>
                  <f.icon className={`h-6 w-6 transition-all duration-300 ${
                    theme === 'dark' ? 'text-warm-foreground' : 'text-primary'
                  }`} />
                </div>
                <h3 className={`font-display font-semibold text-lg mb-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-foreground' : 'text-foreground'
                }`}>
                  {f.title}
                </h3>
                <p className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-background' : 'bg-background'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className={`text-sm uppercase tracking-widest mb-1 ${
                theme === 'dark' ? 'text-warm-foreground' : 'text-muted-foreground'
              }`}>
                Curated Picks
              </p>
              <h2 className={`font-display text-3xl md:text-4xl font-bold ${
                theme === 'dark' ? 'text-foreground' : 'text-foreground'
              }`}>
                Trending Now
              </h2>
            </div>
            <Link to="/products" className={`text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105 ${
              theme === 'dark' ? 'text-warm-foreground hover:text-accent' : 'text-primary hover:underline'
            }`}>
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className={`rounded-lg h-64 mb-4 ${
                    theme === 'dark' ? 'bg-muted' : 'bg-muted'
                  }`}></div>
                  <div className={`h-4 rounded mb-2 ${
                    theme === 'dark' ? 'bg-muted' : 'bg-muted'
                  }`}></div>
                  <div className={`h-4 rounded w-3/4 ${
                    theme === 'dark' ? 'bg-muted' : 'bg-muted'
                  }`}></div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'}>
                  No approved products available yet.
                </p>
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

      {/* Footer */}
      <footer className={`border-t py-10 ${theme === 'dark' ? 'bg-card' : 'bg-card'}`}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span className={`font-display font-bold text-lg ${
            theme === 'dark' ? 'text-foreground' : 'text-foreground'
          }`}>
            StyleEase
          </span>
          <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'}>
            © 2026 StyleEase. Curated pre-loved fashion.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
