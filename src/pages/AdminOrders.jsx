import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deliveryPartners] = useState([
    { id: 'partner1', name: 'Stylease Express', phone: '+1234567890', email: 'express@stylease.com' },
    { id: 'partner2', name: 'QuickShip Logistics', phone: '+0987654321', email: 'quickship@stylease.com' },
    { id: 'partner3', name: 'Local Delivery Co', phone: '+1122334455', email: 'local@stylease.com' },
    { id: 'partner4', name: 'Speedy Delivery', phone: '+9998887777', email: 'speedy@stylease.com' }
  ]);
  const [deliveryAgents, setDeliveryAgents] = useState([
    { id: 'agent1', name: 'John Smith', phone: '+1234567890', status: 'online', deliveries: 45 },
    { id: 'agent2', name: 'Sarah Johnson', phone: '+0987654321', status: 'offline', deliveries: 32 },
    { id: 'agent3', name: 'Mike Wilson', phone: '+1122334455', status: 'online', deliveries: 28 }
  ]);
  const [selectedPartner, setSelectedPartner] = useState('');

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

  const handleAssignDelivery = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        deliveryPartner: selectedPartner,
        deliveryPartnerName: deliveryPartners.find(p => p.id === selectedPartner)?.name,
        assignedAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Delivery partner assigned successfully!');
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      toast.error('Failed to assign delivery partner');
    }
  };

  const handleAddAgent = async (agent) => {
    try {
      const newAgent = {
        ...agent,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      
      setDeliveryAgents([...deliveryAgents, newAgent]);
      toast.success('Delivery agent added successfully!');
    } catch (error) {
      console.error('Error adding delivery agent:', error);
      toast.error('Failed to add delivery agent');
    }
  };

  const handleUpdateAgentStatus = async (agentId, status) => {
    try {
      setDeliveryAgents(deliveryAgents.map(agent => 
        agent.id === agentId ? { ...agent, status } : agent
      ));
      toast.success(`Agent status updated to ${status}`);
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast.error('Failed to update agent status');
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

      {/* Delivery Partners Management */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Partners List */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Available Partners</h3>
              <div className="space-y-2">
                {deliveryPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{partner.name}</p>
                      <p className="text-sm text-gray-600">{partner.phone}</p>
                      <p className="text-sm text-gray-600">{partner.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssignDelivery(selectedOrder.id)}
                        disabled={!selectedOrder}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Assign to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Agents */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Delivery Agents</h3>
              <div className="space-y-2">
                {deliveryAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-600">{agent.phone}</p>
                      <p className="text-sm text-gray-600">{agent.deliveries} deliveries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.status === 'online' ? 'default' : 'outline'}>
                        {agent.status}
                      </Badge>
                      <button
                        onClick={() => handleUpdateAgentStatus(agent.id, agent.status === 'online' ? 'offline' : 'online')}
                        className="px-2 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        {agent.status === 'online' ? 'Go Offline' : 'Go Online'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add New Agent */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Add New Agent</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Agent Name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              id="newAgentName"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              id="newAgentPhone"
            />
            <button
              onClick={() => {
                const name = document.getElementById('newAgentName')?.value;
                const phone = document.getElementById('newAgentPhone')?.value;
                if (name && phone) {
                  handleAddAgent({ name, phone });
                  document.getElementById('newAgentName').value = '';
                  document.getElementById('newAgentPhone').value = '';
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Agent
            </button>
          </div>
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
                    Delivery Partner
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
                      ₹{order.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.deliveryPartnerName || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.createdAt.toDate().toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                        {order.status === 'pending' && order.paymentStatus === 'paid' ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign Delivery
                          </button>
                        ) : null}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) {
                                handleRejectOrder(order.id, reason);
                                setShowDetails(false);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
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

  {/* Delivery Assignment Modal */}
  {showAssignModal && selectedOrder && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assign Delivery Partner</h3>
            <button
              onClick={() => setShowAssignModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Delivery Partner:</label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a partner...</option>
              {deliveryPartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name} - {partner.phone} ({partner.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Details:</label>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Order ID:</strong> #{selectedOrder.id.slice(-8)}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Total:</strong> ₹{selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
              <p><strong>Status:</strong> <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{getStatusText(selectedOrder.status)}</span></p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAssignDelivery(selectedOrder.id)}
              disabled={!selectedPartner}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
};

export default AdminOrders;
