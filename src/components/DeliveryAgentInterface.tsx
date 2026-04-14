import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Clock, User, Phone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { 
  listenForAssignments, 
  acceptDeliveryAssignment, 
  declineDeliveryAssignment, 
  getPendingAssignmentsForAgent,
  DeliveryAssignment 
} from '@/services/deliveryAssignmentService';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Order {
  id: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  finalAmount: number;
  shippingAddress: any;
  items: any[];
}

const DeliveryAgentInterface = () => {
  const { user } = useAuth();
  const [pendingAssignments, setPendingAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);
  const [decliningOrder, setDecliningOrder] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{ [key: string]: Order }>({});

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    
    // Initial fetch
    fetchPendingAssignments();

    // Set up real-time listener
    const unsubscribe = listenForAssignments(user.uid, (assignments) => {
      setPendingAssignments(assignments);
      fetchOrderDetails(assignments);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const fetchPendingAssignments = async () => {
    if (!user?.uid) return;
    
    try {
      const assignments = await getPendingAssignmentsForAgent(user.uid);
      setPendingAssignments(assignments);
      await fetchOrderDetails(assignments);
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
      toast.error('Failed to fetch pending orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (assignments: DeliveryAssignment[]) => {
    const orderPromises = assignments.map(async (assignment) => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', assignment.orderId));
        if (orderDoc.exists()) {
          return {
            [assignment.orderId]: {
              id: orderDoc.id,
              ...orderDoc.data()
            } as Order
          };
        }
        return null;
      } catch (error) {
        console.error('Error fetching order details:', error);
        return null;
      }
    });

    const orderResults = await Promise.all(orderPromises);
    const orders = orderResults.reduce((acc, order) => {
      if (order) {
        return { ...acc, ...order };
      }
      return acc;
    }, {});

    setOrderDetails(orders);
  };

  const handleAcceptOrder = async (assignmentId: string) => {
    try {
      setAcceptingOrder(assignmentId);
      await acceptDeliveryAssignment(assignmentId);
      toast.success('Order accepted successfully!');
      
      // Remove from pending assignments
      setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    } finally {
      setAcceptingOrder(null);
    }
  };

  const handleDeclineOrder = async (assignmentId: string) => {
    try {
      setDecliningOrder(assignmentId);
      await declineDeliveryAssignment(assignmentId);
      toast.success('Order declined');
      
      // Remove from pending assignments
      setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
    } catch (error) {
      console.error('Error declining order:', error);
      toast.error('Failed to decline order');
    } finally {
      setDecliningOrder(null);
    }
  };

  const getTimeRemaining = (expiresAt: any) => {
    if (!expiresAt) return 'Unknown';
    
    const now = new Date();
    const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const timeDiff = expires.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Expired';
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: any) => {
    if (!address) return 'No address provided';
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}, ${address.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading pending orders...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h1>
              <p className="text-gray-600">Manage your delivery assignments</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPendingAssignments}
              disabled={loading}
              className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{pendingAssignments.length}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingAssignments.length > 0 ? getTimeRemaining(pendingAssignments[0].expiresAt) : 'N/A'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Time Remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Orders */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Pending Orders</CardTitle>
            <p className="text-sm text-gray-600">Orders waiting for your acceptance</p>
          </CardHeader>
          <CardContent>
            {pendingAssignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Orders</h3>
                <p className="text-gray-600">You don't have any pending orders at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => {
                  const order = orderDetails[assignment.orderId];
                  if (!order) return null;

                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Order #{order.id.slice(-8)}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Expires in: {getTimeRemaining(assignment.expiresAt)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Pending
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Customer</span>
                          </div>
                          <p className="text-sm text-gray-600">{order.userName}</p>
                          <p className="text-sm text-gray-600">{order.userEmail}</p>
                          {order.userPhone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{order.userPhone}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Delivery Address</span>
                          </div>
                          <p className="text-sm text-gray-600">{formatAddress(order.shippingAddress)}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">Order Items</span>
                        </div>
                        <div className="space-y-1">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              • {item.productName} ({item.quantity}x) - ₹{item.price?.toFixed(2) || '0.00'}
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-lg font-bold text-gray-900">₹{order.finalAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDeclineOrder(assignment.id)}
                            disabled={decliningOrder === assignment.id || acceptingOrder === assignment.id}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            {decliningOrder === assignment.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Declining...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleAcceptOrder(assignment.id)}
                            disabled={acceptingOrder === assignment.id || decliningOrder === assignment.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {acceptingOrder === assignment.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryAgentInterface;
