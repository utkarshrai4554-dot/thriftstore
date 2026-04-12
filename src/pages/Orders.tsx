import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  ShoppingBag, 
  Package,
  ArrowLeft,
  Search,
  Filter,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  X,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserOrders, Order } from "@/services/orderService";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

const Orders = () => {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userOrders = await getUserOrders(user.uid);
        setOrders(userOrders);
        setFilteredOrders(userOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  useEffect(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'processing':
      case 'confirmed':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | Timestamp) => {
    const dateObj = date instanceof Date ? date : date.toDate();
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleTrackOrder = (trackingNumber: string) => {
    // Open tracking URL or show tracking modal
    window.open('https://track.in/' + trackingNumber, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setShowFilters(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Please Login</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your orders.</p>
            <Link to="/auth">
              <Button size="lg">Login to Your Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-6 w-48"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="font-display text-3xl font-bold">Order History</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-gray-100" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              <ChevronDown className={'h-4 w-4 ml-2 transition-transform ' + (showFilters ? "rotate-180" : "")} />
            </Button>
            {(searchTerm || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex gap-2">
                  {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 && orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/shop">
                  <Button>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
                <Link to="/cart">
                  <Button variant="outline">
                    View Cart
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 && orders.length > 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Search className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{order.orderNumber}</Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      </Badge>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.items.length} items</p>
                        <p className="text-lg font-semibold">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetails(order)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-200"
                        >
                          View Details
                        </Button>
                        {order.trackingNumber && (
                          <Button variant="outline" size="sm" onClick={() => handleTrackOrder(order.trackingNumber!)}>
                            Track Order
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {order.items.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3">Items:</p>
                        <div className="space-y-3">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex gap-3 items-center p-2 bg-gray-50 rounded">
                              <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                <img 
                                  src={item.productImage || '/placeholder.jpg'} 
                                  alt={item.productName} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.productName}</p>
                                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                {item.category && (
                                  <p className="text-xs text-gray-500">{item.category}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">₹{item.price?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs text-gray-600">
                                  ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground pl-2">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Discount Information */}
                    {(order.couponCode || order.pointsUsed > 0) && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Discounts Applied:</p>
                        <div className="space-y-2">
                          {order.couponCode && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-green-600">Coupon ({order.couponCode}):</span>
                              <span className="font-bold text-green-700">-₹{((order.totalAmount || 0) - (order.finalAmount || 0)).toFixed(2)}</span>
                            </div>
                          )}
                          {order.pointsUsed > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-600">Points Used:</span>
                              <span className="font-bold text-blue-700">{order.pointsUsed} pts</span>
                            </div>
                          )}
                          {userProfile?.rewardPoints && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-green-600">Available Points:</span>
                              <span className="font-bold text-green-700">{userProfile.rewardPoints} pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price Summary */}
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="font-medium">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        {order.finalAmount !== order.totalAmount && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Final Amount:</span>
                            <span className="font-bold text-primary">₹{order.finalAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Payment Status:</span>
                          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </Badge>
                        </div>
                        {order.deliveryPartnerName && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Delivery Partner:</span>
                            <span className="font-medium text-green-600">{order.deliveryPartnerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {order.estimatedDelivery && (
                    <div className="text-xs text-muted-foreground">
                      Estimated delivery: {formatDate(order.estimatedDelivery)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-gray-900">Order Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowOrderDetails(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6">
              {/* Order Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">#{selectedOrder.orderNumber}</Badge>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1">{selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</span>
                  </Badge>
                  <Badge variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <span className="text-gray-700 font-medium">Order Date:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.estimatedDelivery && (
                    <div>
                      <span className="text-gray-700 font-medium">Estimated Delivery:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatDate(selectedOrder.estimatedDelivery)}</span>
                    </div>
                  )}
                  {selectedOrder.trackingNumber && (
                    <div>
                      <span className="text-gray-700 font-medium">Tracking Number:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedOrder.trackingNumber}</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPartnerName && (
                    <div>
                      <span className="text-gray-700 font-medium">Delivery Partner:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedOrder.deliveryPartnerName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-700 font-medium">Payment Method:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedOrder.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center p-4 border rounded-lg">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        <img 
                          src={item.productImage || '/placeholder.jpg'} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-700">Qty: {item.quantity}</p>
                        {item.size && <p className="text-sm text-gray-700">Size: {item.size}</p>}
                        {item.color && <p className="text-sm text-gray-700">Color: {item.color}</p>}
                        {item.category && <p className="text-sm text-gray-700">Category: {item.category}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{item.price?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-700">
                          ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-800">{selectedOrder.shippingAddress.street}</p>
                  <p className="text-sm text-gray-800">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                  <p className="text-sm text-gray-800">{selectedOrder.shippingAddress.country}</p>
                </div>
              </div>

              {/* Price Summary */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Price Summary</h3>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-700 font-medium">Subtotal:</span>
                      <span className="font-medium text-gray-900">₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>

                    {/* Discounts */}
                    {(selectedOrder.couponCode || selectedOrder.pointsUsed > 0) && (
                      <div className="space-y-2 pb-3 border-b border-gray-200">
                        {selectedOrder.couponCode && selectedOrder.totalAmount && selectedOrder.finalAmount && (
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 font-medium">
                              🎫 Coupon ({selectedOrder.couponCode}):
                            </span>
                            <span className="font-bold text-green-700">
                              -₹{(selectedOrder.totalAmount - selectedOrder.finalAmount).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {selectedOrder.pointsUsed > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-blue-600 font-medium">
                              ⭐ Points Used:
                            </span>
                            <span className="font-bold text-blue-700">
                              {selectedOrder.pointsUsed} pts
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Shipping */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-700 font-medium">🚚 Shipping:</span>
                      <span className="font-medium text-gray-900">
                        {selectedOrder.finalAmount && selectedOrder.finalAmount < (selectedOrder.totalAmount || 0) 
                          ? 'FREE' 
                          : '₹0.00'
                        }
                      </span>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-primary">
                        ₹{selectedOrder.finalAmount?.toFixed(2) || selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Points Balance Info */}
                  {userProfile?.rewardPoints && userProfile.rewardPoints > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-medium">
                          💰 Current Points Balance:
                        </span>
                        <span className="font-bold text-green-700">
                          {userProfile.rewardPoints} pts
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                  Close
                </Button>
                {selectedOrder.trackingNumber && (
                  <Button onClick={() => handleTrackOrder(selectedOrder.trackingNumber!)}>
                    Track Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
