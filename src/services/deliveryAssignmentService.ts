import { doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  items: any[];
  finalAmount: number;
  shippingAddress: any;
  status: string;
  paymentStatus?: string;
  createdAt: any;
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  deliveryAgentStatus?: 'pending' | 'accepted' | 'declined' | 'assigned';
  assignedAt?: any;
  deliveryAgentResponseTime?: any;
}

export interface DeliveryAgent {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  status: 'online' | 'offline' | 'busy';
  totalDeliveries: number;
  rating: number;
  availability: string;
  currentOrderId?: string;
  isAvailable: boolean;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  assignedAt: any;
  respondedAt?: any;
  responseTime?: number;
  expiresAt: any;
}

// Get available delivery agents
export const getAvailableDeliveryAgents = async (): Promise<DeliveryAgent[]> => {
  try {
    const agentsQuery = query(
      collection(db, 'deliveryAgents'),
      where('status', '==', 'online'),
      where('isAvailable', '==', true)
    );
    
    const querySnapshot = await getDocs(agentsQuery);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as DeliveryAgent[];
  } catch (error) {
    console.error('Error fetching available delivery agents:', error);
    return [];
  }
};

// Assign order to a delivery agent
export const assignOrderToAgent = async (
  orderId: string,
  agentId: string,
  agent: DeliveryAgent
): Promise<string> => {
  try {
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create delivery assignment record
    const assignmentRef = doc(db, 'deliveryAssignments', assignmentId);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    
    await setDoc(assignmentRef, {
      id: assignmentId,
      orderId,
      agentId,
      agentName: agent.displayName,
      agentEmail: agent.email,
      agentPhone: agent.phone,
      status: 'pending',
      assignedAt: serverTimestamp(),
      expiresAt,
    } as DeliveryAssignment);

    // Update order with delivery assignment
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      deliveryAgentId: agentId,
      deliveryAgentName: agent.displayName,
      deliveryAgentStatus: 'pending',
      assignedAt: serverTimestamp(),
    });

    // Update agent status to busy
    const agentRef = doc(db, 'deliveryAgents', agentId);
    await updateDoc(agentRef, {
      status: 'busy',
      currentOrderId: orderId,
      isAvailable: false,
    });

    console.log(`Order ${orderId} assigned to agent ${agent.displayName}`);
    return assignmentId;
    
  } catch (error) {
    console.error('Error assigning order to agent:', error);
    throw new Error('Failed to assign order to delivery agent');
  }
};

