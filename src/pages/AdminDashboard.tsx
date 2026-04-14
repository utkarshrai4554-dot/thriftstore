import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BarChart3, Users, Package, Gift, Truck, TrendingUp,
  CheckCircle, XCircle, DollarSign, ShoppingBag, Eye, X
} from "lucide-react";
import { collection, query, where, orderBy, getDocs, getDoc, doc as docRef, setDoc, deleteDoc, updateDoc, getCountFromServer, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import DeliveryAgentApproval from "@/components/DeliveryAgentApproval";

interface PendingItem {
  id: string;
  title: string;
  type: 'product' | 'donation';
  sellerInfo?: {
    displayName: string;
    email: string;
  };
  donorInfo?: {
    displayName: string;
    email: string;
    phone?: string;
  };
  status: string;
  items?: string;
  cause?: string;
  category?: string;
  urgency?: string;
  quantity?: number;
  pickupAddress?: string;
  images?: any[];
  description?: string;
  createdAt: Date;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
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

  const handleApproveProduct = async (itemId: string) => {
    console.log('🟢 Approve button clicked for item:', itemId);
    console.log('👤 Current user:', user);
    
    if (!user) {
      console.error('❌ No user logged in');
      toast.error('Please login to approve items');
      return;
    }
    
    try {
      // Find the item in pendingItems to determine its type
      const item = pendingItems.find(p => p.id === itemId);
      if (!item) {
        console.error('❌ Item not found in pendingItems');
        toast.error('Item not found');
        return;
      }
      
      console.log('📦 Item found:', item);
      
      if (item.type === 'product') {
        // Handle product approval
        console.log('🔄 Approving product...');
        
        // Get product from sellProducts collection
        const sellProductRef = docRef(db, 'sellProducts', itemId);
        const sellProductDoc = await getDoc(sellProductRef);
        
        if (!sellProductDoc.exists()) {
          console.error('❌ Product not found in sellProducts');
          toast.error('Product not found');
          return;
        }
        
        const productData = sellProductDoc.data();
        console.log('📦 Product data found:', productData);
        
        // Move to products collection with approved status
        const approvedProductRef = docRef(db, 'products', itemId);
        await setDoc(approvedProductRef, {
          ...productData,
          status: 'approved',
          approvedBy: user.uid,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Delete from sellProducts
        await deleteDoc(sellProductRef);
        
        console.log('✅ Product approved successfully');
        toast.success('Product approved successfully!');
        
      } else if (item.type === 'donation') {
        // Handle donation approval
        console.log('🔄 Approving donation...');
        
        // Get donation from donations collection
        const donationRef = docRef(db, 'donations', itemId);
        const donationDoc = await getDoc(donationRef);
        
        if (!donationDoc.exists()) {
          console.error('❌ Donation not found in donations');
          toast.error('Donation not found');
          return;
        }
        
        const donationData = donationDoc.data();
        console.log('📦 Donation data found:', donationData);
        
        // Update donation status to approved
        await updateDoc(donationRef, {
          status: 'approved',
          approvedBy: user.uid,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Donation approved successfully');
        toast.success('Donation approved successfully!');
      }
      
      // Refresh pending items
      await fetchPendingItemsFunction();
      
    } catch (error) {
      console.error('❌ Error approving item:', error);
      toast.error('Failed to approve item');
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
      const updatedProducts = pendingItems.filter(p => p.id !== productId);
      setPendingItems(updatedProducts);
      
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

  const fetchPendingItemsFunction = async () => {
    try {
      setLoading(true);
      console.log('🔍 AdminDashboard: Loading pending products...');
      
      // Fetch pending products ONLY
      const productsRef = collection(db, 'sellProducts');
      const productsQuery = query(
        productsRef,
        where('status', '==', 'pending')
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      // Process only products
      const allItems: PendingItem[] = [];
      
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        allItems.push({
          id: doc.id,
          title: data.title || 'Unknown Product',
          type: 'product',
          sellerInfo: {
            displayName: data.sellerName || 'Unknown Seller',
            email: data.sellerEmail || 'N/A'
          },
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      // Sort by creation date (newest first)
      const sortedItems = allItems.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      console.log(`📊 AdminDashboard: Found ${sortedItems.length} pending products`);
      
      setPendingItems(sortedItems);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast.error('Failed to fetch pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPendingItemsFunction();
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1 text-green-600">Admin Dashboard</h1>
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
            <TabsTrigger value="ngo-approval">NGO Approval</TabsTrigger>
            <TabsTrigger value="assign-donation">Assign Donation</TabsTrigger>
            <TabsTrigger value="assign-delivery">Assign Delivery</TabsTrigger>
            <TabsTrigger value="delivery-requests">Delivery Agent Requests</TabsTrigger>
            
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Items Awaiting Review</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2 text-sm">Loading pending items...</p>
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Pending Items</h3>
                    <p className="text-muted-foreground text-sm">All items have been reviewed.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y">
                      {pendingItems.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{p.title}</p>
                              {p.type === 'donation' ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Donation</Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">Product</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p.type === 'donation' 
                                ? `by ${p.donorInfo?.displayName || 'Anonymous Donor'}`
                                : `by ${p.sellerInfo?.displayName || 'Unknown Seller'}`
                              }
                            </p>
                            {p.type === 'donation' && p.cause && (
                              <p className="text-xs text-muted-foreground">
                                Cause: {p.cause}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {p.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => setSelectedItem(p)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t space-y-2">
                                          </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ngo-approval" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"  style={{ color: 'hsl(var(--dark-brown))' }}>
                  <Users className="h-5 w-5" />
                  NGO Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg"  style={{ color: 'hsl(var(--dark-brown))' }}>NGO Registrations</h3>
                      <p className="text-sm text-muted-foreground">Review and approve NGO registration requests</p>
                    </div>
                  </div>
                  <Link to="/admin/ngo-approval">
                    <Button className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Manage NGO Registrations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign-donation" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="bg-muted border-border">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'hsl(var(--dark-brown))' }}>
                  <Gift className="h-5 w-5 text-warm" />
                  Donation Assignment Center
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-card">
                <div className="bg-muted border border-border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-warm/20 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-warm-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--dark-brown))' }}>Assign Donations</h3>
                      <p className="text-sm text-muted-foreground">View and assign donations to approved NGOs</p>
                    </div>
                  </div>
                  <Link to="/admin/donation-assignment">
                    <Button className="w-full bg-warm hover:bg-warm/90 text-warm-foreground">
                      <Truck className="h-4 w-4 mr-2" />
                      Go to Donation Assignment
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign-delivery" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="bg-muted border-border">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'hsl(var(--dark-brown))' }}>
                  <Truck className="h-5 w-5 text-warm" />
                  Delivery Assignment Center
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-card">
                <div className="bg-muted border border-border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-warm/20 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-warm-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg" style={{ color: 'hsl(var(--dark-brown))' }}>Assign Delivery Partners</h3>
                      <p className="text-sm text-muted-foreground">View and assign delivery partners to paid orders</p>
                    </div>
                  </div>
                  <Link to="/admin/orders">
                    <Button className="w-full bg-warm hover:bg-warm/90 text-warm-foreground">
                      <Truck className="h-4 w-4 mr-2" />
                      Go to Delivery Assignment
                    </Button>
                  </Link>
                </div>
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

          <TabsContent value="delivery-requests" className="mt-4">
            <DeliveryAgentApproval />
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

        {/* Item Details Modal */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl [&_[data-radix-dialog-close]]:hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-black">Item Details</DialogTitle>
                <div 
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 flex items-center justify-center border border-black rounded cursor-pointer hover:bg-black hover:text-white transition-colors"
                  style={{ color: 'black' }}
                >
                  <X className="h-4 w-4" style={{ color: 'black' }} />
                </div>
              </div>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title</label>
                    <p className="font-semibold text-black">{selectedItem.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <Badge className={selectedItem.type === 'donation' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {selectedItem.type === 'donation' ? 'Donation' : 'Product'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="capitalize text-black">{selectedItem.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="text-black">{selectedItem.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedItem.type === 'product' && selectedItem.sellerInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Seller Information</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>Name:</strong> {selectedItem.sellerInfo.displayName}</p>
                      <p><strong>Email:</strong> {selectedItem.sellerInfo.email}</p>
                    </div>
                  </div>
                )}

                {selectedItem.type === 'donation' && selectedItem.donorInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Donor Information</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>Name:</strong> {selectedItem.donorInfo.displayName}</p>
                      <p><strong>Email:</strong> {selectedItem.donorInfo.email}</p>
                      {selectedItem.donorInfo.phone && (
                        <p><strong>Phone:</strong> {selectedItem.donorInfo.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.items && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Items</label>
                    <p>{selectedItem.items}</p>
                  </div>
                )}

                {selectedItem.quantity && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantity</label>
                    <p>{selectedItem.quantity}</p>
                  </div>
                )}

                {selectedItem.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="capitalize">{selectedItem.category}</p>
                  </div>
                )}

                {selectedItem.cause && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cause</label>
                    <p>{selectedItem.cause}</p>
                  </div>
                )}

                {selectedItem.urgency && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Urgency</label>
                    <Badge className={
                      selectedItem.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                      selectedItem.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedItem.urgency === 'low' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {selectedItem.urgency}
                    </Badge>
                  </div>
                )}

                {selectedItem.pickupAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pickup Address</label>
                    <p>{selectedItem.pickupAddress}</p>
                  </div>
                )}

                {selectedItem.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-700">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Images</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedItem.images.map((image, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={`Item image ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => handleApproveProduct(selectedItem.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleRejectProduct(selectedItem.id);
                      setSelectedItem(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
