import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Package, User, MapPin, Calendar, AlertCircle, Truck, Eye } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface DonationRequest {
  id: string;
  title: string;
  description: string;
  items: string;
  quantity: number;
  fulfilledQuantity: number;
  pickupAddress: string;
  category: string;
  urgency: string;
  status: 'pending' | 'admin_review' | 'approved' | 'assigned' | 'quality_check' | 'accepted' | 'rejected' | 'delivered';
  requestedBy: string;
  requestedByNGO: string;
  requestedAt: any;
  ngoEmail: string;
  ngoUID: string;
  assignedTo?: string;
  assignedAt?: any;
  qualityChecked?: boolean;
  qualityCheckedBy?: string;
  qualityCheckedAt?: any;
  qualityResult?: 'accepted' | 'rejected';
  deliveryAgent?: string;
  deliveredAt?: any;
  adminNotes?: string;
}

interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  currentAssignments: number;
  maxAssignments: number;
}

const AdminDonationReview = () => {
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchRequests();
    fetchDeliveryAgents();
  }, [userProfile]);

  const fetchRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'donationRequests'),
        where('status', 'in', ['admin_review', 'approved', 'assigned', 'quality_check'])
      );
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DonationRequest[];
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      const agentsQuery = query(collection(db, 'deliveryAgents'));
      const snapshot = await getDocs(agentsQuery);
      const agentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeliveryAgent[];
      setDeliveryAgents(agentsData);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'donationRequests', requestId), {
        status: 'approved',
        adminNotes: adminNotes,
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid
      });

      toast.success('Request approved successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'donationRequests', requestId), {
        status: 'rejected',
        adminNotes: adminNotes,
        rejectedAt: serverTimestamp(),
        rejectedBy: user?.uid
      });

      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedRequest || !selectedAgent) return;

    try {
      const agent = deliveryAgents.find(a => a.id === selectedAgent);
      if (!agent || !agent.isAvailable) {
        toast.error('Selected agent is not available');
        return;
      }

      await updateDoc(doc(db, 'donationRequests', selectedRequest.id), {
        status: 'assigned',
        deliveryAgent: selectedAgent,
        assignedAt: serverTimestamp(),
        assignedBy: user?.uid
      });

      // Update agent's current assignments
      await updateDoc(doc(db, 'deliveryAgents', selectedAgent), {
        currentAssignments: agent.currentAssignments + 1,
        isAvailable: agent.currentAssignments + 1 >= agent.maxAssignments ? false : true
      });

      toast.success('Delivery agent assigned successfully');
      setShowAssignModal(false);
      setSelectedAgent("");
      fetchRequests();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign delivery agent');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admin_review':
        return theme === 'dark' ? 'bg-warm/20 text-warm-foreground' : 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return theme === 'dark' ? 'bg-accent/20 text-accent-foreground' : 'bg-blue-100 text-blue-800';
      case 'assigned':
        return theme === 'dark' ? 'bg-success/20 text-success-foreground' : 'bg-green-100 text-green-800';
      case 'quality_check':
        return theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-purple-100 text-purple-800';
      case 'rejected':
        return theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-800';
      default:
        return theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'admin_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'assigned':
        return <Truck className="h-4 w-4" />;
      case 'quality_check':
        return <Eye className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className={`p-8 ${
          theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'
        }`}>
          <div className="text-center">
            <AlertCircle className={`h-16 w-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-destructive' : 'text-red-500'
            }`} />
            <h2 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-foreground' : 'text-gray-900'
            }`}>
              Access Denied
            </h2>
            <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
              You don't have permission to access this page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 ${
      theme === 'dark' ? 'bg-background' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-foreground' : 'text-gray-900'
          }`}>
            Donation Review Dashboard
          </h1>
          <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
            Review and manage donation requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className={theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    Pending Review
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {requests.filter(r => r.status === 'admin_review').length}
                  </p>
                </div>
                <Clock className={`h-8 w-8 ${
                  theme === 'dark' ? 'text-warm-foreground' : 'text-yellow-500'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    Approved
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className={`h-8 w-8 ${
                  theme === 'dark' ? 'text-accent-foreground' : 'text-blue-500'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    Assigned
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {requests.filter(r => r.status === 'assigned').length}
                  </p>
                </div>
                <Truck className={`h-8 w-8 ${
                  theme === 'dark' ? 'text-success-foreground' : 'text-green-500'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    Available Agents
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {deliveryAgents.filter(a => a.isAvailable).length}
                  </p>
                </div>
                <User className={`h-8 w-8 ${
                  theme === 'dark' ? 'text-warm-foreground' : 'text-purple-500'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card className={theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
              Donation Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                  Loading requests...
                </p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Package className={`h-16 w-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'
                }`} />
                <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                  No requests to review
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 ${
                      theme === 'dark' ? 'border-warm/20 bg-muted/50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${
                            theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                          }`}>
                            {request.title}
                          </h3>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <p className={`text-sm mb-2 ${
                          theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                        }`}>
                          {request.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Package className={`h-4 w-4 ${
                              theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
                            }`} />
                            <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                              {request.items} ({request.quantity})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className={`h-4 w-4 ${
                              theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
                            }`} />
                            <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                              {request.pickupAddress}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className={`h-4 w-4 ${
                              theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
                            }`} />
                            <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                              {request.requestedByNGO}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className={`h-4 w-4 ${
                              theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
                            }`} />
                            <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                              {request.requestedAt?.toDate?.()?.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          className={theme === 'dark' ? 'border-warm/30' : ''}
                        >
                          View Details
                        </Button>
                        
                        {request.status === 'admin_review' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAdminNotes("");
                                setShowAssignModal(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Review
                            </Button>
                          </>
                        )}
                        
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setSelectedAgent("");
                              setShowAssignModal(true);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            Assign Agent
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className={`max-w-2xl ${
            theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'
          }`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                Request Details
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                    Title
                  </Label>
                  <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                    {selectedRequest.title}
                  </p>
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                    Description
                  </Label>
                  <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                    {selectedRequest.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                      Items Required
                    </Label>
                    <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                      {selectedRequest.items} ({selectedRequest.quantity})
                    </p>
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                      Fulfilled
                    </Label>
                    <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                      {selectedRequest.fulfilledQuantity || 0}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                    Pickup Address
                  </Label>
                  <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                    {selectedRequest.pickupAddress}
                  </p>
                </div>
                {selectedRequest.adminNotes && (
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                      Admin Notes
                    </Label>
                    <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                      {selectedRequest.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Review/Assign Modal */}
        <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <DialogContent className={`max-w-md ${
            theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'
          }`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                {selectedRequest?.status === 'admin_review' ? 'Review Request' : 'Assign Delivery Agent'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                {selectedRequest.status === 'admin_review' && (
                  <>
                    <div>
                      <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                        Admin Notes
                      </Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add your review notes..."
                        className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(selectedRequest.id)}
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </>
                )}
                
                {selectedRequest.status === 'approved' && (
                  <>
                    <div>
                      <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                        Select Delivery Agent
                      </Label>
                      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}>
                          <SelectValue placeholder="Choose an agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryAgents
                            .filter(agent => agent.isAvailable)
                            .map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name} ({agent.currentAssignments}/{agent.maxAssignments} assignments)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAssignAgent}
                      disabled={!selectedAgent}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Assign Agent
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDonationReview;
