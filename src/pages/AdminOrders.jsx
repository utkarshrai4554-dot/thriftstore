import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc, collection, query, orderBy, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
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
    const [deliveryAgentRequests, setDeliveryAgentRequests] = useState([
    { id: 'req1', name: 'Alice Brown', phone: '+1555666777', email: 'alice@delivery.com', status: 'pending', experience: '2 years', vehicle: 'Motorcycle', appliedDate: '2024-01-15' },
    { id: 'req2', name: 'Bob Davis', phone: '+1888999000', email: 'bob@delivery.com', status: 'pending', experience: '1 year', vehicle: 'Van', appliedDate: '2024-01-14' },
    { id: 'req3', name: 'Carol White', phone: '+1222333444', email: 'carol@delivery.com', status: 'pending', experience: '3 years', vehicle: 'Car', appliedDate: '2024-01-13' },
    { id: 'req4', name: 'David Lee', phone: '+1444555666', email: 'david@delivery.com', status: 'pending', experience: '6 months', vehicle: 'Bicycle', appliedDate: '2024-01-12' }
  ]);

  useEffect(() => {
    // Set up real-time listener for order updates
    const unsubscribeOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          };
        });
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeOrders();
    };
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

  
  
  const handleApproveRequest = async (requestId) => {
    try {
      const request = deliveryAgentRequests.find(req => req.id === requestId);
      if (request) {
        // Add to Firebase deliveryAgent collection
        const deliveryAgentRef = doc(collection(db, 'deliveryAgent'));
        await setDoc(deliveryAgentRef, {
          name: request.name,
          phone: request.phone,
          email: request.email,
          status: 'online',
          deliveries: 0,
          experience: request.experience,
          vehicle: request.vehicle,
          appliedDate: request.appliedDate,
          approvedDate: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Remove from requests (this is dummy data, in real app you'd update Firebase)
        setDeliveryAgentRequests(deliveryAgentRequests.filter(req => req.id !== requestId));
        
        toast.success(`Delivery agent request from ${request.name} approved!`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const request = deliveryAgentRequests.find(req => req.id === requestId);
      if (request) {
        // Remove from requests
        setDeliveryAgentRequests(deliveryAgentRequests.filter(req => req.id !== requestId));
        toast.success(`Delivery agent request from ${request.name} rejected!`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
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
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>

        {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'accepted').length}
          </div>
          <div className="text-sm text-gray-600">Accepted</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
      </div>
      {/* Delivery Partners Management */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-12 border border-gray-200">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Partners</h2>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Partners</h3>
            <div className="space-y-3">
              {deliveryPartners.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
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
        </div>
      </div>

      {/* Delivery Agent Requests */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-12 border border-gray-200">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Agent Requests</h2>
          <div className="space-y-4">
            {deliveryAgentRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No delivery agent requests at the moment.</p>
              </div>
            ) : (
              deliveryAgentRequests.map((request) => (
                <div key={request.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{request.name}</h4>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-600">{request.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">{request.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">Applied: {request.appliedDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">Experience: {request.experience}</span>
                        <span className="text-gray-600">Vehicle: {request.vehicle}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-12 border border-gray-200">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900">Order Management</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-amber-800 text-amber-300 hover:bg-amber-700'
                }`}
              >
                Pending Orders ({orders.filter(o => (o.status === 'pending' || o.status === 'accepted' || o.status === 'confirmed') && (o.paymentStatus === 'paid' || o.paymentStatus === undefined || o.paymentStatus === null)).length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'completed' 
                    ? 'bg-blue-600 text-white' 
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
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-amber-300">
              {searchQuery ? 'No orders found matching your search' : `No ${activeTab} orders found`}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                    Order ID
                  </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                    Delivery Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-900">
                      #{order.id.slice(-8)}
                    </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-900">
                      Rs.{order.finalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-900">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-900">
                      {order.deliveryPartnerName || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-600">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-900">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="px-3 py-1.5 bg-white border border-gray-600 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        {(order.status === 'pending' || order.status === 'accepted' || order.status === 'confirmed') && (order.paymentStatus === 'paid' || order.paymentStatus === undefined || order.paymentStatus === null) ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1.5 bg-white border border-blue-600 text-black rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
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
                            className="px-3 py-1.5 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Reject
                          </button>
                        )}
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleMarkAsDelivered(order.id)}
                            className="px-3 py-1.5 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors text-sm font-medium"
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
                    <p className="text-amber-100">{selectedOrder.userName || selectedOrder.customerName || selectedOrder.customerName || 'Not provided'}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Assign Delivery Partner</h3>
                  <p className="text-sm text-black mt-1">Select a delivery partner for this order</p>
                </div>
                <button
                  onClick={() => {
                    console.log('Closing modal');
                    setShowAssignModal(false);
                    setSelectedPartner('');
                  }}
                  className="text-gray-400 hover:text-black p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">Order Summary</h4>
                    <p className="text-sm text-black">Order #{selectedOrder.id ? selectedOrder.id.slice(-8) : 'Loading...'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-black mb-1">Customer</p>
                    <p className="text-sm font-medium text-black">{selectedOrder.userName || selectedOrder.customerName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black mb-1">Total Amount</p>
                    <p className="text-sm font-medium text-black">Rs.{selectedOrder.totalPrice ? selectedOrder.totalPrice.toFixed(2) : '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Partner Selection */}
              <div>
                <label className="block text-sm font-semibold text-black mb-3">
                  Select Delivery Partner
                </label>
                <div className="space-y-2">
                  {deliveryPartners.map((partner) => (
                    <label
                      key={partner.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPartner === partner.id
                          ? 'bg-gray-50 border-gray-400'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
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
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-black">{partner.name}</div>
                        <div className="text-sm text-black">{partner.phone}</div>
                        <div className="text-sm text-black">{partner.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    console.log('Cancel clicked');
                    setShowAssignModal(false);
                    setSelectedPartner('');
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-black rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Assign partner clicked for order:', selectedOrder.id);
                    handleAssignDelivery(selectedOrder.id);
                  }}
                  disabled={!selectedPartner}
                  className="px-4 py-2 bg-white border border-blue-600 text-black rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
