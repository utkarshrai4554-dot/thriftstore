import { doc, setDoc, serverTimestamp, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DeliveryAgentRequest {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  drivingLicense: string;
  address: string;
  experience?: string;
  availability: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  rejectionReason?: string;
}

export const createDeliveryAgentRequest = async (
  email: string,
  deliveryData: {
    displayName: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    drivingLicense: string;
    address: string;
    experience?: string;
    availability: string;
  }
): Promise<string> => {
  try {
    console.log('📝 Creating delivery agent request:', { email, displayName: deliveryData.displayName });
    
    // Create request in deliveryAgentRequests collection
    const requestId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestRef = doc(db, 'deliveryAgentRequests', requestId);
    
    const requestData: DeliveryAgentRequest = {
      id: requestId,
      displayName: deliveryData.displayName,
      email: email,
      phone: deliveryData.phone,
      vehicleType: deliveryData.vehicleType,
      vehicleNumber: deliveryData.vehicleNumber,
      drivingLicense: deliveryData.drivingLicense,
      address: deliveryData.address,
      experience: deliveryData.experience,
      availability: deliveryData.availability,
      status: 'pending',
      requestedAt: serverTimestamp()
    };
    
    await setDoc(requestRef, requestData);
    
    console.log('✅ Delivery agent request created:', requestId);
    return requestId;
    
  } catch (error) {
    console.error('❌ Error creating delivery agent request:', error);
    throw new Error('Failed to create delivery agent request');
  }
};

export const getPendingDeliveryAgentRequests = async (): Promise<DeliveryAgentRequest[]> => {
  try {
    console.log('📋 Fetching pending delivery agent requests');
    
    const requestsQuery = query(
      collection(db, 'deliveryAgentRequests'),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(requestsQuery);
    const requests = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as DeliveryAgentRequest[];
    
    console.log(`✅ Found ${requests.length} pending delivery agent requests`);
    return requests;
    
  } catch (error) {
    console.error('❌ Error fetching delivery agent requests:', error);
    throw new Error('Failed to fetch delivery agent requests');
  }
};

export const approveDeliveryAgentRequest = async (
  requestId: string,
  adminId: string,
  email: string,
  password: string,
  deliveryData: any
): Promise<void> => {
  try {
    console.log('✅ Approving delivery agent request:', requestId);
    
    // Update request status
    const requestRef = doc(db, 'deliveryAgentRequests', requestId);
    await updateDoc(requestRef, {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });
    
    // Create actual delivery agent account
    const { registerDeliveryGuy } = await import('./authService');
    await registerDeliveryGuy(
      email,
      password,
      deliveryData.displayName,
      deliveryData.phone,
      deliveryData.vehicleType,
      deliveryData.vehicleNumber,
      deliveryData.drivingLicense,
      deliveryData.address,
      deliveryData.experience,
      deliveryData.availability
    );
    
    console.log('✅ Delivery agent request approved and account created');
    
  } catch (error) {
    console.error('❌ Error approving delivery agent request:', error);
    throw new Error('Failed to approve delivery agent request');
  }
};

export const rejectDeliveryAgentRequest = async (
  requestId: string,
  adminId: string,
  rejectionReason: string
): Promise<void> => {
  try {
    console.log('❌ Rejecting delivery agent request:', requestId);
    
    const requestRef = doc(db, 'deliveryAgentRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
      rejectionReason
    });
    
    console.log('✅ Delivery agent request rejected');
    
  } catch (error) {
    console.error('❌ Error rejecting delivery agent request:', error);
    throw new Error('Failed to reject delivery agent request');
  }
};

export const getDeliveryAgentRequest = async (requestId: string): Promise<DeliveryAgentRequest | null> => {
  try {
    const requestRef = doc(db, 'deliveryAgentRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (requestDoc.exists()) {
      return requestDoc.data() as DeliveryAgentRequest;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching delivery agent request:', error);
    throw new Error('Failed to fetch delivery agent request');
  }
};
