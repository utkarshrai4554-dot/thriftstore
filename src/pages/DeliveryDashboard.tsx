import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Package, 
  MapPin, 
  ArrowRight, 
  Truck, 
  CheckCircle, 
  User, 
  Phone, 
  RefreshCw, 
  X, 
  Check,
  Clock,
  Calendar,
  Navigation,
  Camera,
  DollarSign,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Order } from "@/services/orderService";

interface DeliveryAgent {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  drivingLicense: string;
  address: string;
  experience?: string;
  availability: string;
  status: string;
  totalDeliveries: number;
  rating: number;
  approvedAt: any;
  createdAt: any;
}

interface AssignedProduct {
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
  status: 'awaiting-assignment' | 'assigned' | 'in-transit' | 'delivered';
  assignedTo?: string;
  assignedAt?: Date;
  approvedAt: Date;
  approvedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DeliveryTask extends Order {
  deliveryStatus: 'pending' | 'picked-up' | 'in-transit' | 'delivered' | 'failed';
  pickupAddress?: string;
  deliveryNotes?: string;
  proofOfDelivery?: {
    photo?: string;
    signature?: string;
    timestamp?: Date;
  };
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
}

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [deliveryTasks, setDeliveryTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pickup');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<DeliveryTask | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofPhoto, setProofPhoto] = useState('');

  useEffect(() => {
    fetchDeliveryAgents();
    fetchAssignedProducts();
    fetchDeliveryTasks();
  }, []);

  const fetchDeliveryTasks = async () => {
    try {
      if (!user) return;
      
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('deliveryPartner', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: DeliveryTask[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          deliveryStatus: data.deliveryStatus || 'pending',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        } as DeliveryTask);
      });
      
      setDeliveryTasks(tasks);
    } catch (error) {
      console.error('Error fetching delivery tasks:', error);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      setLoading(true);
      console.log('Fetching delivery agents from collection...');
      
      const deliveryAgentsCollection = collection(db, 'deliveryAgents');
      const querySnapshot = await getDocs(deliveryAgentsCollection);
      
      const agents: DeliveryAgent[] = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as DeliveryAgent));
      
      console.log('Fetched delivery agents:', agents);
      setDeliveryAgents(agents);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching all product requests for delivery agent...');
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const deliveryAssignmentCollection = collection(db, 'deliveryAssignment');
      const querySnapshot = await getDocs(deliveryAssignmentCollection);
      
      const assignedProducts: AssignedProduct[] = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AssignedProduct))
        .filter(product => product.assignedTo === user.uid); // Show all assigned products regardless of status
      
      // Sort by status priority: assigned > in-transit > delivered > awaiting-assignment
      const sortedProducts = assignedProducts.sort((a, b) => {
        const statusPriority = {
          'assigned': 0,
          'in-transit': 1, 
          'delivered': 2,
          'awaiting-assignment': 3
        };
        return (statusPriority[a.status as keyof typeof statusPriority] || 99) - (statusPriority[b.status as keyof typeof statusPriority] || 99);
      });
      
      console.log('Fetched assigned products:', sortedProducts);
      setAssignedProducts(sortedProducts);
      
    } catch (error) {
      console.error('Error fetching assigned products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      console.log('✅ Delivery agent approving product:', productId);
      
      // Get product from deliveryAssignment collection
      const assignmentRef = doc(db, 'deliveryAssignment', productId);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (!assignmentDoc.exists()) {
        console.error('Product assignment not found');
        return;
      }
      
      const assignmentData = assignmentDoc.data();
      
      // Move to approvedProducts collection
      const approvedProductRef = doc(db, 'approvedProducts', productId);
      await setDoc(approvedProductRef, {
        ...assignmentData,
        status: 'approved',
        approvedByDeliveryAgent: user?.uid,
        approvedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update deliveryAssignment status
      await updateDoc(assignmentRef, {
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update delivery agent stats
      const agentRef = doc(db, 'deliveryAgents', user!.uid);
      await updateDoc(agentRef, {
        totalDeliveries: (assignmentData.totalDeliveries || 0) + 1,
        updatedAt: new Date()
      });
      
      console.log('✅ Product approved and moved to shop');
      fetchAssignedProducts();
      
    } catch (error) {
      console.error('❌ Error approving product:', error);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      console.log('❌ Delivery agent rejecting product:', productId);
      
      // Get product from deliveryAssignment collection
      const assignmentRef = doc(db, 'deliveryAssignment', productId);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (!assignmentDoc.exists()) {
        console.error('Product assignment not found');
        return;
      }
      
      const assignmentData = assignmentDoc.data();
      
      // Move to rejectedProducts collection
      const rejectedProductRef = doc(db, 'rejectedProducts', productId);
      await setDoc(rejectedProductRef, {
        ...assignmentData,
        status: 'rejected',
        rejectedByDeliveryAgent: user?.uid,
        rejectedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update deliveryAssignment status
      await updateDoc(assignmentRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('❌ Product rejected and moved to rejected collection');
      fetchAssignedProducts();
      
    } catch (error) {
      console.error('❌ Error rejecting product:', error);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: DeliveryTask['deliveryStatus'], notes?: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = {
        deliveryStatus: status,
        updatedAt: new Date()
      };
      
      if (status === 'picked-up') {
        updateData.pickedUpAt = new Date();
        updateData.estimatedDeliveryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      } else if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date();
        updateData.status = 'delivered';
      }
      
      if (notes) {
        updateData.deliveryNotes = notes;
      }
      
      await updateDoc(orderRef, updateData);
      toast.success(`Delivery status updated to ${status}`);
      fetchDeliveryTasks();
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const handleProofOfDelivery = async (orderId: string) => {
    try {
      if (!proofPhoto) {
        toast.error('Please capture or upload a proof photo');
        return;
      }
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        proofOfDelivery: {
          photo: proofPhoto,
          timestamp: new Date()
        },
        deliveryStatus: 'delivered',
        actualDeliveryTime: new Date(),
        status: 'delivered',
        updatedAt: new Date()
      });
      
      toast.success('Proof of delivery submitted successfully');
      setShowProofModal(false);
      setProofPhoto('');
      setSelectedTask(null);
      fetchDeliveryTasks();
      
    } catch (error) {
      console.error('Error submitting proof of delivery:', error);
      toast.error('Failed to submit proof of delivery');
    }
  };

  const getDeliveryStatusColor = (status: DeliveryTask['deliveryStatus']) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in-transit': return 'bg-blue-100 text-blue-800';
      case 'picked-up': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in-transit': return 'bg-blue-100 text-blue-800';
      case 'picked-up': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'awaiting-assignment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDeliveryTasks = deliveryTasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || task.deliveryStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading delivery agents...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h1>
              <p className="text-gray-600">Manage pickups and deliveries efficiently</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                fetchDeliveryAgents();
                fetchAssignedProducts();
                fetchDeliveryTasks();
              }}
              disabled={loading}
              className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Pickup Tasks", value: assignedProducts.length.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Delivery Tasks", value: deliveryTasks.length.toString(), icon: Truck, color: "text-green-600", bg: "bg-green-50" },
            { label: "Completed Today", value: deliveryTasks.filter(t => t.deliveryStatus === 'delivered' && new Date(t.actualDeliveryTime || 0).toDateString() === new Date().toDateString()).length.toString(), icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Your Rating", value: deliveryAgents.find(a => a.uid === user?.uid)?.rating?.toFixed(1) || '0.0', icon: User, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((s, i) => {
            const IconComponent = s.icon;
            return (
              <Card key={i} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}>
                      <IconComponent className={`h-6 w-6 ${s.color}`} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pickup" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Pickups
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Order Deliveries
            </TabsTrigger>
          </TabsList>

          {/* Pickup Tasks Tab */}
          <TabsContent value="pickup" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Product Requests</h2>
                    <p className="text-sm text-gray-600 mt-1">All product pickup requests assigned to you</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="awaiting-assignment">Awaiting Assignment</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in-transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
          
              {assignedProducts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Requests</h3>
                  <p className="text-gray-600">No product requests have been assigned to you yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {assignedProducts
                    .filter(product => {
                      const matchesSearch = searchTerm === '' || 
                        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.category.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((product) => (
                    <div key={product.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                            <Badge className={getStatusBadgeColor(product.status)}>
                              <Package className="w-3 h-3 mr-1" />
                              {product.status.replace('-', ' ').charAt(0).toUpperCase() + product.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>{product.brand}</span>
                            <span>•</span>
                            <span>{product.category}</span>
                            <span>•</span>
                            <span>{product.condition}</span>
                            <span>•</span>
                            <span>Assigned: {product.assignedAt ? new Date(product.assignedAt?.toDate ? product.assignedAt.toDate() : product.assignedAt).toLocaleDateString() : 'Not assigned'}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{product.description}</p>
                          {product.sellerInfo && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Seller:</span> {product.sellerInfo.displayName} ({product.sellerInfo.email})
                            </div>
                          )}
                          {product.images && product.images.length > 0 && (
                            <div className="flex gap-2 mb-2">
                              {product.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`${product.title} ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              ))}
                              {product.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-600">
                                  +{product.images.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 mb-2">
                            ₹{product.sellingPrice?.toLocaleString('en-IN')}
                          </div>
                          {product.originalPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice?.toLocaleString('en-IN')}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mb-2">
                            {product.sellingPrice && product.originalPrice && product.originalPrice > product.sellingPrice 
                              ? `-${Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)}%`
                              : '0%'
                            } discount
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Instructions:</span> Check product quality, approve for shop listing, or reject
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://maps.google.com/?q=${product.sellerInfo?.email || ''}`, '_blank')}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate to Seller
                          </Button>
                          <Button
                            onClick={() => handleRejectProduct(product.id)}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleApproveProduct(product.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Delivery Tasks Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Order Deliveries</h2>
                    <p className="text-sm text-gray-600 mt-1">Customer orders assigned to you for delivery</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="picked-up">Picked Up</SelectItem>
                        <SelectItem value="in-transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {filteredDeliveryTasks.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Tasks</h3>
                  <p className="text-gray-600">No orders have been assigned to you for delivery yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDeliveryTasks.map((task) => (
                    <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{task.orderNumber}</h3>
                            <Badge className={getDeliveryStatusColor(task.deliveryStatus)}>
                              {task.deliveryStatus.charAt(0).toUpperCase() + task.deliveryStatus.slice(1).replace('-', ' ')}
                            </Badge>
                            <Badge variant={task.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                              {task.paymentStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>{task.items.length} items</span>
                            <span>•</span>
                            <span>₹{task.finalAmount?.toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span>{new Date(task.createdAt?.toDate ? task.createdAt.toDate() : task.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>{task.shippingAddress.street}, {task.shippingAddress.city}</span>
                          </div>
                          <div className="space-y-2">
                            {task.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.productImage || '/placeholder.jpg'} 
                                    alt={item.productName} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span>{item.productName} x{item.quantity}</span>
                              </div>
                            ))}
                            {task.items.length > 2 && (
                              <span className="text-sm text-gray-500">+{task.items.length - 2} more items</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 mb-2">
                            ₹{task.finalAmount?.toLocaleString('en-IN')}
                          </div>
                          {task.estimatedDeliveryTime && (
                            <div className="text-xs text-gray-500">
                              Est. delivery: {new Date(task.estimatedDeliveryTime?.toDate ? task.estimatedDeliveryTime.toDate() : task.estimatedDeliveryTime).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://maps.google.com/?q=${task.shippingAddress.street},${task.shippingAddress.city}`, '_blank')}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate
                          </Button>
                          {task.trackingNumber && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://track.in/${task.trackingNumber}`, '_blank')}
                            >
                              Track
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {task.deliveryStatus === 'pending' && (
                            <Button
                              onClick={() => updateDeliveryStatus(task.id!, 'picked-up')}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Mark Picked Up
                            </Button>
                          )}
                          {task.deliveryStatus === 'picked-up' && (
                            <Button
                              onClick={() => updateDeliveryStatus(task.id!, 'in-transit')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Start Delivery
                            </Button>
                          )}
                          {task.deliveryStatus === 'in-transit' && (
                            <Button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowProofModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              Complete Delivery
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Proof of Delivery Modal */}
        {showProofModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Proof of Delivery</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Order: {selectedTask.orderNumber}</p>
                    <p className="text-sm text-gray-600">Customer: {selectedTask.shippingAddress.street}, {selectedTask.shippingAddress.city}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Photo Proof</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setProofPhoto(e.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  {proofPhoto && (
                    <div className="mt-2">
                      <img src={proofPhoto} alt="Proof" className="w-full h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProofModal(false);
                      setProofPhoto('');
                      setSelectedTask(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => selectedTask.id && handleProofOfDelivery(selectedTask.id)}
                    className="flex-1"
                  >
                    Submit Proof
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
    </div>
  );
};

export default DeliveryDashboard;
