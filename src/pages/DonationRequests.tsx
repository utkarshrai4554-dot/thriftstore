import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Heart, Package, MapPin, Users, Clock } from "lucide-react";

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
  status: string;
  requestedBy: string;
  requestedByNGO: string;
  requestedAt: any;
  ngoEmail: string;
  ngoUID: string;
}

const DonationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateForm, setDonateForm] = useState({
    quantity: 1,
    message: '',
    pickupAddress: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDonationRequests();
  }, []);

  const fetchDonationRequests = async () => {
    try {
      const q = query(
        collection(db, 'donationRequests'),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DonationRequest[];
      
      // Sort by urgency (urgent first) and then by date
      const sortedData = data.sort((a, b) => {
        const urgencyOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        if (urgencyOrder[a.urgency as keyof typeof urgencyOrder] !== urgencyOrder[b.urgency as keyof typeof urgencyOrder]) {
          return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
        }
        return b.requestedAt?.toDate?.().getTime() || 0 - (a.requestedAt?.toDate?.().getTime() || 0);
      });
      
      setRequests(sortedData);
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      toast.error('Failed to load donation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!user || !selectedRequest) {
      toast.error('Please login to donate');
      return;
    }

    if (!donateForm.quantity || donateForm.quantity < 1) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const remainingNeeded = (selectedRequest.quantity || 1) - (selectedRequest.fulfilledQuantity || 0);
    if (donateForm.quantity > remainingNeeded) {
      toast.error(`Only ${remainingNeeded} items needed for this request`);
      return;
    }

    if (!donateForm.pickupAddress) {
      toast.error('Please provide pickup address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create donation record
      const donationData = {
        donorName: user.displayName || user.email || 'Anonymous',
        donorEmail: user.email || '',
        donorPhone: user.phoneNumber || '',
        pickupAddress: donateForm.pickupAddress,
        items: selectedRequest.items,
        description: donateForm.message,
        quantity: donateForm.quantity,
        status: 'pending',
        assignedNGO: selectedRequest.ngoUID,
        assignedNGOName: selectedRequest.requestedByNGO,
        requestId: selectedRequest.id,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'donations'), donationData);

      toast.success(`Thank you for donating ${donateForm.quantity} ${selectedRequest.items}!`);
      setShowDonateModal(false);
      setDonateForm({ quantity: 1, message: '', pickupAddress: '' });
      setSelectedRequest(null);
      
      // Refresh requests
      fetchDonationRequests();
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('Failed to submit donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDonateModal = (request: DonationRequest) => {
    setSelectedRequest(request);
    setDonateForm({
      quantity: 1,
      message: '',
      pickupAddress: ''
    });
    setShowDonateModal(true);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Normal</Badge>;
    }
  };

  const getProgressPercentage = (request: DonationRequest) => {
    return Math.round(((request.fulfilledQuantity || 0) / (request.quantity || 1)) * 100);
  };

  const getRemainingNeeded = (request: DonationRequest) => {
    return (request.quantity || 1) - (request.fulfilledQuantity || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-blue-600">Loading donation requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Donation Requests</h1>
          <p className="text-lg text-gray-600">Help NGOs fulfill their donation needs</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span>{requests.length} active requests</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Make a difference today</span>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No active donation requests</h3>
            <p className="text-gray-600">Check back later for new opportunities to help</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => {
              const progressPercentage = getProgressPercentage(request);
              const remainingNeeded = getRemainingNeeded(request);
              const isFullyFulfilled = remainingNeeded <= 0;

              return (
                <Card key={request.id} className={`shadow-lg hover:shadow-xl transition-shadow ${isFullyFulfilled ? 'opacity-75' : ''}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{request.title}</CardTitle>
                      {getUrgencyBadge(request.urgency)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span className="capitalize">{request.category}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-3">{request.description}</p>
                    </div>

                    {/* Items and Progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{request.items}</span>
                        <span className="text-sm text-gray-500">
                          {request.fulfilledQuantity || 0} / {request.quantity}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progressPercentage >= 100 ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{progressPercentage}% fulfilled</span>
                          {!isFullyFulfilled && (
                            <span className="text-green-600 font-medium">
                              {remainingNeeded} still needed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* NGO Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{request.requestedByNGO}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{request.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {request.requestedAt?.toDate ? 
                            new Date(request.requestedAt.toDate()).toLocaleDateString() : 
                            'Recently'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Dialog open={showDonateModal && selectedRequest?.id === request.id} onOpenChange={setShowDonateModal}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={() => openDonateModal(request)}
                          disabled={isFullyFulfilled || !user}
                        >
                          {isFullyFulfilled ? 'Request Fulfilled' : user ? 'Donate Items' : 'Login to Donate'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Donate to {selectedRequest?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="quantity">Quantity to Donate</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              max={remainingNeeded}
                              value={donateForm.quantity}
                              onChange={(e) => setDonateForm({...donateForm, quantity: parseInt(e.target.value) || 1})}
                              placeholder={`Max: ${remainingNeeded} items`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {remainingNeeded} items still needed
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea
                              id="message"
                              value={donateForm.message}
                              onChange={(e) => setDonateForm({...donateForm, message: e.target.value})}
                              placeholder="Add a message for the NGO..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="pickupAddress">Your Pickup Address</Label>
                            <Input
                              id="pickupAddress"
                              value={donateForm.pickupAddress}
                              onChange={(e) => setDonateForm({...donateForm, pickupAddress: e.target.value})}
                              placeholder="Where can items be picked up?"
                            />
                          </div>
                          <Button 
                            onClick={handleDonate}
                            disabled={isSubmitting || !user}
                            className="w-full"
                          >
                            {isSubmitting ? 'Submitting...' : `Donate ${donateForm.quantity} ${selectedRequest?.items}`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationRequests;
