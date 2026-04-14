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

import { useAuth } from "@/hooks/useAuth";

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

  const { user, userProfile } = useAuth();

  const { getProductAverageRating, getProductTotalReviews } = useReviews();

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [topDonors, setTopDonors] = useState<any[]>([]);



  useEffect(() => {

    console.log('🏠 Home: Component loaded!');

    console.log('Current user:', user);

    console.log('User profile:', userProfile);

    console.log('User role from profile:', userProfile?.role);

    

    const fetchProducts = async () => {

      try {

        console.log('🔍 Home: Starting fetchProducts...');

        setLoading(true);

        const productsRef = collection(db, 'products');

        

        // Try with just status filter first (no orderBy)

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

        

        // Sort manually in JavaScript instead of Firestore orderBy

        fetchedProducts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        

        // Take only the first 4 products

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



  // Add debug logging for products state

  useEffect(() => {

    console.log('📦 Home: Products state updated:', products);

  }, [products]);



  const fetchDonorData = async () => {

    try {

      console.log('🚀 Home fetchDonorData called!');

      

      // Fetch individual donations

      const donationsQuery = query(collection(db, 'donations'));

      const donationsSnapshot = await getDocs(donationsQuery);

      

      // Fetch NGO accepted orders (to track who helped NGOs)

      const ngoAcceptedOrdersQuery = query(collection(db, 'ngoAcceptedOrders'));

      const ngoAcceptedOrdersSnapshot = await getDocs(ngoAcceptedOrdersQuery);

      

      console.log(`📊 Home Found ${donationsSnapshot.docs.length} donation documents, ${ngoAcceptedOrdersSnapshot.docs.length} NGO accepted orders`);

      

      // Group donations by user

      const donorMap = new Map();

      

      // Process individual donations

      donationsSnapshot.docs.forEach(doc => {

        const data = doc.data();

        const userId = data.userId || data.donorId;

        

        // Debug logging

        console.log('🔍 Home Donation data:', {

          docId: doc.id,

          userId: userId,

          donorName: data.donorName,

          donorEmail: data.donorEmail

        });

        

        if (!donorMap.has(userId)) {

          // Use a consistent naming strategy

          let donorName = data.donorName || 'Anonymous Donor';

          

          // If the name looks like an email, extract the part before @

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

        

        // Calculate impact score

        donor.impactScore += (data.quantity || 1) * 10;

        if (data.cause === 'Education') donor.impactScore += 5;

        if (data.cause === 'Healthcare') donor.impactScore += 5;

        if (data.cause === 'Emergency') donor.impactScore += 8;

      });

      

      // Process NGO accepted orders to track who helped NGOs

      ngoAcceptedOrdersSnapshot.docs.forEach(doc => {

        const data = doc.data();

        const helperId = data.donorId || data.userId; // User who helped

        const ngoId = data.ngoId; // NGO that was helped

        

        if (helperId && ngoId) {

          console.log('🤝 Home NGO Help data:', {

            helperId: helperId,

            ngoId: ngoId,

            items: data.items,

            quantity: data.quantity

          });

          

          // Add NGO help to the user's record

          if (donorMap.has(helperId)) {

            const donor = donorMap.get(helperId);

            donor.ngoHelpCount++;

            donor.totalItems += data.quantity || 1;

            donor.uniqueItems.add(data.items || 'NGO Help');

            donor.causes.add('NGO Support');

            

            // Add extra impact score for helping NGOs

            donor.impactScore += (data.quantity || 1) * 15; // Higher score for NGO help

            

            // Update last activity

            const helpDate = data.createdAt?.toDate();

            if (helpDate && (!donor.lastDonation || helpDate > donor.lastDonation)) {

              donor.lastDonation = helpDate;

            }

          }

        }

      });

      

      // Convert to array and sort by impact score

      const donors = Array.from(donorMap.values());

      donors.sort((a, b) => b.impactScore - a.impactScore);

      

      // Add badges based on achievements

      donors.forEach((donor, index) => {

        const badges = [];

        

        // Donation badges

        if (donor.totalDonations >= 10) badges.push({ label: 'Dedicated', color: 'bg-blue-100 text-blue-800' });

        if (donor.totalDonations >= 25) badges.push({ label: 'Super', color: 'bg-purple-100 text-purple-800' });

        if (donor.totalDonations >= 50) badges.push({ label: 'Elite', color: 'bg-yellow-100 text-yellow-800' });

        

        if (donor.causes.size >= 3) badges.push({ label: 'Versatile', color: 'bg-green-100 text-green-800' });

        if (donor.uniqueItems.size >= 10) badges.push({ label: 'Variety Pack', color: 'bg-orange-100 text-orange-800' });

        

        // NGO Help badges

        if (donor.ngoHelpCount >= 1) badges.push({ label: '🤝 NGO Helper', color: 'bg-purple-100 text-purple-800' });

        if (donor.ngoHelpCount >= 3) badges.push({ label: '🌟 NGO Supporter', color: 'bg-purple-200 text-purple-900' });

        if (donor.ngoHelpCount >= 5) badges.push({ label: '💜 NGO Champion', color: 'bg-purple-300 text-purple-900' });

        if (donor.ngoHelpCount >= 10) badges.push({ label: '👑 NGO Hero', color: 'bg-purple-500 text-white' });

        

        // Top rank badges

        if (index === 0) badges.push({ label: '👑 Top', color: 'bg-yellow-500 text-white' });

        

        donor.badges = badges;

      });

      

      // Set top donors (show top 5 for home page)

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

          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />

        )}

        <div className="relative container mx-auto px-4">

          <div className="animate-fade-in mt-8">

            <div className="flex justify-center gap-4">

              <Link to="/products">

                <Button size="lg" className={`text-base px-8 ${theme === 'dark' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-green-600 hover:bg-green-700 text-white'}`}>

                  Shop Now <ShoppingBag className="ml-2 h-4 w-4" />

                </Button>

              </Link>

              <Link to="/sell">

                <Button size="lg" variant="outline" className={`text-base px-8 ${theme === 'dark' ? 'border-primary text-primary hover:bg-primary/10' : 'border-green-600 text-green-600 hover:bg-green-50'}`}>

                  Start Selling <Gift className="ml-2 h-4 w-4" />

                </Button>

              </Link>

            </div>

          </div>

        </div>

      </section>



      {/* Donor Recognition Leaderboard */}

      <section className="py-20 bg-background relative overflow-hidden">

        {/* Background Pattern */}

        <div className="absolute inset-0 opacity-10">

          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full filter blur-3xl animate-pulse"></div>

          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full filter blur-3xl animate-pulse delay-1000"></div>

        </div>

        

        <div className="container mx-auto px-4 relative z-10">

          {/* Section Header */}

          <div className="text-center mb-16">

            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/20 text-primary rounded-full mb-6">

              <Trophy className="h-5 w-5" />

              <span className="font-semibold text-sm">Hall of Fame</span>

            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">

              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">

                Top Donors

              </span>

            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">

              Celebrating our generous donors who make a difference in the community. 

              <br className="hidden md:block" />

              Join the leaderboard by donating items to causes that matter!

            </p>

            <Button 

              onClick={fetchDonorData} 

              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"

            >

              <TrendingUp className="h-4 w-4 mr-2" />

              Refresh Leaderboard

            </Button>

          </div>

          

          {topDonors.length === 0 ? (

            <div className="text-center py-16">

              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mb-6">

                <Trophy className="h-12 w-12 text-primary" />

              </div>

              <h3 className="text-2xl font-bold text-foreground mb-3">Be the First Champion!</h3>

              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">

                Start donating to see your name here and earn recognition

              </p>

              <Link to="/donate">

                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-8 py-3 text-lg font-semibold shadow-lg transform transition-all duration-300 hover:scale-105">

                  <Heart className="h-5 w-5 mr-2" />

                  Make Your First Donation

                </Button>

              </Link>

            </div>

          ) : (

            <>

              {/* Top 3 Podium */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

                {/* 2nd Place */}

                {topDonors[1] && (

                  <div className="text-center">

                    <div className="bg-gradient-to-br from-secondary to-muted rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105">

                      <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">

                        <span className="text-2xl">🥈</span>

                      </div>

                      <div className="text-3xl font-bold text-foreground mb-2">{topDonors[1].name}</div>

                      <div className="space-y-2 text-muted-foreground">

                        <div className="flex items-center justify-center gap-2">

                          <Package className="h-4 w-4" />

                          <span className="font-semibold">{topDonors[1].totalItems}</span> items

                        </div>

                        <div className="flex items-center justify-center gap-2">

                          <Heart className="h-4 w-4" />

                          <span className="font-semibold">{topDonors[1].totalDonations}</span> donations

                        </div>

                      </div>

                    </div>

                    <div className="text-2xl font-bold text-accent mt-4">2nd Place</div>

                  </div>

                )}

                

                {/* 1st Place */}

                {topDonors[0] && (

                  <div className="text-center md:transform md:scale-110">

                    <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 relative">

                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">

                        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">

                          👑 Champion

                        </div>

                      </div>

                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mb-4 shadow-lg">

                        <span className="text-3xl">👑</span>

                      </div>

                      <div className="text-3xl font-bold text-foreground mb-2">{topDonors[0].name}</div>

                      <div className="space-y-2 text-muted-foreground">

                        <div className="flex items-center justify-center gap-2">

                          <Package className="h-4 w-4" />

                          <span className="font-semibold">{topDonors[0].totalItems}</span> items

                        </div>

                        <div className="flex items-center justify-center gap-2">

                          <Heart className="h-4 w-4" />

                          <span className="font-semibold">{topDonors[0].totalDonations}</span> donations

                        </div>

                      </div>

                    </div>

                    <div className="text-2xl font-bold text-primary mt-4">🏆 Top Donor</div>

                  </div>

                )}

                

                {/* 3rd Place */}

                {topDonors[2] && (

                  <div className="text-center">

                    <div className="bg-gradient-to-br from-warm to-muted rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105">

                      <div className="inline-flex items-center justify-center w-16 h-16 bg-warm rounded-full mb-4">

                        <span className="text-2xl">🥉</span>

                      </div>

                      <div className="text-3xl font-bold text-foreground mb-2">{topDonors[2].name}</div>

                      <div className="space-y-2 text-muted-foreground">

                        <div className="flex items-center justify-center gap-2">

                          <Package className="h-4 w-4" />

                          <span className="font-semibold">{topDonors[2].totalItems}</span> items

                        </div>

                        <div className="flex items-center justify-center gap-2">

                          <Heart className="h-4 w-4" />

                          <span className="font-semibold">{topDonors[2].totalDonations}</span> donations

                        </div>

                      </div>

                    </div>

                    <div className="text-2xl font-bold text-warm mt-4">3rd Place</div>

                  </div>

                )}

              </div>

              

              {/* Other Donors */}

              {topDonors.length > 3 && (

                <div className="text-center mb-12">

                  <h3 className="text-xl font-semibold text-foreground mb-6">Honorable Mentions</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    {topDonors.slice(3, 7).map((donor, index) => (

                      <div key={donor.id || `donor-${index}`} className="bg-card rounded-xl p-6 shadow-md transform transition-all duration-300 hover:scale-105">

                        <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3">

                          <span className="text-primary-foreground font-bold">{index + 4}</span>

                        </div>

                        <h4 className="font-bold text-foreground mb-2">{donor.name}</h4>

                        <div className="text-sm text-muted-foreground space-y-1">

                          <div className="flex items-center justify-center gap-1">

                            <Package className="h-3 w-3" />

                            <span>{donor.totalItems} items</span>

                          </div>

                          <div className="flex items-center justify-center gap-1">

                            <Heart className="h-3 w-3" />

                            <span>{donor.totalDonations} donations</span>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </>

          )}

          

          {/* Call to Action */}

          <div className="text-center mt-12">

            <Link to="/leaderboard">

              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg font-semibold">

                View Full Leaderboard <ArrowRight className="ml-2 h-5 w-5" />

              </Button>

            </Link>

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

      {userProfile?.role !== 'ngo' && (

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

      )}



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

      {userProfile?.role !== 'ngo' && (

        <section className="py-20">

          <div className="container mx-auto px-4 text-center">

            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Thrift?</h2>

            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of conscious shoppers making sustainable fashion choices.</p>

            <Link to="/get-started">

              <Button size="lg" className="px-10 text-base">Get Started</Button>

            </Link>

          </div>

        </section>

      )}



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

