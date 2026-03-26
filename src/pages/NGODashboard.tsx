import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Truck, CheckCircle, XCircle, Clock, Plus, Package, HandHeart, Users, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getUserProfile } from "@/services/userService";

interface Donation {
  id: string;
  userId: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  pickupAddress: string;
  items: string;
  description: string;
  quantity: number;
  cause?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up';
  assignedNGO?: string;
  assignedNGOName?: string;
  requestId?: string; // Link to donation request
  rejectedBy?: string[]; // Array of NGO UIDs who rejected this donation
  images?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  createdAt: any;
  acceptedAt?: any;
  pickedUpAt?: any;
}

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
  donations?: Donation[]; // List of donations fulfilling this request
}

const NGODashboard = () => {
  const { user, userProfile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationRequests, setDonationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    items: '',
    quantity: 1,
    pickupAddress: '',
    category: 'clothing',
    urgency: 'normal'
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [viewMode, setViewMode] = useState<'requested' | 'unsolicited'>('requested');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchDonations();
    fetchDonationRequests();
  }, []);

  const fetchDonations = async () => {
    try {
      // Fetch donations assigned to this NGO AND unassigned general donations
      const assignedQuery = query(
        collection(db, 'donations'),
        where('assignedNGO', '==', user?.uid)
      );
      
      const unassignedQuery = query(
        collection(db, 'donations'),
        where('assignedNGO', '==', null)
      );
      
      const [assignedSnapshot, unassignedSnapshot] = await Promise.all([
        getDocs(assignedQuery),
        getDocs(unassignedQuery)
      ]);
      
      const assignedData = assignedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      
      const unassignedData = unassignedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      
      // Combine both arrays
      const allDonations = [...assignedData, ...unassignedData];
      
      console.log('🔍 NGO Dashboard - Fetched assigned donations:', assignedData);
      console.log('🔍 NGO Dashboard - Fetched unassigned donations:', unassignedData);
      console.log('🔍 NGO Dashboard - All donations:', allDonations);
      
      setDonations(allDonations);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationRequests = async () => {
    try {
      // Fetch donation requests made by this NGO
      const q = query(
        collection(db, 'donationRequests'),
        where('ngoUID', '==', user?.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDonationRequests(data);
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      toast.error('Failed to fetch donation requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRejectDonation = async (donationId: string) => {
    try {
      // Add this NGO to the rejected list for this donation
      const donationRef = doc(db, 'donations', donationId);
      const donationDoc = await getDoc(donationRef);
      const donationData = donationDoc.data();
      
      const rejectedBy = donationData?.rejectedBy || [];
      if (!rejectedBy.includes(user?.uid)) {
        rejectedBy.push(user?.uid);
      }
      
      await updateDoc(donationRef, {
        rejectedBy: rejectedBy,
        assignedNGO: null,
        assignedNGOName: null,
        status: 'rejected', // Set status to rejected
        rejectedAt: new Date(),
        rejectedByNGO: user?.uid
      });
      
      toast.success('Donation rejected. Admin will reassign to another NGO.');
      fetchDonations();
    } catch (error) {
      console.error('Error rejecting donation:', error);
      toast.error('Failed to reject donation');
    }
  };

  const handleAcceptDonation = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: user?.uid,
        assignedNGO: user?.uid,
        assignedNGOName: user?.displayName || user?.email?.split('@')[0] || 'NGO',
        ngoAcceptedAt: new Date()
      });
      
      toast.success('Donation accepted successfully!');
      fetchDonations();
    } catch (error) {
      console.error('Error accepting donation:', error);
      toast.error('Failed to accept donation');
    }
  };

  const handleMarkPickedUp = async (donationId: string) => {
    try {
      // Get the donation details first
      const donationRef = doc(db, 'donations', donationId);
      const donationDoc = await getDoc(donationRef);
      const donationData = donationDoc.data();
      
      // Update donation status to picked_up
      await updateDoc(donationRef, {
        status: 'picked_up',
        pickedUpAt: new Date()
      });
      
      // If this donation is linked to a request, update the fulfilled quantity
      if (donationData?.requestId) {
        const requestRef = doc(db, 'donationRequests', donationData.requestId);
        const requestDoc = await getDoc(requestRef);
        const requestData = requestDoc.data();
        
        if (requestData) {
          const currentFulfilled = requestData.fulfilledQuantity || 0;
          await updateDoc(requestRef, {
            fulfilledQuantity: currentFulfilled + (donationData.quantity || 1)
          });
        }
      }
      
      toast.success('Donation marked as picked up!');
      fetchDonations();
      fetchDonationRequests();
    } catch (error) {
      console.error('Error marking as picked up:', error);
      toast.error('Failed to update donation status');
    }
  };

  const handleRequestDonation = async () => {
    if (!requestForm.title || !requestForm.items || !requestForm.pickupAddress || requestForm.quantity < 1) {
      toast.error('Please fill all required fields and set a valid quantity');
      return;
    }

    setIsSubmittingRequest(true);
    
    try {
      const donationData = {
        title: requestForm.title,
        description: requestForm.description,
        items: requestForm.items,
        quantity: requestForm.quantity,
        fulfilledQuantity: 0, // Start with 0 fulfilled
        pickupAddress: requestForm.pickupAddress,
        category: requestForm.category,
        urgency: requestForm.urgency,
        status: 'pending',
        requestedBy: user?.uid,
        requestedByNGO: user?.displayName || user?.email,
        requestedAt: new Date(),
        ngoEmail: user?.email,
        ngoUID: user?.uid
      };

      await addDoc(collection(db, 'donationRequests'), donationData);
      
      toast.success('Donation request submitted successfully!');
      setShowRequestModal(false);
      setRequestForm({
        title: '',
        description: '',
        items: '',
        quantity: 1,
        pickupAddress: '',
        category: 'clothing',
        urgency: 'normal'
      });
      
      // Refresh donation requests list
      fetchDonationRequests();
    } catch (error) {
      console.error('Error creating donation request:', error);
      toast.error('Failed to submit donation request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-success/20 text-success-foreground">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive-foreground">Rejected</Badge>;
      case 'picked_up':
        return <Badge className="bg-accent/20 text-accent-foreground">Picked Up</Badge>;
      default:
        return <Badge className="bg-warm/20 text-warm-foreground">Pending</Badge>;
    }
  };

  const filteredDonations = donations.filter(donation => {
    // Filter by viewMode first
    if (viewMode === 'requested' && !donation.requestId) return false;
    if (viewMode === 'unsolicited' && donation.requestId) return false;
    
    // Then filter by status
    if (filter === 'all') return true;
    return donation.status === filter;
  });

  // Get NGO info from user profile or ngoRegistrations
  const getNGOInfo = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    return user?.email || 'NGO';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please login to access NGO dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="font-display text-4xl font-bold mb-1 text-foreground">NGO Dashboard</h1>
              <p className="text-muted-foreground">Manage donation requests and pickups</p>
              <p className="text-sm text-muted-foreground">Welcome, {getNGOInfo()}!</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Total Donations</p>
                  <p className="text-3xl font-bold text-foreground">{donations.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-warm">Pending Acceptance</p>
                  <p className="text-3xl font-bold text-warm-foreground">{donations.filter(d => d.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-warm" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-success">Accepted</p>
                  <p className="text-3xl font-bold text-success-foreground">{donations.filter(d => d.status === 'accepted').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent">Completed</p>
                  <p className="text-3xl font-bold text-accent-foreground">{donations.filter(d => d.status === 'picked_up').length}</p>
                </div>
                <Truck className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          {/* Make a Donation Form - Full Width Below */}
          <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader className="bg-muted border-b">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Request New Donation
            </CardTitle>
            <p className="text-sm text-muted-foreground">Create a new donation request for donors</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-2xl">
                <p className="font-medium text-foreground mb-4 text-center">Need donations for your cause?</p>
                <p className="text-sm text-muted-foreground mb-6 text-center">Create a request and donors will be able to fulfill it</p>
                <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Request Donation
                    </Button>
                  </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Request Donation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Request Title</Label>
                          <Input
                            id="title"
                            value={requestForm.title}
                            onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                            placeholder="e.g., Winter Clothes Collection Drive"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={requestForm.description}
                            onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                            placeholder="Describe what you need..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="items">Items Needed</Label>
                          <Input
                            id="items"
                            value={requestForm.items}
                            onChange={(e) => setRequestForm({...requestForm, items: e.target.value})}
                            placeholder="e.g., Winter clothes, blankets, food items"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity Needed</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={requestForm.quantity}
                            onChange={(e) => setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 1})}
                            placeholder="e.g., 100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pickupAddress">Pickup Address</Label>
                          <Input
                            id="pickupAddress"
                            value={requestForm.pickupAddress}
                            onChange={(e) => setRequestForm({...requestForm, pickupAddress: e.target.value})}
                            placeholder="Enter pickup location"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={requestForm.category} onValueChange={(value) => setRequestForm({...requestForm, category: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clothing">Clothing</SelectItem>
                                <SelectItem value="food">Food</SelectItem>
                                <SelectItem value="books">Books</SelectItem>
                                <SelectItem value="toys">Toys</SelectItem>
                                <SelectItem value="electronics">Electronics</SelectItem>
                                <SelectItem value="furniture">Furniture</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="urgency">Urgency</Label>
                            <Select value={requestForm.urgency} onValueChange={(value) => setRequestForm({...requestForm, urgency: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          onClick={handleRequestDonation}
                          disabled={isSubmittingRequest}
                          className="w-full"
                        >
                          {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-muted border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-foreground" />
                  {viewMode === 'requested' ? 'Requested Donations' : 'Unsolicited Donations'}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'requested' ? 'default' : 'outline'}
                    onClick={() => setViewMode('requested')}
                  >
                    Requested
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'unsolicited' ? 'default' : 'outline'}
                    onClick={() => setViewMode('unsolicited')}
                  >
                    Unsolicited
                  </Button>
                </div>
              </div>
              <span className="text-sm font-normal text-muted-foreground">
                {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-primary">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HandHeart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">No donations assigned to you</p>
                <p className="text-sm">Request donations or wait for admin assignments</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">Donor</TableHead>
                        <TableHead className="font-semibold text-foreground">Items</TableHead>
                        <TableHead className="font-semibold text-foreground">Pickup Address</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-foreground text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDonations.map((donation) => (
                        <TableRow key={donation.id} className="hover:bg-muted transition-colors">
                          <TableCell className="font-medium">{donation.donorName || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={donation.items}>
                              {donation.items || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={donation.pickupAddress}>
                              {donation.pickupAddress || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(donation.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              {donation.status === 'pending' && donation.assignedNGO === user?.uid && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDonation(donation);
                                      setShowDetailsModal(true);
                                    }}
                                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                                  >
                                    <Package className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptDonation(donation.id)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRejectDonation(donation.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {donation.status === 'accepted' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDonation(donation);
                                      setShowDetailsModal(true);
                                    }}
                                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                                  >
                                    <Package className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkPickedUp(donation.id)}
                                    className="bg-success hover:bg-success/90 text-success-foreground"
                                  >
                                    <Truck className="h-4 w-4 mr-1" />
                                    Mark Picked Up
                                  </Button>
                                </>
                              )}
                                {donation.status === 'picked_up' && (
                                  <Badge className="bg-accent/20 text-accent-foreground">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Donation Requests Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-muted border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                My Donation Requests
              </span>
              <span className="text-sm font-normal text-primary">
                {donationRequests.length} request{donationRequests.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingRequests ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-primary">Loading donation requests...</p>
              </div>
            ) : donationRequests.length === 0 ? (
              <div className="text-center py-12 text-primary">
                <Package className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                <p className="text-lg font-medium">No donation requests yet</p>
                <p className="text-sm">Click "Request Donation" to create your first request</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">Request Title</TableHead>
                      <TableHead className="font-semibold text-foreground">Items Needed</TableHead>
                      <TableHead className="font-semibold text-foreground">Progress</TableHead>
                      <TableHead className="font-semibold text-foreground">Category</TableHead>
                      <TableHead className="font-semibold text-foreground">Urgency</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground">Requested At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-muted transition-colors">
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate" title={request.items}>
                              {request.items}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {request.fulfilledQuantity || 0} / {request.quantity || 1}
                              </span>
                              <span className="text-muted-foreground">
                                {Math.round(((request.fulfilledQuantity || 0) / (request.quantity || 1)) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(((request.fulfilledQuantity || 0) / (request.quantity || 1)) * 100, 100)}%`
                                }}
                              />
                            </div>
                            {(request.quantity || 1) - (request.fulfilledQuantity || 0) > 0 && (
                              <p className="text-xs text-success">
                                {(request.quantity || 1) - (request.fulfilledQuantity || 0)} items still needed
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {request.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            request.urgency === 'urgent' ? 'bg-destructive/20 text-destructive-foreground' :
                            request.urgency === 'high' ? 'bg-warm/20 text-warm-foreground' :
                            request.urgency === 'low' ? 'bg-muted text-muted-foreground' :
                            'bg-primary/20 text-primary'
                          }>
                            {request.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-warm/20 text-warm-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {request.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-primary">
                            {request.requestedAt?.toDate ? 
                              new Date(request.requestedAt.toDate()).toLocaleDateString() : 
                              'Just now'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          </Card>
      
      {/* Donation Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-6">
              {/* Donor Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Donor Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedDonation.donorName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDonation.donorEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedDonation.donorPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted Date</p>
                    <p className="font-medium">
                      {selectedDonation.createdAt ? 
                        new Date(selectedDonation.createdAt.toDate ? selectedDonation.createdAt.toDate() : selectedDonation.createdAt).toLocaleString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              {selectedDonation.images && selectedDonation.images.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Donation Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedDonation.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Donation image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer transition-transform hover:scale-105"
                          onClick={() => window.open(image.url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white/90 rounded px-2 py-1 text-xs">
                            Click to view
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {image.name || `Image ${index + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Donation Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Donation Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{selectedDonation.items || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedDonation.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selectedDonation.quantity || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cause</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedDonation.cause || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Pickup Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pickup Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Address</p>
                    <p className="font-medium">{selectedDonation.pickupAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    handleMarkPickedUp(selectedDonation.id);
                    setShowDetailsModal(false);
                  }}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Picked Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default NGODashboard;