// Accept delivery assignment
export const acceptDeliveryAssignment = async (assignmentId: string): Promise<void> => {
  try {
    const assignmentRef = doc(db, 'deliveryAssignments', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    
    if (!assignmentDoc.exists()) {
      throw new Error('Assignment not found');
    }

    const assignment = assignmentDoc.data() as DeliveryAssignment;
    
    // Update assignment status
    await updateDoc(assignmentRef, {
      status: 'accepted',
      respondedAt: serverTimestamp(),
      responseTime: Date.now() - (assignment.assignedAt?.toMillis?.() || Date.now()),
    });

    // Update order status
    const orderRef = doc(db, 'orders', assignment.orderId);
    await updateDoc(orderRef, {
      deliveryAgentStatus: 'accepted',
      status: 'assigned',
      deliveryAgentResponseTime: serverTimestamp(),
    });

    // Update agent status
    const agentRef = doc(db, 'deliveryAgents', assignment.agentId);
    await updateDoc(agentRef, {
      status: 'busy',
      totalDeliveries: (await getDoc(agentRef)).data()?.totalDeliveries + 1 || 1,
    });

    // Remove other pending assignments for this order
    const pendingAssignmentsQuery = query(
      collection(db, 'deliveryAssignments'),
      where('orderId', '==', assignment.orderId),
      where('status', '==', 'pending'),
      where('id', '!=', assignmentId)
    );
    
    const pendingSnapshot = await getDocs(pendingAssignmentsQuery);
    const batch = pendingSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(batch);

    console.log(`Assignment ${assignmentId} accepted by agent ${assignment.agentName}`);
    
  } catch (error) {
    console.error('Error accepting delivery assignment:', error);
    throw new Error('Failed to accept delivery assignment');
  }
};

// Decline delivery assignment
export const declineDeliveryAssignment = async (assignmentId: string): Promise<void> => {
  try {
    const assignmentRef = doc(db, 'deliveryAssignments', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    
    if (!assignmentDoc.exists()) {
      throw new Error('Assignment not found');
    }

    const assignment = assignmentDoc.data() as DeliveryAssignment;
    
    // Update assignment status
    await updateDoc(assignmentRef, {
      status: 'declined',
      respondedAt: serverTimestamp(),
      responseTime: Date.now() - (assignment.assignedAt?.toMillis?.() || Date.now()),
    });

    // Update agent status back to available
    const agentRef = doc(db, 'deliveryAgents', assignment.agentId);
    await updateDoc(agentRef, {
      status: 'online',
      currentOrderId: null,
      isAvailable: true,
    });

    console.log(`Assignment ${assignmentId} declined by agent ${assignment.agentName}`);
    
    // Try to assign to next available agent
    await tryAssignToNextAgent(assignment.orderId);
    
  } catch (error) {
    console.error('Error declining delivery assignment:', error);
    throw new Error('Failed to decline delivery assignment');
  }
};

// Try to assign order to next available agent
const tryAssignToNextAgent = async (orderId: string): Promise<void> => {
  try {
    const availableAgents = await getAvailableDeliveryAgents();
    
    if (availableAgents.length === 0) {
      console.log('No available agents for order:', orderId);
      // Update order status to indicate no agents available
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        deliveryAgentStatus: 'no_agents_available',
      });
      return;
    }

    // Get order details
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
      console.error('Order not found:', orderId);
      return;
    }

    // Get agents who haven't been assigned this order yet
    const assignmentsQuery = query(
      collection(db, 'deliveryAssignments'),
      where('orderId', '==', orderId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignedAgentIds = new Set(assignmentsSnapshot.docs.map(doc => doc.data().agentId));
    
    const availableAgentsNotAssigned = availableAgents.filter(agent => !assignedAgentIds.has(agent.uid));
    
    if (availableAgentsNotAssigned.length === 0) {
      console.log('All available agents have been assigned to order:', orderId);
      return;
    }

    // Assign to first available agent
    const nextAgent = availableAgentsNotAssigned[0];
    await assignOrderToAgent(orderId, nextAgent.uid, nextAgent);
    
  } catch (error) {
    console.error('Error trying to assign to next agent:', error);
  }
};

// Get pending assignments for an agent
export const getPendingAssignmentsForAgent = async (agentId: string): Promise<DeliveryAssignment[]> => {
  try {
    const assignmentsQuery = query(
      collection(db, 'deliveryAssignments'),
      where('agentId', '==', agentId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(assignmentsQuery);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as DeliveryAssignment[];
  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    return [];
  }
};

// Listen for real-time updates on assignments for an agent
export const listenForAssignments = (agentId: string, callback: (assignments: DeliveryAssignment[]) => void) => {
  const assignmentsQuery = query(
    collection(db, 'deliveryAssignments'),
    where('agentId', '==', agentId),
    where('status', '==', 'pending')
  );

  return onSnapshot(assignmentsQuery, (snapshot) => {
    const assignments = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as DeliveryAssignment[];
    callback(assignments);
  });
};

// Clean up expired assignments
export const cleanupExpiredAssignments = async (): Promise<void> => {
  try {
    const now = new Date();
    const expiredQuery = query(
      collection(db, 'deliveryAssignments'),
      where('status', '==', 'pending'),
      where('expiresAt', '<', now)
    );
    
    const expiredSnapshot = await getDocs(expiredQuery);
    
    for (const doc of expiredSnapshot.docs) {
      const assignment = doc.data() as DeliveryAssignment;
      
      // Mark assignment as expired
      await updateDoc(doc.ref, {
        status: 'expired',
        respondedAt: serverTimestamp(),
      });

      // Update agent status back to available
      const agentRef = doc(db, 'deliveryAgents', assignment.agentId);
      await updateDoc(agentRef, {
        status: 'online',
        currentOrderId: null,
        isAvailable: true,
      });

      // Try to assign to next agent
      await tryAssignToNextAgent(assignment.orderId);
    }
    
    console.log(`Cleaned up ${expiredSnapshot.docs.length} expired assignments`);
    
  } catch (error) {
    console.error('Error cleaning up expired assignments:', error);
  }
};
