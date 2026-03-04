import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(ordersQuery);
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Set up real-time listener for order updates
    const unsubscribe = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        setOrders(ordersData);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Order accepted successfully!');
      
      // Send notification to buyer (you can implement email/SMS notification here)
      await sendOrderNotification(orderId, 'accepted');
      
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId, reason) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Order rejected');
      
      // Send notification to buyer
      await sendOrderNotification(orderId, 'rejected', reason);
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    }
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Order marked as delivered');
      
      // Send notification to buyer
      await sendOrderNotification(orderId, 'delivered');
      
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Failed to update order status');
    }
  };

  const sendOrderNotification = async (orderId, action, reason = '') => {
    // This is where you'd implement email/SMS notifications
    // For now, we'll just log it
    const order = orders.find(o => o.id === orderId);
    console.log(`Order ${action} notification for order ${orderId}:`, { order, reason });
    
    // TODO: Implement email/SMS notification service
    // Example: await emailService.sendOrderNotification(order, action, reason);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'accepted').length}
          </div>
          <div className="text-sm text-gray-600">Accepted</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No orders found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-gray-500">{order.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.totalPrice?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.createdAt?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </button>
                        
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) {
                                  handleRejectOrder(order.id, reason);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleMarkAsDelivered(order.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  <p className="text-sm text-gray-500">Order #{selectedOrder.id.slice(-8)}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Customer Name</label>
                    <p className="text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedOrder.customerEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedOrder.customerPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Shipping Address</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedOrder.shippingAddress}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Order Items</label>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-sm font-medium text-green-600">₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Order Total</label>
                    <p className="text-xl font-bold text-gray-900">₹{selectedOrder.totalPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-gray-900">{selectedOrder.paymentMethod || 'COD'}</p>
                  </div>
                </div>

                {selectedOrder.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                    <p className="text-red-600">{selectedOrder.rejectionReason}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptOrder(selectedOrder.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) {
                            handleRejectOrder(selectedOrder.id, reason);
                            setShowDetails(false);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Reject Order
                      </button>
                    </>
                  )}
                  
                  {selectedOrder.status === 'accepted' && (
                    <button
                      onClick={() => {
                        handleMarkAsDelivered(selectedOrder.id);
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
