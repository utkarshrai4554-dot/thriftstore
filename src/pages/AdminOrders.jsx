import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
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

  useEffect(() => {
    // Set up real-time listener for order updates
    const unsubscribe = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        });
        setOrders(ordersData);
        setLoading(false);
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
      const selectedPartnerData = deliveryPartners.find(p => p.id === selectedPartner);
      
      await updateDoc(orderRef, {
        deliveryPartner: selectedPartner,
        deliveryPartnerName: selectedPartnerData?.name,
        status: 'accepted', // Update status to accepted when delivery is assigned
        assignedAt: new Date(),
        updatedAt: new Date()
      });

      toast.success(`Delivery partner ${selectedPartnerData?.name} assigned successfully!`);
      setShowAssignModal(false);
      setSelectedPartner('');
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

  const filteredOrders = orders.filter(order => {
  const matchesSearch = searchQuery === '' || 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
  
  if (activeTab === 'pending') {
    return matchesSearch && (order.status === 'pending' || order.status === 'accepted' || order.status === 'confirmed') && 
           (order.paymentStatus === 'paid' || order.paymentStatus === undefined || order.paymentStatus === null);
  } else if (activeTab === 'completed') {
    return matchesSearch && order.status === 'delivered';
  }
  return matchesSearch;
});

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
    <div className="bg-gradient-to-br from-amber-950 to-amber-900 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-100">Order Management</h1>
          <p className="text-amber-200">Manage and track customer orders</p>
        </div>

        {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-900 p-6 rounded-lg shadow border border-amber-700">
          <div className="text-2xl font-bold text-amber-100">{orders.length}</div>
          <div className="text-sm text-amber-200">Total Orders</div>
        </div>
        <div className="bg-amber-900 p-6 rounded-lg shadow border border-amber-700">
          <div className="text-2xl font-bold text-yellow-300">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-amber-200">Pending</div>
        </div>
        <div className="bg-amber-900 p-6 rounded-lg shadow border border-amber-700">
          <div className="text-2xl font-bold text-green-300">
            {orders.filter(o => o.status === 'accepted').length}
          </div>
          <div className="text-sm text-amber-200">Accepted</div>
        </div>
        <div className="bg-amber-900 p-6 rounded-lg shadow border border-amber-700">
          <div className="text-2xl font-bold text-purple-300">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-sm text-amber-200">Delivered</div>
        </div>
      </div>

      {/* Delivery Partners Management */}
      <div className="bg-amber-900 rounded-lg shadow overflow-hidden mb-8 border border-amber-700">
        <div className="px-6 py-4 border-b border-amber-700">
          <h2 className="text-xl font-semibold text-amber-100 mb-4">Delivery Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Partners List */}
            <div>
              <h3 className="text-lg font-medium text-amber-200 mb-3">Available Partners</h3>
              <div className="space-y-2">
                {deliveryPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 bg-amber-800 rounded-lg border border-amber-600">
                    <div>
                      <p className="font-medium text-amber-100">{partner.name}</p>
                      <p className="text-sm text-amber-300">{partner.phone}</p>
                      <p className="text-sm text-amber-300">{partner.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssignDelivery(selectedOrder.id)}
                        disabled={!selectedOrder}
                        className="px-3 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
              <h3 className="text-lg font-medium text-amber-200 mb-3">Delivery Agents</h3>
              <div className="space-y-2">
                {deliveryAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-amber-800 rounded-lg border border-amber-600">
                    <div>
                      <p className="font-medium text-amber-100">{agent.name}</p>
                      <p className="text-sm text-amber-300">{agent.phone}</p>
                      <p className="text-sm text-amber-300">{agent.deliveries} deliveries</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.status === 'online' ? 'default' : 'outline'}>
                        {agent.status}
                      </Badge>
                      <button
                        onClick={() => handleUpdateAgentStatus(agent.id, agent.status === 'online' ? 'offline' : 'online')}
                        className="px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-500 text-sm"
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
          <h3 className="text-lg font-medium text-amber-200 mb-3">Add New Agent</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Agent Name"
              className="flex-1 px-3 py-2 border border-amber-600 rounded-md bg-amber-800 text-amber-100 placeholder-amber-400"
              id="newAgentName"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="flex-1 px-3 py-2 border border-amber-600 rounded-md bg-amber-800 text-amber-100 placeholder-amber-400"
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
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"
            >
              Add Agent
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-amber-900 rounded-lg shadow overflow-hidden border border-amber-700">
        <div className="px-6 py-4 border-b border-amber-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-amber-100">Order Management</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'pending' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-800 text-amber-300 hover:bg-amber-700'
                }`}
              >
                Pending Orders ({orders.filter(o => (o.status === 'pending' || o.status === 'accepted' || o.status === 'confirmed') && (o.paymentStatus === 'paid' || o.paymentStatus === undefined || o.paymentStatus === null)).length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'completed' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-800 text-amber-300 hover:bg-amber-700'
                }`}
              >
                Completed Orders ({orders.filter(o => o.status === 'delivered').length})
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-amber-800 border border-amber-600 rounded-md text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-amber-300 mb-4">
              {searchQuery ? 'No orders found matching your search' : `No ${activeTab} orders found`}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Delivery Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-amber-900 divide-y divide-amber-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-100">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-100">
                      <div>
                        <div className="font-medium">{order.userName}</div>
                        <div className="text-amber-300">{order.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-100">
                      ₹{order.finalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-100">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-100">
                      {order.deliveryPartnerName || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-100">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="px-3 py-1.5 bg-amber-700 text-amber-100 rounded-md hover:bg-amber-600 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        {(order.status === 'pending' || order.status === 'accepted' || order.status === 'confirmed') && (order.paymentStatus === 'paid' || order.paymentStatus === undefined || order.paymentStatus === null) ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
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
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Reject
                          </button>
                        )}
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleMarkAsDelivered(order.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Mark Delivered
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-700 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-amber-100">Order Details</h3>
                  <p className="text-sm text-amber-300">Order #{selectedOrder.id ? selectedOrder.id.slice(-8) : 'Loading...'}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-amber-300 hover:text-amber-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-300">Customer Name</label>
                    <p className="text-amber-100">{selectedOrder.userName || 'Loading...'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-300">Email</label>
                    <p className="text-amber-100">{selectedOrder.userEmail || 'Loading...'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-300">Phone</label>
                    <p className="text-amber-100">{selectedOrder.userPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-300">Status</label>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-amber-300">Shipping Address</label>
                  <div className="bg-amber-800 p-3 rounded-lg border border-amber-600">
                    <p className="text-amber-100">
                      {selectedOrder.shippingAddress ? 
                        `${selectedOrder.shippingAddress.street || ''}, ${selectedOrder.shippingAddress.city || ''}, ${selectedOrder.shippingAddress.state || ''} ${selectedOrder.shippingAddress.zipCode || ''}, ${selectedOrder.shippingAddress.country || ''}` 
                        : 'Loading...'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-amber-300">Order Items</label>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex gap-4 items-center p-3 bg-amber-800 rounded-lg border border-amber-600">
                        <div className="w-16 h-16 rounded-lg bg-amber-700 overflow-hidden flex-shrink-0">
                          <img 
                            src={item.productImage || '/placeholder.jpg'} 
                            alt={item.productName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-amber-100">{item.productName}</p>
                          <p className="text-sm text-amber-300">Qty: {item.quantity}</p>
                          {item.size && <p className="text-sm text-amber-300">Size: {item.size}</p>}
                          {item.color && <p className="text-sm text-amber-300">Color: {item.color}</p>}
                          {item.category && <p className="text-sm text-amber-300">Category: {item.category}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-100">₹{item.price?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-amber-300">
                            ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-300">Order Total</label>
                    <p className="text-xl font-bold text-amber-100">₹{selectedOrder.finalAmount ? selectedOrder.finalAmount.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-300">Payment Method</label>
                    <p className="text-amber-100">{selectedOrder.paymentMethod || 'COD'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-300">Delivery Partner</label>
                    <p className="text-amber-100">{selectedOrder.deliveryPartnerName || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-300">Payment Status</label>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedOrder.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.paymentStatus || 'pending'}
                    </span>
                  </div>
                </div>

                {selectedOrder.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-amber-300">Rejection Reason</label>
                    <div className="bg-amber-800 p-3 rounded-lg border border-amber-600">
                      <p className="text-red-400">{selectedOrder.rejectionReason}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t border-amber-600">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptOrder(selectedOrder.id)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
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
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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

      {/* Delivery Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-amber-700 shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-800 to-amber-700 px-6 py-4 rounded-t-xl border-b border-amber-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2a1 1 0 011 1v6m0-5V6a1 1 0 011-1h2a1 1 0 011 1v1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Assign Delivery Partner</h3>
                    <p className="text-amber-200 text-sm">Select a delivery partner for this order</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('Closing modal');
                    setShowAssignModal(false);
                    setSelectedPartner('');
                  }}
                  className="text-amber-200 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Debug Info */}
              <div className="bg-amber-800 rounded p-2 text-xs border border-amber-700">
                <p className="text-amber-200">Debug: Order ID: {selectedOrder.id}</p>
                <p className="text-amber-200">Debug: Customer: {selectedOrder.customerName}</p>
                <p className="text-amber-200">Debug: Selected Partner: {selectedPartner}</p>
              </div>
              
              {/* Order Summary Card */}
              <div className="bg-amber-800 rounded-lg p-4 border border-amber-700 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-100">Order Summary</h4>
                    <p className="text-amber-300 text-sm">Order #{selectedOrder.id ? selectedOrder.id.slice(-8) : 'Loading...'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-amber-700 rounded p-2 border border-amber-600">
                    <p className="text-amber-300 text-xs">Customer</p>
                    <p className="text-amber-100 font-medium">{selectedOrder.customerName || 'Loading...'}</p>
                  </div>
                  <div className="bg-amber-700 rounded p-2 border border-amber-600">
                    <p className="text-amber-300 text-xs">Total Amount</p>
                    <p className="text-amber-100 font-medium">₹{selectedOrder.totalPrice ? selectedOrder.totalPrice.toFixed(2) : '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Partner Selection */}
              <div>
                <label className="block text-sm font-semibold text-amber-100 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a5 5 0 00-9.552-2.312M17 20H7m0 0v-2a5 5 0 00-9.552 2.312M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a5 5 0 00-5.356-1.857" />
                  </svg>
                  Select Delivery Partner
                </label>
                <div className="space-y-2">
                  {deliveryPartners.map((partner) => (
                    <label
                      key={partner.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPartner === partner.id
                          ? 'bg-amber-700 border-amber-500'
                          : 'bg-amber-800 border-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryPartner"
                        value={partner.id}
                        checked={selectedPartner === partner.id}
                        onChange={(e) => {
                          console.log('Selected partner:', e.target.value);
                          setSelectedPartner(e.target.value);
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-amber-100">{partner.name}</p>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPartner === partner.id
                              ? 'bg-amber-400 border-amber-300'
                              : 'border-amber-500'
                          }`}>
                            {selectedPartner === partner.id && (
                              <div className="w-2 h-2 bg-amber-900 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-amber-300">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {partner.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {partner.email}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gradient-to-r from-amber-800 to-amber-700 px-6 py-4 rounded-b-xl border-t border-amber-600">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    console.log('Cancel clicked');
                    setShowAssignModal(false);
                    setSelectedPartner('');
                  }}
                  className="px-6 py-2.5 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Assign partner clicked for order:', selectedOrder.id);
                    handleAssignDelivery(selectedOrder.id);
                  }}
                  disabled={!selectedPartner}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg disabled:shadow-none"
                >
                  Assign Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminOrders;
