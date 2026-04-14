import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, User, Phone, MapPin, CheckCircle, XCircle, Clock, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPendingDeliveryAgentRequests, 
  approveDeliveryAgentRequest, 
  rejectDeliveryAgentRequest,
  DeliveryAgentRequest 
} from '@/services/deliveryAgentService';
import { useAuth } from '@/hooks/useAuth';

export const DeliveryAgentApproval: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeliveryAgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryAgentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching delivery agent requests...');
      const pendingRequests = await getPendingDeliveryAgentRequests();
      console.log('Fetched requests:', pendingRequests);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch delivery agent requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: DeliveryAgentRequest) => {
    if (!user) return;

    try {
      setIsProcessing(true);
      
      // Extract password from request data (stored during registration)
      const registrationPassword = request.password || 'TempPass123!'; // Fallback for backward compatibility
      
      await approveDeliveryAgentRequest(
        request.id,
        user.uid,
        request.email,
        registrationPassword,
        {
          displayName: request.displayName,
          phone: request.phone,
          vehicleType: request.vehicleType,
          vehicleNumber: request.vehicleNumber,
          drivingLicense: request.drivingLicense,
          address: request.address,
          experience: request.experience,
          availability: request.availability
        }
      );

      toast.success(`Delivery agent ${request.displayName} approved successfully! Account created with their chosen password.`);
      fetchRequests(); // Refresh list
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve delivery agent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setIsProcessing(true);
      
      await rejectDeliveryAgentRequest(
        selectedRequest.id,
        user.uid,
        rejectionReason
      );

      toast.success(`Delivery agent request rejected`);
      fetchRequests(); // Refresh the list
      setSelectedRequest(null);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject delivery agent');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Delivery Agent Approvals</h2>
          <p className="text-muted-foreground">Review and approve delivery agent registration requests</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-600" />
            <span className="text-lg font-semibold">{requests.length} Pending</span>
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
            <p className="text-muted-foreground">There are no delivery agent registration requests waiting for approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Truck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-black">{request.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{request.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.vehicleType} - {request.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Availability: {request.availability}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Driving License:</p>
                      <p className="text-sm text-muted-foreground">{request.drivingLicense}</p>
                    </div>
                    {request.experience && (
                      <div>
                        <p className="text-sm font-medium">Experience:</p>
                        <p className="text-sm text-muted-foreground">{request.experience}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">Requested:</p>
                      <p className="text-sm text-muted-foreground">{formatDate(request.requestedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedRequest(request)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Delivery Agent Request Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Personal Information</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Name:</strong> {request.displayName}</p>
                              <p><strong>Email:</strong> {request.email}</p>
                              <p><strong>Phone:</strong> {request.phone}</p>
                              <p><strong>Address:</strong> {request.address}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Vehicle Information</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Type:</strong> {request.vehicleType}</p>
                              <p><strong>Number:</strong> {request.vehicleNumber}</p>
                              <p><strong>License:</strong> {request.drivingLicense}</p>
                              <p><strong>Availability:</strong> {request.availability}</p>
                            </div>
                          </div>
                        </div>
                        {request.experience && (
                          <div>
                            <h4 className="font-medium mb-2">Experience</h4>
                            <p className="text-sm text-muted-foreground">{request.experience}</p>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium mb-2">Request Timeline</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Requested:</strong> {formatDate(request.requestedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(request)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Delivery Agent Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Please provide a reason for rejecting this delivery agent request:
                          </p>
                          <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedRequest(null);
                              setRejectionReason('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Request
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryAgentApproval;
