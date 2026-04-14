import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Package, 
  Eye, 
  Check, 
  X, 
  Clock,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { doc, updateDoc, collection, getDocs, query, where, orderBy, getDoc, setDoc, deleteDoc, getCountFromServer, doc as documentRef } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProductRequest {
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
  sellerInfo?: {
    displayName: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DonationRequest {
  id: string;
  title: string;
  type: 'product' | 'donation';
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  pickupAddress: string;
  items: string;
  description: string;
  cause: string;
  category: string;
  urgency: string;
  quantity: number;
  images: any[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

type PendingItem = ProductRequest | DonationRequest;

const AdminProductApproval = () => {
  const { user } = useAuth();
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedProduct, setSelectedProduct] = useState<ProductRequest | DonationRequest | null>(null);
  
  // Tab counts for efficiency
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [allCount, setAllCount] = useState(0);

  // Helper function to format price in Indian currency
  const formatIndianPrice = (price: number | undefined | null) => {
    if (!price || isNaN(price)) return '₹0';
    
    // Convert to Indian number format
    const formattedPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    return formattedPrice;
  };

  const fetchTabCounts = async () => {
    try {
      console.log('📊 Fetching tab counts...');
      
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

      // Fetch sellProducts count (pending items)
      let totalPending = 0;
      try {
        const sellProductsRef = collection(db, 'sellProducts');
        const sellProductsSnapshot = await getCountFromServer(sellProductsRef);
        totalPending = sellProductsSnapshot.data().count;
      } catch (error) {
        console.log('sellProducts collection not found, count will be 0');
      }

      // Calculate "All" count = approved + rejected + pending
      const totalCount = totalApproved + totalRejected + totalPending;

      console.log('📈 Tab counts updated:', {
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        all: totalCount
      });

      setPendingCount(totalPending);
      setApprovedCount(totalApproved);
      setRejectedCount(totalRejected);
      setAllCount(totalCount);

    } catch (error) {
      console.error('Error fetching tab counts:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Check if user is admin
    const checkAdminRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData || userData.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          return;
        }
        
        loadProductRequests();
        fetchTabCounts();
      } catch (error) {
        console.error('Error checking admin role:', error);
        toast.error('Failed to verify admin privileges');
      }
    };

    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProductRequests();
    }
  }, [filter, user]);

  const loadProductRequests = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Loading pending requests for filter: ${filter}...`);
      
      let products: ProductRequest[] = [];
      let donations: DonationRequest[] = [];
      
      if (filter === 'pending' || filter === 'all') {
        // Fetch pending products from sellProducts collection
        const productsRef = collection(db, 'sellProducts');
        const productsQuery = query(productsRef, where('status', '==', 'pending'));
        const productsSnapshot = await getDocs(productsQuery);
        
        for (const doc of productsSnapshot.docs) {
          const productData = doc.data();
          // Get seller information
          let sellerInfo = undefined;
          try {
            const sellerDoc = await getDoc(documentRef(db, 'users', productData.sellerId));
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
            title: productData.title || 'Unknown Product',
            brand: productData.brand || 'Unknown',
            category: productData.category || 'Other',
            color: productData.color,
            size: productData.size,
            condition: productData.condition || 'Good',
            originalPrice: productData.originalPrice,
            sellingPrice: productData.sellingPrice,
            description: productData.description || '',
            images: productData.images || [],
            sellerId: productData.sellerId,
            sellerInfo,
            status: productData.status || 'pending',
            views: productData.views || 0,
            likes: productData.likes || 0,
            createdAt: productData.createdAt?.toDate() || new Date(),
            updatedAt: productData.updatedAt?.toDate() || new Date()
          });
        }
        
        // Fetch pending donations from donations collection
        const donationsRef = collection(db, 'donations');
        const donationsQuery = query(donationsRef, where('status', '==', 'pending'));
        const donationsSnapshot = await getDocs(donationsQuery);
        
        // Removed problematic loop
      } else if (filter === 'rejected') {
        // Fetch from rejectedProducts collection
        const productsRef = collection(db, 'rejectedProducts');
        const querySnapshot = await getDocs(productsRef);
        
        // Sort in JavaScript by rejectedAt
        const sortedDocs = querySnapshot.docs.sort((a, b) => 
          (b.data().rejectedAt?.toMillis() || 0) - (a.data().rejectedAt?.toMillis() || 0)
        );
        
        // Process donations - removed for now
        
        for (const doc of sortedDocs) {
          const productData = doc.data();
          // Get seller information
          let sellerInfo = undefined;
          try {
            const sellerDoc = await getDoc(documentRef(db, 'users', productData.sellerId));
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
            title: productData.title || '',
            brand: productData.brand || '',
            category: productData.category || '',
            color: productData.color,
            size: productData.size,
            condition: productData.condition || 'Good',
            originalPrice: productData.originalPrice,
            sellingPrice: productData.sellingPrice || 0,
            description: productData.description || '',
            images: productData.images || [],
            sellerId: productData.sellerId || '',
            sellerInfo,
            status: 'rejected',
            views: productData.views || 0,
            likes: productData.likes || 0,
            createdAt: productData.createdAt?.toDate() || new Date(),
            updatedAt: productData.updatedAt?.toDate() || new Date()
          });
        }
      } else if (filter === 'all') {
        // Fetch from all collections and combine
        // 1. Get pending products
        const sellProductsRef = collection(db, 'sellProducts');
        const pendingSnapshot = await getDocs(sellProductsRef);
        
        // Sort in JavaScript by createdAt
        const sortedPendingDocs = pendingSnapshot.docs.sort((a, b) => 
          (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0)
        );
        
        for (const doc of sortedPendingDocs) {
          const productData = doc.data();
          let sellerInfo = undefined;
          try {
            const sellerDoc = await getDoc(documentRef(db, 'users', productData.sellerId));
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
            title: productData.title || '',
            brand: productData.brand || '',
            category: productData.category || '',
            color: productData.color,
            size: productData.size,
            condition: productData.condition || 'Good',
            originalPrice: productData.originalPrice,
            sellingPrice: productData.sellingPrice || 0,
            description: productData.description || '',
            images: productData.images || [],
            sellerId: productData.sellerId || '',
            sellerInfo,
            status: productData.status || 'pending',
            views: productData.views || 0,
            likes: productData.likes || 0,
            createdAt: productData.createdAt?.toDate() || new Date(),
            updatedAt: productData.updatedAt?.toDate() || new Date()
          });
        }
        
        // 2. Get approved products
        const approvedProductsRef = collection(db, 'products');
        const approvedSnapshot = await getDocs(approvedProductsRef);
        
        // Sort in JavaScript by approvedAt
        const sortedApprovedDocs = approvedSnapshot.docs.sort((a, b) => 
          (b.data().approvedAt?.toMillis() || 0) - (a.data().approvedAt?.toMillis() || 0)
        );
        
        for (const doc of sortedApprovedDocs) {
          const productData = doc.data();
          let sellerInfo = undefined;
          try {
            const sellerDoc = await getDoc(documentRef(db, 'users', productData.sellerId));
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
            title: productData.title || '',
            brand: productData.brand || '',
            category: productData.category || '',
            color: productData.color,
            size: productData.size,
            condition: productData.condition || 'Good',
            originalPrice: productData.originalPrice,
            sellingPrice: productData.sellingPrice || 0,
            description: productData.description || '',
            images: productData.images || [],
            sellerId: productData.sellerId || '',
            sellerInfo,
            status: 'approved',
            views: productData.views || 0,
            likes: productData.likes || 0,
            createdAt: productData.createdAt?.toDate() || new Date(),
            updatedAt: productData.updatedAt?.toDate() || new Date()
          });
        }
        
        // 3. Get rejected products
        const rejectedProductsRef = collection(db, 'rejectedProducts');
        const rejectedSnapshot = await getDocs(query(rejectedProductsRef, orderBy('rejectedAt', 'desc')));
        
        for (const productDoc of rejectedSnapshot.docs) {
          const productData = productDoc.data();
          let sellerInfo = undefined;
          try {
            const sellerDoc = await getDoc(documentRef(db, 'users', productData.sellerId));
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
            title: productData.title || '',
            brand: productData.brand || '',
            category: productData.category || '',
            color: productData.color,
            size: productData.size,
            condition: productData.condition || 'Good',
            originalPrice: productData.originalPrice,
            sellingPrice: productData.sellingPrice || 0,
            description: productData.description || '',
            images: productData.images || [],
            sellerId: productData.sellerId || '',
            sellerInfo,
            status: 'rejected',
            views: productData.views || 0,
            likes: productData.likes || 0,
            createdAt: productData.createdAt?.toDate() || new Date(),
            updatedAt: productData.updatedAt?.toDate() || new Date()
          });
        }
      }
      
      console.log(`✅ Loaded ${products.length} products for filter: ${filter}`);
      setProductRequests(products);
      
    } catch (error) {
      console.error('Error loading product requests:', error);
      toast.error('Failed to load product requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      // Get product from sellProducts collection
      const sellProductRef = doc(db, 'sellProducts', productId);
      const sellProductDoc = await getDoc(sellProductRef);
      
      if (!sellProductDoc.exists()) {
        toast.error('Product not found');
        return;
      }
      
      const productData = sellProductDoc.data();
      
      // Move to deliveryAssignment collection for delivery agent assignment
      const deliveryAssignmentRef = doc(db, 'deliveryAssignment', productId);
      await setDoc(deliveryAssignmentRef, {
        ...productData,
        status: 'awaiting-assignment',
        approvedAt: new Date(),
        approvedBy: user?.uid,
        updatedAt: new Date()
      });
      
      // Delete from sellProducts collection
      await deleteDoc(sellProductRef);
      
      toast.success('Product approved and moved to delivery assignment');
      
      loadProductRequests();
      fetchTabCounts();
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Failed to approve product');
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      // Get the product from sellProducts collection
      const sellProductRef = doc(db, 'sellProducts', productId);
      const sellProductDoc = await getDoc(sellProductRef);
      
      if (!sellProductDoc.exists()) {
        toast.error('Product not found');
        return;
      }
      
      const productData = sellProductDoc.data();
      
      // Move to rejectedProducts collection
      const rejectedProductRef = doc(db, 'rejectedProducts', productId);
      await setDoc(rejectedProductRef, {
        ...productData,
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Delete from sellProducts collection
      await deleteDoc(sellProductRef);
      
      toast.success('Product rejected and moved to rejected collection');
      
      loadProductRequests();
      fetchTabCounts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Failed to reject product');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredProducts = productRequests.filter(product => 
    filter === 'all' || product.status === filter
  );

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <AlertTriangle className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Product Approval Dashboard</h1>
            <p className="text-muted-foreground">Review and manage product submissions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved ({approvedCount})
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilter('rejected')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejected ({rejectedCount})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All ({allCount})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading product requests...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No {filter === 'all' ? '' : filter} products</h3>
            <p className="text-muted-foreground">
              {filter === 'pending' ? 'No products waiting for approval.' : 
               filter === 'approved' ? 'No approved products found.' :
               filter === 'rejected' ? 'No rejected products found.' :
               'No products found.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(product.status)}
                            <Badge variant="outline" className="capitalize">{product.category}</Badge>
                            <Badge variant="outline" className="capitalize">{product.condition}</Badge>
                            {product.size && <Badge variant="outline">{product.size}</Badge>}
                            {product.color && <Badge variant="outline">{product.color}</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatIndianPrice(product.sellingPrice)}
                          </div>
                          {product.originalPrice && product.originalPrice > product.sellingPrice && (
                            <div className="text-sm text-muted-foreground line-through">
                              {formatIndianPrice(product.originalPrice)}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{product.sellerInfo?.displayName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{product.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{product.views} views</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {product.status === 'pending' && (
                          <Button
                            onClick={() => handleApproveProduct(product.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        {product.status === 'pending' && (
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectProduct(product.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            console.log('Details button clicked for product:', product);
                            setSelectedProduct(product);
                          }}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-black">Product Details</span>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${selectedProduct.title} ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-xl mb-2">{selectedProduct.title}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        {getStatusBadge(selectedProduct.status)}
                        <Badge variant="outline" className="capitalize">{selectedProduct.category}</Badge>
                        {'condition' in selectedProduct && (
                          <Badge variant="outline" className="capitalize">{selectedProduct.condition}</Badge>
                        )}
                      </div>
                    </div>

                    {'sellingPrice' in selectedProduct && (
                      <div>
                        <h4 className="font-semibold mb-2">Price</h4>
                        <div className="text-2xl font-bold text-green-600">
                          {formatIndianPrice(selectedProduct.sellingPrice)}
                        </div>
                        {'originalPrice' in selectedProduct && selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.sellingPrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            Original: {formatIndianPrice(selectedProduct.originalPrice)}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-muted-foreground">{selectedProduct.description}</p>
                    </div>

                    {'sellerInfo' in selectedProduct && (
                      <div>
                        <h4 className="font-semibold mb-2">Seller Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {selectedProduct.sellerInfo?.displayName || 'Unknown'}</p>
                          <p><strong>Email:</strong> {selectedProduct.sellerInfo?.email || 'Unknown'}</p>
                          <p><strong>ID:</strong> {'sellerId' in selectedProduct ? selectedProduct.sellerId : 'Unknown'}</p>
                        </div>
                      </div>
                    )}

                    {'brand' in selectedProduct && (
                      <div>
                        <h4 className="font-semibold mb-2">Product Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Brand:</strong> {selectedProduct.brand}</p>
                          {'size' in selectedProduct && (
                            <p><strong>Size:</strong> {selectedProduct.size || 'N/A'}</p>
                          )}
                          {'color' in selectedProduct && (
                            <p><strong>Color:</strong> {selectedProduct.color || 'N/A'}</p>
                          )}
                          {'condition' in selectedProduct && (
                            <p><strong>Condition:</strong> {selectedProduct.condition}</p>
                          )}
                          {'views' in selectedProduct && (
                            <p><strong>Views:</strong> {selectedProduct.views}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {'donorName' in selectedProduct && (
                      <div>
                        <h4 className="font-semibold mb-2">Donor Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {selectedProduct.donorName}</p>
                          <p><strong>Email:</strong> {selectedProduct.donorEmail}</p>
                          <p><strong>Phone:</strong> {selectedProduct.donorPhone}</p>
                          <p><strong>Pickup Address:</strong> {selectedProduct.pickupAddress}</p>
                        </div>
                      </div>
                    )}

                    {'cause' in selectedProduct && (
                      <div>
                        <h4 className="font-semibold mb-2">Donation Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Cause:</strong> {selectedProduct.cause}</p>
                          <p><strong>Items:</strong> {selectedProduct.items}</p>
                          <p><strong>Quantity:</strong> {selectedProduct.quantity}</p>
                          <p><strong>Urgency:</strong> {selectedProduct.urgency}</p>
                        </div>
                      </div>
                    )}

                    {selectedProduct.status === 'pending' && (
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            handleApproveProduct(selectedProduct.id);
                            setSelectedProduct(null);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve Product
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            handleRejectProduct(selectedProduct.id);
                            setSelectedProduct(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject Product
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductApproval;
