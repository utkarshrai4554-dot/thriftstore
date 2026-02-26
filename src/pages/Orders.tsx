import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserOrders, Order } from "@/services/orderService";
import { toast } from "sonner";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userOrders = await getUserOrders(user.uid);
        setOrders(userOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user]);

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
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
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
                        <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {order.trackingNumber && (
                          <Button variant="outline" size="sm">
                            Track Order
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {order.items.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{item.productName} x{item.quantity}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {order.estimatedDelivery && (
                      <div className="text-xs text-muted-foreground">
                        Estimated delivery: {formatDate(order.estimatedDelivery)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
