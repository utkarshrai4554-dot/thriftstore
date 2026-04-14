import { doc, setDoc, serverTimestamp, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface DeliveryAgentRequest {
  id: string;
  displayName: string;
  email: string;
  password?: string; // Password stored for use during approval
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
  processed?: boolean;
  deletionFailed?: boolean;
}

export const createDeliveryAgentRequest = async (
  email: string,
  password: string,
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
      password: password, // Store password for use during approval
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
    console.log('Fetching pending delivery agent requests');
    
    const requestsQuery = query(
      collection(db, 'deliveryAgentRequests'),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(requestsQuery);
    const requests = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as DeliveryAgentRequest[];
    
    // Filter out processed requests (in case deletion failed)
    const pendingRequests = requests.filter(request => !request.processed);
    
    console.log(`Found ${pendingRequests.length} pending delivery agent requests (filtered from ${requests.length} total)`);
    return pendingRequests;
    
  } catch (error) {
    console.error('Error fetching delivery agent requests:', error);
    throw new Error('Failed to fetch delivery agent requests');
  }
};

export const approveDeliveryAgentRequest = async (
  requestId: string,
  adminId: string,
  email: string,
  password: string,
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
): Promise<void> => {
  try {
    console.log(' Approving delivery agent request:', requestId);
    
    // Get original request details
    const requestRef = doc(db, 'deliveryAgentRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Delivery agent request not found');
    }
    
    const requestData = requestDoc.data();
    
    // Create Firebase Authentication account for delivery agent
    let userCredential;
    try {
      console.log(' Creating Firebase Auth account for delivery agent:', email);
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(' Firebase Auth account created successfully for:', userCredential.user.email);
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log(' Email already exists in Firebase Auth, using existing account');
        // Try to sign in to get the user credential
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        throw new Error(`Failed to create Firebase Auth account: ${authError.message}`);
      }
    }
    
    // Create user document in users collection
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      displayName: requestData.displayName,
      phone: requestData.phone,
      address: requestData.address,
      role: 'delivery',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isEmailVerified: false,
      isActive: true
    });
    
    console.log(' User document created in users collection');
    
    // Create delivery agent approval record
    await setDoc(doc(db, 'deliveryAgents', userCredential.user.uid), {
      email: email,
      displayName: requestData.displayName,
      phone: requestData.phone,
      vehicleType: requestData.vehicleType,
      vehicleNumber: requestData.vehicleNumber,
      drivingLicense: requestData.drivingLicense,
      address: requestData.address,
      experience: requestData.experience,
      availability: requestData.availability,
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: adminId,
      requestId: requestId,
      requestedAt: requestData.requestedAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(' Delivery agent approval record created:', userCredential.user.uid);
    
    // Sign out admin to prevent session conflicts
    try {
      await auth.signOut();
      console.log(' Admin signed out successfully after delivery agent approval');
    } catch (signOutError) {
      console.error(' Error signing out admin:', signOutError);
      // Don't throw error - approval should still work even if sign out fails
    }
    
    // Update request status to approved before deletion
    try {
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        processed: true
      });
      console.log(' Request status updated to approved:', requestId);
      
      // Wait a moment for update to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Delete request
      await deleteDoc(requestRef);
      console.log(' Delivery agent request deleted successfully:', requestId);
    } catch (deleteError) {
      console.error('Error deleting delivery agent request:', deleteError);
      // Try to update status to approved even if deletion fails
      try {
        await updateDoc(requestRef, {
          status: 'approved',
          reviewedAt: serverTimestamp(),
          reviewedBy: adminId,
          processed: true,
          deletionFailed: true
        });
        console.log('Request marked as approved but deletion failed:', requestId);
      } catch (updateError) {
        console.error('Failed to update request status:', updateError);
      }
    }
    
    // Send approval email notification
    await sendApprovalEmail(email, requestData.displayName, password);
    
    console.log(' Delivery agent request approved and account created successfully');
    
  } catch (error) {
    console.error(' Error approving delivery agent request:', error);
    throw new Error('Failed to approve delivery agent request');
  }
};

export const rejectDeliveryAgentRequest = async (
  requestId: string,
  adminId: string,
  rejectionReason: string
): Promise<void> => {
  try {
    console.log('Rejecting delivery agent request:', requestId);
    
    const requestRef = doc(db, 'deliveryAgentRequests', requestId);
    
    // Get request details for logging
    const requestDoc = await getDoc(requestRef);
    if (requestDoc.exists()) {
      const requestData = requestDoc.data();
      console.log('Rejecting request for:', requestData.displayName, requestData.email);
    }
    
    // Update request status before deletion
    await updateDoc(requestRef, {
      status: 'rejected',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
      rejectionReason
    });
    
    // Delete the request after rejection
    await deleteDoc(requestRef);
    console.log('Delivery agent request rejected and deleted:', requestId);
    
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
    console.error(' Error fetching delivery agent request:', error);
    throw new Error('Failed to fetch delivery agent request');
  }
};

export const sendApprovalEmail = async (email: string, displayName: string, password: string): Promise<void> => {
  try {
    console.log('Sending approval email to:', email);
    
    // Get API URL from environment or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Send approval email via backend
    const response = await fetch(`${apiUrl}/api/send-approval-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        displayName,
        password,
        subject: 'StyleEase - Delivery Agent Application Approved!',
        template: 'delivery_agent_approval'
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send approval email');
    }
    
    const result = await response.json();
    console.log('Approval email sent successfully:', result);
    
  } catch (error) {
    console.error('Error sending approval email:', error);
    // Don't throw error - approval should still work even if email fails
  }
};
