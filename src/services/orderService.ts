import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Order {
  id?: string;
  userId: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  couponCode?: string;
  pointsUsed?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  estimatedDelivery?: Date | Timestamp;
  trackingNumber?: string;
  notes?: string;
  deliveryPartner?: string;
  deliveryPartnerName?: string;
  assignedAt?: Date | Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  category?: string;
}

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const ordersRef = collection(db, 'orders');
    const order: Order = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(ordersRef, order);
    console.log('✅ Order created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    // Sort in JavaScript instead of Firestore query to avoid index requirement
    const sortedDocs = querySnapshot.docs.sort((a, b) => 
      (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0)
    );
    
    sortedDocs.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      } as Order);
    });
    
    return orders;
  } catch (error: any) {
    console.error('❌ Error fetching user orders:', error);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (orderDoc.exists()) {
      return {
        id: orderDoc.id,
        ...orderDoc.data()
      } as Order;
    }
    return null;
  } catch (error: any) {
    console.error('❌ Error fetching order:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], notes?: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: Partial<Order> = {
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    // Add estimated delivery for shipped orders
    if (status === 'shipped') {
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // 7 days from now
      updateData.estimatedDelivery = estimatedDelivery;
    }
    
    await updateDoc(orderRef, updateData);
    console.log('✅ Order status updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
};

export const updatePaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus']): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus,
      updatedAt: new Date()
    });
    console.log('✅ Payment status updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating payment status:', error);
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
};

export const addTrackingNumber = async (orderId: string, trackingNumber: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      trackingNumber,
      status: 'shipped',
      updatedAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    console.log('✅ Tracking number added successfully');
  } catch (error: any) {
    console.error('❌ Error adding tracking number:', error);
    throw new Error(`Failed to add tracking number: ${error.message}`);
  }
};

export const cancelOrder = async (orderId: string, reason?: string): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: Partial<Order> = {
      status: 'cancelled',
      paymentStatus: 'failed',
      updatedAt: new Date()
    };
    
    if (reason) {
      updateData.notes = `Cancelled: ${reason}`;
    }
    
    await updateDoc(orderRef, updateData);
    console.log('✅ Order cancelled successfully');
  } catch (error: any) {
    console.error('❌ Error cancelling order:', error);
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      } as Order);
    });
    
    return orders;
  } catch (error: any) {
    console.error('❌ Error fetching all orders:', error);
    throw new Error(`Failed to fetch all orders: ${error.message}`);
  }
};
