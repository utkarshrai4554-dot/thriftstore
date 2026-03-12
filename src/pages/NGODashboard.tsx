import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Truck, CheckCircle, XCircle, Clock, Plus, Package, HandHeart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getUserProfile } from "@/services/userService";

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  pickupAddress: string;
  items: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up';
  assignedNGO?: string;
  assignedNGOName?: string;
  createdAt: any;
  acceptedAt?: any;
  pickedUpAt?: any;
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
    pickupAddress: '',
    category: 'clothing',
    urgency: 'normal'
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchDonations();
    fetchDonationRequests();
  }, []);

  const fetchDonations = async () => {
    try {
      // Fetch donations assigned to this NGO
      const q = query(
        collection(db, 'donations'),
        where('assignedNGO', '==', user?.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      
      console.log('🔍 NGO Dashboard - Fetched donations:', data);
      console.log('🔍 NGO Dashboard - Donation data sample:', data[0]);
      
      setDonations(data);
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

  const handleAcceptDonation = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: user?.uid
      });
      
      toast.success('Donation accepted successfully!');
      fetchDonations();
    } catch (error) {
      console.error('Error accepting donation:', error);
      toast.error('Failed to accept donation');
    }
  };

  const handleRejectDonation = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: user?.uid
      });
      
      toast.success('Donation rejected');
      fetchDonations();
    } catch (error) {
      console.error('Error rejecting donation:', error);
      toast.error('Failed to reject donation');
    }
  };

  const handleMarkPickedUp = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'picked_up',
        pickedUpAt: new Date()
      });
      
      toast.success('Donation marked as picked up!');
      fetchDonations();
    } catch (error) {
      console.error('Error marking as picked up:', error);
      toast.error('Failed to update donation status');
    }
  };

  const handleRequestDonation = async () => {
    if (!requestForm.title || !requestForm.items || !requestForm.pickupAddress) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmittingRequest(true);
    
    try {
      const donationData = {
        title: requestForm.title,
        description: requestForm.description,
        items: requestForm.items,
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
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'picked_up':
        return <Badge className="bg-blue-100 text-blue-800">Picked Up</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const filteredDonations = donations.filter(donation => {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="font-display text-4xl font-bold mb-1 text-gray-900">NGO Dashboard</h1>
              <p className="text-gray-600">Manage donation requests and pickups</p>
              <p className="text-sm text-gray-500">Welcome, {getNGOInfo()}!</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-100 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Donations</p>
                  <p className="text-3xl font-bold text-gray-800">{donations.length}</p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600">Pending Acceptance</p>
                  <p className="text-3xl font-bold text-blue-800">{donations.filter(d => d.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600">Accepted</p>
                  <p className="text-3xl font-bold text-green-800">{donations.filter(d => d.status === 'accepted').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600">Completed</p>
                  <p className="text-3xl font-bold text-purple-800">{donations.filter(d => d.status === 'picked_up').length}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Services Section */}
        <div className="space-y-6 mb-8">
          {/* Top Services Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Earn Points */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-orange-800 font-bold text-sm">★</span>
                  </div>
                  Earn Points
                </CardTitle>
                <p className="text-sm text-orange-600">Get rewarded for your contributions</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">250</p>
                    <p className="text-sm text-gray-600">Current Points</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Points from donations:</span>
                      <span className="font-medium">+150</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Points from pickups:</span>
                      <span className="font-medium">+100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Points redeemed:</span>
                      <span className="font-medium text-red-600">-50</span>
                    </div>
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    View Rewards Store
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Free Pickup */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Truck className="h-6 w-6 text-blue-600" />
                  Free Pickup
                </CardTitle>
                <p className="text-sm text-blue-600">Schedule free donation pickups</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">5</p>
                    <p className="text-sm text-gray-600">Available This Month</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Free for orders above 10 items</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Same-day pickup available</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Track pickup in real-time</span>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Schedule Pickup
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Make a Donation Form - Full Width Below */}
          <Card className="shadow-lg">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Request New Donation
              </CardTitle>
              <p className="text-sm text-gray-600">Create a new donation request for donors</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="w-full max-w-2xl">
                  <p className="font-medium text-gray-900 mb-4 text-center">Need donations for your cause?</p>
                  <p className="text-sm text-gray-600 mb-6 text-center">Create a request and donors will be able to fulfill it</p>
                  <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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
                          onClick={handleSubmitRequest}
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
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-gray-600" />
                Donation Requests Assigned to You
              </span>
              <span className="text-sm font-normal text-gray-600">
                {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-blue-600">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <HandHeart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No donations assigned to you</p>
                <p className="text-sm">Request donations or wait for admin assignments</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900">Donor</TableHead>
                        <TableHead className="font-semibold text-gray-900">Items</TableHead>
                        <TableHead className="font-semibold text-gray-900">Pickup Address</TableHead>
                        <TableHead className="font-semibold text-gray-900">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDonations.map((donation) => (
                        <TableRow key={donation.id} className="hover:bg-gray-50 transition-colors">
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
                              {donation.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptDonation(donation.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              )}
                              {donation.status === 'accepted' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkPickedUp(donation.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  Mark Picked Up
                                </Button>
                              )}
                                {donation.status === 'picked_up' && (
                                  <Badge className="bg-blue-100 text-blue-800">
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
              </>
            )}
          </CardContent>
        </Card>

        {/* My Donation Requests Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                My Donation Requests
              </span>
              <span className="text-sm font-normal text-blue-600">
                {donationRequests.length} request{donationRequests.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingRequests ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-blue-600">Loading donation requests...</p>
              </div>
            ) : donationRequests.length === 0 ? (
              <div className="text-center py-12 text-blue-600">
                <Package className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <p className="text-lg font-medium">No donation requests yet</p>
                <p className="text-sm">Click "Request Donation" to create your first request</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-blue-50">
                    <TableRow>
                      <TableHead className="font-semibold text-blue-900">Request Title</TableHead>
                      <TableHead className="font-semibold text-blue-900">Items Needed</TableHead>
                      <TableHead className="font-semibold text-blue-900">Category</TableHead>
                      <TableHead className="font-semibold text-blue-900">Urgency</TableHead>
                      <TableHead className="font-semibold text-blue-900">Status</TableHead>
                      <TableHead className="font-semibold text-blue-900">Requested At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-blue-50 transition-colors">
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate" title={request.items}>
                              {request.items}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {request.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                            request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                            request.urgency === 'low' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {request.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            {request.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-blue-600">
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
      </div>
    </div>
  );
};

export default NGODashboard;
