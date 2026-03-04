import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const OrderPlacement = ({ product, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    paymentMethod: 'COD',
    notes: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!localStorage.getItem('token')) {
      toast.error('Please login to place an order');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerId: localStorage.getItem('userId'),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: [{
          id: product.id,
          name: product.title,
          price: product.sellingPrice,
          quantity: formData.quantity,
          image: product.images?.[0] || '/placeholder-product.jpg',
          sellerId: product.sellerId
        }],
        totalPrice: product.sellingPrice * formData.quantity,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = doc(db, 'orders', `order_${Date.now()}_${localStorage.getItem('userId')}`);
      await setDoc(orderRef, orderData);

      toast.success('Order placed successfully! We\'ll notify you when it\'s accepted.');
      onClose();
      
      // Navigate to orders page
      setTimeout(() => {
        navigate('/my-orders');
      }, 2000);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Place Order</h3>
              <p className="text-sm text-gray-500">Complete your order details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Product Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={product.images?.[0] || '/placeholder-product.jpg'}
                alt={product.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{product.title}</h4>
                <p className="text-sm text-gray-500">{product.brand}</p>
                <p className="text-sm font-medium text-green-600">₹{product.sellingPrice}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Address *
              </label>
              <textarea
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your complete shipping address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="COD">Cash on Delivery</option>
                <option value="UPI">UPI</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Any special instructions..."
              />
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{product.sellingPrice * formData.quantity}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-green-600">₹{product.sellingPrice * formData.quantity}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderPlacement;
