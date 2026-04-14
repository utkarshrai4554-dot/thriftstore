import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  ShoppingBag, 
  Package, 
  Heart, 
  Star,
  TrendingUp,
  Clock,
  Gift,
  Trophy,
  Bell,
  ArrowRight,
  Truck,
  DollarSign,
  Users,
  Target,
  Calendar,
  Award
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUserOrders, Order } from "@/services/orderService";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has permission to access dashboard
  const userRole = userProfile?.role || 'customer';
  const hasAccess = userRole === 'admin';

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!user) return;
      
      try {
        const orders = await getUserOrders(user.uid);
        setRecentOrders(orders.slice(0, 5)); // Show only 5 most recent orders
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, [user]);

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const totalOrders = recentOrders.length;
    const totalSpent = recentOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
    const deliveredOrders = recentOrders.filter(order => order.status === 'delivered').length;
    const pendingOrders = recentOrders.filter(order => ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)).length;
    
    return { totalOrders, totalSpent, deliveredOrders, pendingOrders };
  };

  const stats = calculateStats();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  // If user is not admin, show unauthorized access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              You don't have permission to access the dashboard. This area is restricted to admin personnel only.
            </p>
            <Alert className="mb-6 max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your current role: <strong>{userRole}</strong>. If you believe this is an error, please contact an administrator.
              </AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/")}>
                Go to Homepage
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile")}>
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {userProfile?.displayName || user?.email}!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{userProfile?.rewardPoints || 0}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Reward Points</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest order activity</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/orders")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">Start shopping to see your order history here.</p>
                  <Button onClick={() => navigate("/products")}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{order.orderNumber}</span>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.items.length} items • ₹{(order.finalAmount || order.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/orders`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Profile */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(userProfile?.displayName || user?.email || 'U')?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{userProfile?.displayName || 'User'}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since:</span>
                      <span className="font-medium">
                        {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate ? userProfile.createdAt.toDate() : userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={userProfile?.isActive ? 'default' : 'secondary'}>
                        {userProfile?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/products")}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Products
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/sell")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Sell Product
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/donate")}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Donate Item
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/orders")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
              </CardContent>
            </Card>

            {/* Rewards Progress */}
            {userProfile?.rewardPoints && userProfile.rewardPoints > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Rewards Progress</CardTitle>
                  <CardDescription>Your points balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">{userProfile.rewardPoints} points</span>
                      </div>
                      <Badge variant="outline">Level {Math.floor(userProfile.rewardPoints / 100) + 1}</Badge>
                    </div>
                    <Progress value={(userProfile.rewardPoints % 100)} className="h-2" />
                    <p className="text-xs text-gray-600">
                      {100 - (userProfile.rewardPoints % 100)} points to next level
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
