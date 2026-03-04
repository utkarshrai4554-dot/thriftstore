import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BarChart3, Users, Package, Gift, Truck, TrendingUp,
  CheckCircle, XCircle, DollarSign, ShoppingBag, Eye
} from "lucide-react";
import { collection, query, where, orderBy, getDocs, getDoc, doc as docRef, setDoc, deleteDoc, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface PendingProduct {
  id: string;
  title: string;
  sellerInfo?: {
    displayName: string;
    email: string;
  };
  status: string;
  createdAt: Date;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Sales", value: "₹0", icon: DollarSign, change: "+0%" },
    { label: "Active Users", value: "0", icon: Users, change: "+0%" },
    { label: "Products Listed", value: "0", icon: ShoppingBag, change: "+0%" },
    { label: "Donations", value: "0", icon: Gift, change: "+0%" },
  ]);
  
  // Tab counts
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [allCount, setAllCount] = useState(0);

  const topProducts = [
    { name: "Vintage Leather Jacket", sales: 12 },
    { name: "Art Deco Vase", sales: 8 },
    { name: "Retro Gold Necklace", sales: 15 },
    { name: "Classic Canvas Sneakers", sales: 6 },
  ];

  const deliveryAgents = [
    { name: "David R.", status: "online", deliveries: 23 },
    { name: "Lisa P.", status: "online", deliveries: 18 },
    { name: "Tom W.", status: "offline", deliveries: 31 },
  ];

  const handleApproveProduct = async (productId: string) => {
    console.log('🟢 Approve button clicked for product:', productId);
    console.log('👤 Current user:', user);
    
    if (!user) {
      console.error('❌ No user logged in');
      toast.error('Please login to approve products');
      return;
    }
    
    try {
      // Get product from sellProducts collection
      const sellProductRef = docRef(db, 'sellProducts', productId);
      const sellProductDoc = await getDoc(sellProductRef);
      
      if (!sellProductDoc.exists()) {
        console.error('❌ Product not found in sellProducts');
        toast.error('Product not found');
        return;
      }
      
      const productData = sellProductDoc.data();
      console.log('📦 Product data found:', productData);
      
      // Move to products collection with approved status
      console.log('🔄 Moving to products collection...');
      const approvedProductRef = docRef(db, 'products', productId);
      await setDoc(approvedProductRef, {
        ...productData,
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Successfully added to products collection');
      
      // Move to acceptedProducts collection
      console.log('🔄 Moving to acceptedProducts collection...');
      try {
        const acceptedProductRef = docRef(db, 'acceptedProducts', productId);
        await setDoc(acceptedProductRef, {
          ...productData,
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Successfully added to acceptedProducts collection');
      } catch (acceptedProductsError) {
        console.warn('⚠️ Failed to add to acceptedProducts collection:', acceptedProductsError);
        // Continue with the process even if acceptedProducts fails
      }
      
      // Delete from sellProducts collection
      console.log('🗑️ Deleting from sellProducts collection...');
      await deleteDoc(sellProductRef);
      console.log('✅ Successfully deleted from sellProducts');
      
      toast.success('Product approved and moved to shop');
      
      // Refresh the pending products list
      const updatedProducts = pendingProducts.filter(p => p.id !== productId);
      setPendingProducts(updatedProducts);
      
      // Refresh stats to update product count
      fetchStats();
    } catch (error) {
      console.error('❌ Error approving product:', error);
      toast.error(`Failed to approve product: ${error.message}`);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      // Get the product from sellProducts collection
      const sellProductRef = docRef(db, 'sellProducts', productId);
      const sellProductDoc = await getDoc(sellProductRef);
      
      if (!sellProductDoc.exists()) {
        toast.error('Product not found');
        return;
      }
      
      const productData = sellProductDoc.data();
      
      // Move to rejectedProducts collection
      const rejectedProductRef = docRef(db, 'rejectedProducts', productId);
      await setDoc(rejectedProductRef, {
        ...productData,
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Delete from sellProducts collection
      await deleteDoc(sellProductRef);
      
      toast.success('Product rejected and moved to rejected collection');
      
      // Refresh the pending products list
      const updatedProducts = pendingProducts.filter(p => p.id !== productId);
      setPendingProducts(updatedProducts);
      
      // Refresh stats to update product count
      fetchStats();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Failed to reject product');
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching dashboard stats...');
      
      // Fetch total users count
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getCountFromServer(usersRef);
      const totalUsers = usersSnapshot.data().count;

      // Fetch approved products count (from products collection)
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getCountFromServer(productsRef);
      const totalApproved = productsSnapshot.data().count;

      // Fetch rejected products count (from rejectedProducts collection)
      let totalRejected = 0;
      try {
        const rejectedRef = collection(db, 'rejectedProducts');
        const rejectedSnapshot = await getCountFromServer(rejectedRef);
        totalRejected = rejectedSnapshot.data().count;
      } catch (error) {
        console.log('rejectedProducts collection not found, count will be 0');
      }

      // Fetch sellProducts count (pending + any other statuses)
      let totalSellProducts = 0;
      try {
        const sellProductsRef = collection(db, 'sellProducts');
        const sellProductsSnapshot = await getCountFromServer(sellProductsRef);
        totalSellProducts = sellProductsSnapshot.data().count;
      } catch (error) {
        console.log('sellProducts collection not found, count will be 0');
      }

      // Fetch donations count (assuming donations are stored in a donations collection)
      let totalDonations = 0;
      try {
        const donationsRef = collection(db, 'donations');
        const donationsSnapshot = await getCountFromServer(donationsRef);
        totalDonations = donationsSnapshot.data().count;
      } catch (error) {
        console.log('Donations collection not found, keeping as 0');
      }

      // For total sales, we'll keep it as 0 for now (can be implemented later)
      const totalSales = 0;
      
      // Calculate "All" count = approved + rejected + sellProducts
      const totalCount = totalApproved + totalRejected + totalSellProducts;

      console.log('📈 Stats fetched:', {
        totalUsers,
        totalApproved,
        totalRejected,
        totalSellProducts,
        totalCount,
        totalDonations
      });

      console.log('🔍 Checking collections status:');
      console.log('- products collection:', totalApproved > 0 ? 'has data' : 'empty');
      console.log('- rejectedProducts collection:', totalRejected > 0 ? 'has data' : 'empty');
      console.log('- sellProducts collection:', totalSellProducts > 0 ? 'has data' : 'empty');

      setStats([
        { label: "Total Sales", value: `₹${totalSales.toLocaleString()}`, icon: DollarSign, change: "+0%" },
        { label: "Active Users", value: totalUsers.toLocaleString(), icon: Users, change: "+0%" },
        { label: "Products Listed", value: totalApproved.toLocaleString(), icon: ShoppingBag, change: "+0%" },
        { label: "Donations", value: totalDonations.toLocaleString(), icon: Gift, change: "+0%" },
      ]);

      // Update tab counts with correct logic
      setPendingCount(totalSellProducts); // sellProducts contains pending items
      setApprovedCount(totalApproved);   // products collection contains approved items
      setRejectedCount(totalRejected);   // rejectedProducts collection contains rejected items
      setAllCount(totalCount);            // All = approved + rejected + sellProducts

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchPendingProducts = async () => {
      try {
        setLoading(true);
        console.log('🔍 AdminDashboard: Loading from sellProducts...');
        
        const productsRef = collection(db, 'sellProducts');
        const q = query(
          productsRef,
          where('status', '==', 'pending')
        );
        
        // Sort in JavaScript instead of Firestore query to avoid index requirement
        const querySnapshot = await getDocs(q);
        const sortedProducts = querySnapshot.docs.sort((a, b) => 
          (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0)
        );
        console.log(`📊 AdminDashboard: Found ${sortedProducts.length} pending products`);
        
        const products: PendingProduct[] = [];
        
        for (const doc of sortedProducts) {
          const data = doc.data();
          console.log('📦 AdminDashboard: Product data:', data);
          
          // Get seller information
          let sellerInfo = undefined;
          try {
            const sellerDoc = await getDoc(docRef(db, 'users', data.sellerId));
            if (sellerDoc.exists()) {
              const sellerData = sellerDoc.data() as any;
              sellerInfo = {
                displayName: sellerData?.displayName || 'Unknown',
                email: sellerData?.email || 'Unknown'
              };
            }
          } catch (error) {
            console.error('Error fetching seller info:', error);
          }
          
          products.push({
            id: doc.id,
            title: data.title || 'Unknown Product',
            sellerInfo,
            status: data.status || 'pending',
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
        
        console.log(`✅ AdminDashboard: Processed ${products.length} products`);
        setPendingProducts(products);
      } catch (error) {
        console.error('Error fetching pending products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingProducts();
    fetchStats();
  }, []);
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your thrift store platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-success">{s.change}</Badge>
                </div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Pending Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Products Awaiting Review</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2 text-sm">Loading pending products...</p>
                  </div>
                ) : pendingProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Pending Products</h3>
                    <p className="text-muted-foreground text-sm">All products have been reviewed.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y">
                      {pendingProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="font-medium text-sm">{p.title}</p>
                            <p className="text-xs text-muted-foreground">
                              by {p.sellerInfo?.displayName || 'Unknown Seller'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleApproveProduct(p.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRejectProduct(p.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Link to="/admin/products">
                        <Button className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View All Product Requests ({pendingProducts.length})
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <p className="font-medium text-sm">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {p.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {deliveryAgents.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                          {a.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.deliveries} deliveries</p>
                        </div>
                      </div>
                      <Badge variant={a.status === "online" ? "default" : "outline"}>
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
