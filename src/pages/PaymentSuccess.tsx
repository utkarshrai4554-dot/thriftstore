import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, ShoppingBag, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { getUserOrders } from '@/services/orderService';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        if (user) {
          // Get the most recent order for this user
          const orders = await getUserOrders(user.uid);
          if (orders && orders.length > 0) {
            const latestOrder = orders[0]; // Orders are sorted by date (newest first)
            
            // Format order for display
            const formattedOrder = {
              id: latestOrder.id,
              orderNumber: latestOrder.orderNumber,
              status: latestOrder.status,
              totalAmount: latestOrder.totalAmount,
              finalAmount: latestOrder.finalAmount || latestOrder.totalAmount,
              discountAmount: latestOrder.discountAmount || 0,
              couponCode: latestOrder.couponCode,
              pointsUsed: latestOrder.pointsUsed || 0,
              items: latestOrder.items.map((item: any) => ({
                name: item.productName,
                price: `₹${item.price}`,
                quantity: item.quantity,
                image: item.productImage,
                category: item.category
              })),
              shipping: {
                method: 'Standard Delivery',
                estimated: '3-5 business days',
                address: `${latestOrder.shippingAddress.street}, ${latestOrder.shippingAddress.city}, ${latestOrder.shippingAddress.state} ${latestOrder.shippingAddress.zipCode}`
              },
              payment: {
                method: latestOrder.paymentMethod,
                id: paymentId || latestOrder.id,
                status: latestOrder.paymentStatus
              },
              createdAt: latestOrder.createdAt
            };
            
            setOrderDetails(formattedOrder);
            clearCart();
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        // Fallback to mock data if order fetch fails
        setOrderDetails({
          id: paymentId || 'mock_' + Date.now(),
          orderNumber: 'ORD-' + Date.now(),
          status: 'completed',
          totalAmount: 0,
          finalAmount: 0,
          discountAmount: 0,
          items: [],
          shipping: {
            method: 'Standard Delivery',
            estimated: '3-5 business days',
            address: '123 Fashion Street, Style City, ST 12345'
          },
          payment: {
            method: 'Mock Payment Gateway',
            id: paymentId || 'mock_payment_123',
            status: 'Completed'
          },
          createdAt: new Date()
        });
      }
    };

    fetchLatestOrder();
  }, [paymentId, clearCart, user]);

  const handleContinueShopping = () => {
    toast.success("Ready to shop more! Your cart has been cleared for a fresh start.");
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">Thank you for your purchase</p>
        </div>

        {/* Order Details */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Number:</span>
                <span className="font-mono text-sm">{orderDetails?.orderNumber || orderDetails?.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  {orderDetails?.status}
                </span>
              </div>
              {orderDetails?.discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="font-bold text-green-600">-₹{orderDetails.discountAmount}</span>
                </div>
              )}
              {orderDetails?.couponCode && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coupon:</span>
                  <span className="text-sm font-medium">{orderDetails.couponCode}</span>
                </div>
              )}
              {orderDetails?.pointsUsed > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Points Used:</span>
                  <span className="text-sm font-medium">{orderDetails.pointsUsed} pts</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-bold text-lg">₹{orderDetails?.totalAmount}</span>
              </div>
              {orderDetails?.finalAmount !== orderDetails?.totalAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Final Amount:</span>
                  <span className="font-bold text-lg text-primary">₹{orderDetails?.finalAmount}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm">{orderDetails?.payment?.method}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Delivery Address</h4>
                <p className="text-sm text-gray-600">{orderDetails?.shipping?.address}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivery Method:</span>
                <span className="text-sm">{orderDetails?.shipping?.method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estimated Delivery:</span>
                <span className="text-sm">{orderDetails?.shipping?.estimated}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderDetails?.items?.map((item: any, index: number) => (
                <div key={index} className="flex gap-4 items-center py-3 border-b last:border-b-0">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image || '/placeholder.jpg'} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    {item.category && (
                      <p className="text-xs text-gray-500">{item.category}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.price}</p>
                    <p className="text-sm text-gray-600">
                      ₹{(parseFloat(item.price.replace('₹', '')) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/products">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <Link to="/orders">
            <Button className="w-full sm:w-auto">
              View Order History
            </Button>
          </Link>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">Order Confirmation</h3>
            <p className="text-blue-700 text-sm mb-4">
              A confirmation email has been sent to your registered email address.
            </p>
            <div className="text-left space-y-2 text-sm text-blue-700">
              <p>• You can track your order in the "Orders" section</p>
              <p>• Estimated delivery: 3-5 business days</p>
              <p>• Need help? Contact our support team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
