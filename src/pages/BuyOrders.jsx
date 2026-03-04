import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc, collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const BuyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', localStorage.getItem('userId')),
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
        toast.error('Failed to load your orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Set up real-time listener for order updates
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'orders'),
        where('customerId', '==', localStorage.getItem('userId')),
        orderBy('createdAt', 'desc')
      ),
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
  }, [navigate]);

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

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Your order is pending approval from the seller.';
      case 'accepted': return 'Your order has been accepted! We\'ll notify you when it ships.';
      case 'rejected': return 'Your order has been rejected. Please contact support for details.';
      case 'shipped': return 'Your order has been shipped and is on its way!';
      case 'delivered': return 'Your order has been delivered successfully!';
      default: return 'Order status updated.';
    }
  };

  const openOrderDetails = (order) => {
    navigate(`/order-details/${order.id}`);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">Track your order status and delivery</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">You haven't placed any orders yet</div>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-500">Placed on {order.createdAt?.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => openOrderDetails(order)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-4 mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{getStatusMessage(order.status)}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">Total:</div>
                    <div className="font-semibold text-gray-900">₹{order.totalPrice?.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">Items:</div>
                  <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">Payment:</div>
                  <div className="text-sm text-gray-900">{order.paymentMethod || 'COD'}</div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  {order.items?.slice(0, 2).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} • ₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      +{order.items.length - 2} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-t pt-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 13.414M16 12a4 4 0 0 0 0-8 0m0 0l4 4m0 0l4 4m0 0l-4-4"/>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Shipping to:</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.shippingAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyOrders;
