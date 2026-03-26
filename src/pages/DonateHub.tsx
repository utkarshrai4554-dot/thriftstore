import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Heart, Package, MapPin, Users, Clock, TrendingUp, Award, Target, HandHelping, Gift, ImagePlus, X, Building, Trophy, Calendar } from "lucide-react";
import AddressInput from "@/components/AddressInput";
import { donationCauses } from "@/lib/mockData";

const causeIcons: Record<string, any> = {
  'Education': Award,
  'Healthcare': Heart,
  'Environment': Gift,
  'Animals': Package,
  'Emergency': Award,
  'Community': Heart,
  'Other': Gift
};

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

interface DonationImpact {
  totalDonations: number;
  itemsDonated: number;
  ngosHelped: number;
  requestsFulfilled: number;
  recentActivity: any[];
}

const DonateHub = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [impact, setImpact] = useState<DonationImpact>({
    totalDonations: 0,
    itemsDonated: 0,
    ngosHelped: 0,
    requestsFulfilled: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showGeneralDonateModal, setShowGeneralDonateModal] = useState(false);
  const [donateForm, setDonateForm] = useState({
    quantity: 1,
    message: '',
    pickupAddress: ''
  });
  const [generalDonateForm, setGeneralDonateForm] = useState({
    items: '',
    quantity: 1,
    category: 'clothing',
    description: '',
    pickupAddress: '',
    urgency: 'normal'
  });
  
  // Enhanced form state
  const [selectedCause, setSelectedCause] = useState("");
  const [donationImages, setDonationImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [address, setAddress] = useState<{
    streetAddress: string;
    apartment: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    fullAddress?: string;
    latitude?: number;
    longitude?: number;
  }>({
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Donor recognition system state
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    fetchDonationRequests();
    fetchImpactData();
    if (user) {
      fetchDonorData();
    }
  }, [user]);

  const fetchDonorData = async () => {
    try {
      // Fetch all donations to calculate donor rankings
      const donationsQuery = query(collection(db, 'donations'));
      const donationsSnapshot = await getDocs(donationsQuery);
      
      // Group donations by user
      const donorMap = new Map();
      
      donationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || data.donorId;
        
        if (!donorMap.has(userId)) {
          donorMap.set(userId, {
            id: userId,
            name: data.donorName || data.userId?.slice(0, 8) + '...',
            email: data.donorEmail || '',
            totalItems: 0,
            totalDonations: 0,
            uniqueItems: new Set(),
            causes: new Set(),
            firstDonation: null,
            lastDonation: null,
            impactScore: 0,
            badges: []
          });
        }
        
        const donor = donorMap.get(userId);
        donor.totalDonations++;
        donor.totalItems += data.quantity || 1;
        donor.uniqueItems.add(data.items || 'Unknown');
        if (data.cause) donor.causes.add(data.cause);
        
        const donationDate = data.createdAt?.toDate();
        if (donationDate) {
          if (!donor.firstDonation || donationDate < donor.firstDonation) {
            donor.firstDonation = donationDate;
          }
          if (!donor.lastDonation || donationDate > donor.lastDonation) {
            donor.lastDonation = donationDate;
          }
        }
        
        // Calculate impact score
        donor.impactScore += (data.quantity || 1) * 10;
        if (data.cause === 'Education') donor.impactScore += 5;
        if (data.cause === 'Healthcare') donor.impactScore += 5;
        if (data.cause === 'Emergency') donor.impactScore += 8;
      });
      
      // Convert to array and sort by impact score
      const donors = Array.from(donorMap.values());
      donors.sort((a, b) => b.impactScore - a.impactScore);
      
      // Add badges based on achievements
      donors.forEach((donor, index) => {
        const badges = [];
        
        if (donor.totalDonations >= 10) badges.push({ label: 'Dedicated Donor', color: 'bg-blue-100 text-blue-800' });
        if (donor.totalDonations >= 25) badges.push({ label: 'Super Donor', color: 'bg-purple-100 text-purple-800' });
        if (donor.totalDonations >= 50) badges.push({ label: 'Elite Donor', color: 'bg-yellow-100 text-yellow-800' });
        
        if (donor.causes.size >= 3) badges.push({ label: 'Versatile', color: 'bg-green-100 text-green-800' });
        if (donor.uniqueItems.size >= 10) badges.push({ label: 'Variety Pack', color: 'bg-orange-100 text-orange-800' });
        
        if (index === 0) badges.push({ label: '👑 Champion', color: 'bg-yellow-500 text-white' });
        
        donor.badges = badges;
      });
      
      // Set top donors (show top 10)
      setTopDonors(donors.slice(0, 10));
      
      // Calculate current user's rank and stats
      if (user) {
        const userDonor = donors.find(d => d.id === user.uid);
        if (userDonor) {
          setUserRank(donors.findIndex(d => d.id === user.uid) + 1);
          setUserStats({
            totalItems: userDonor.totalItems,
            totalDonations: userDonor.totalDonations,
            impactScore: userDonor.impactScore,
            badges: userDonor.badges,
            causes: Array.from(userDonor.causes),
            firstDonation: userDonor.firstDonation
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching donor data:', error);
    }
  };

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
      
      // Sort by urgency and then by date
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

  const fetchImpactData = async () => {
    try {
      // Fetch total donations
      const donationsQuery = query(collection(db, 'donations'));
      const donationsSnapshot = await getDocs(donationsQuery);
      const donations = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
      }));
      
      // Sort donations by creation date (most recent first)
      const sortedDonations = donations.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.().getTime() || 0;
        const bTime = b.createdAt?.toDate?.().getTime() || 0;
        return bTime - aTime;
      });
      
      // Fetch fulfilled requests
      const fulfilledQuery = query(
        collection(db, 'donationRequests'),
        where('status', '==', 'fulfilled')
      );
      const fulfilledSnapshot = await getDocs(fulfilledQuery);
      
      // Fetch unique NGOs
      const ngosQuery = query(collection(db, 'ngoRegistrations'));
      const ngosSnapshot = await getDocs(ngosQuery);
      
      setImpact({
        totalDonations: donationsSnapshot.size,
        itemsDonated: donations.reduce((sum, d) => sum + (d.quantity || 0), 0),
        ngosHelped: ngosSnapshot.size,
        requestsFulfilled: fulfilledSnapshot.size,
        recentActivity: sortedDonations.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching impact data:', error);
    }
  };

  const handleDonateToRequest = async () => {
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

      // Update the donation request
      const newFulfilledQuantity = (selectedRequest.fulfilledQuantity || 0) + donateForm.quantity;
      await updateDoc(doc(db, 'donationRequests', selectedRequest.id), {
        fulfilledQuantity: newFulfilledQuantity,
        status: newFulfilledQuantity >= selectedRequest.quantity ? 'fulfilled' : 'pending'
      });

      toast.success(`Thank you for donating ${donateForm.quantity} ${selectedRequest.items}!`);
      setShowDonateModal(false);
      setDonateForm({ quantity: 1, message: '', pickupAddress: '' });
      setSelectedRequest(null);
      
      // Refresh data
      fetchDonationRequests();
      fetchImpactData();
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('Failed to submit donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were invalid. Please upload only images under 5MB.');
      return;
    }

    setDonationImages(prev => [...prev, ...validFiles]);
    
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index: number) => {
    setDonationImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeneralDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to donate');
      return;
    }

    if (!selectedCause || !generalDonateForm.description || !address.fullAddress) {
      toast.error('Please fill all required fields');
      return;
    }

    if (donationImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const donationData = {
        userId: user.uid,
        donorName: user.displayName || user.email?.split('@')[0] || 'Anonymous Donor',
        donorEmail: user.email || '',
        donorPhone: user.phoneNumber || '',
        cause: selectedCause,
        description: generalDonateForm.description,
        pickupAddress: address.fullAddress || '',
        addressDetails: address,
        items: generalDonateForm.items || 'General donation items',
        quantity: 1,
        category: generalDonateForm.category,
        urgency: generalDonateForm.urgency,
        images: donationImages.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        })),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'donations'), donationData);

      toast.success('Donation submitted successfully! Your donation is now pending admin review and approval. You will be notified once approved.');
      
      // Reset form
      setSelectedCause('');
      setGeneralDonateForm({
        items: '',
        quantity: 1,
        category: 'clothing',
        description: '',
        pickupAddress: '',
        urgency: 'normal'
      });
      setDonationImages([]);
      setImagePreviews([]);
      setAddress({
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      });
      
      // Refresh impact data
      fetchImpactData();
    } catch (error) {
      console.error('Error submitting general donation:', error);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-primary">Loading Donation Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Donation Hub</h1>
          <p className="text-lg text-muted-foreground">Make a difference through donations</p>
        </div>

        {/* Impact Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary">Total Donations</p>
                  <p className="text-3xl font-bold text-primary-foreground">{impact.totalDonations}</p>
                </div>
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-success">Items Donated</p>
                  <p className="text-3xl font-bold text-success-foreground">{impact.itemsDonated}</p>
                </div>
                <Package className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-warm">NGOs Helped</p>
                  <p className="text-3xl font-bold text-warm-foreground">{impact.ngosHelped}</p>
                </div>
                <Users className="h-8 w-8 text-warm" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent">Requests Fulfilled</p>
                  <p className="text-3xl font-bold text-accent-foreground">{impact.requestsFulfilled}</p>
                </div>
                <Target className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Fulfill NGO Requests
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              General Donations
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Track Impact
            </TabsTrigger>
          </TabsList>

          {/* Fulfill NGO Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Fulfill NGO Requests</h2>
              <p className="text-muted-foreground">Help NGOs meet their specific needs</p>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <HandHelping className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">No active requests</h3>
                <p className="text-muted-foreground">Check back later for new opportunities to help</p>
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span className="capitalize">{request.category}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">{request.description}</p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{request.items}</span>
                            <span className="text-sm text-muted-foreground">
                              {request.fulfilledQuantity || 0} / {request.quantity}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  progressPercentage >= 100 ? 'bg-success' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{progressPercentage}% fulfilled</span>
                              {!isFullyFulfilled && (
                                <span className="text-success font-medium">
                                  {remainingNeeded} still needed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{request.requestedByNGO}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{request.pickupAddress}</span>
                          </div>
                        </div>

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
                                onClick={handleDonateToRequest}
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
          </TabsContent>

          {/* General Donations Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">General Donations</h2>
              <p className="text-muted-foreground">Donate any items to help those in need</p>
            </div>

            {/* Benefits Section - Top */}
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: Award, label: "Earn Points" },
                  { icon: Package, label: "Free Pickup" },
                  { icon: Gift, label: "Get Certificate" },
                ].map((b, i) => (
                  <div key={i} className="text-center p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <b.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <p className="font-medium">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Section - Full Width Below */}
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader className="bg-secondary border-b">
                  <CardTitle className="flex items-center gap-2 text-center">
                    <Gift className="h-6 w-6 text-secondary-foreground" />
                    Make a Donation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleGeneralDonation} className="space-y-6" ref={formRef}>
                    <div>
                      <Label className="mb-3 block">Select a Cause</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {donationCauses.map((cause) => {
                          const Icon = causeIcons[cause] || Heart;
                          return (
                            <button
                              key={cause}
                              type="button"
                              onClick={() => setSelectedCause(cause)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selectedCause === cause
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <Icon className={`h-5 w-5 mb-2 ${selectedCause === cause ? "text-primary" : "text-muted-foreground"}`} />
                              <p className="font-medium text-sm">{cause}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Donation Images *</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {imagePreviews.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Donation image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {imagePreviews.length < 3 && (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Add Image</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <ImagePlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-lg font-medium text-muted-foreground mb-2">Click to upload donation images</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB each (max 3 images)</p>
                        </div>
                      )}
                    </div>
                      
                      <div className="space-y-2">
                        <Label>Item Description *</Label>
                        <Textarea 
                          value={generalDonateForm.description}
                          onChange={(e) => setGeneralDonateForm({...generalDonateForm, description: e.target.value})}
                          placeholder="What are you donating? Please describe the items, their condition, size, etc." 
                          rows={4} 
                          required 
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>Pickup Location *</Label>
                        <AddressInput
                          onAddressChange={(addr) => setAddress(addr)}
                          required={true}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full text-base py-4" 
                        disabled={isSubmitting || !user}
                      >
                        <Gift className="mr-2 h-6 w-6" />
                        {isSubmitting ? 'Submitting...' : user ? 'Submit Donation' : 'Login to Donate'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>

          {/* Track Impact Tab */}
          <TabsContent value="impact" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Impact</h2>
              <p className="text-gray-600">See the difference you're making and your donation history</p>
            </div>

            {/* Personal Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600">Total Donations</p>
                      <p className="text-3xl font-bold text-blue-800">{userStats?.totalDonations || 0}</p>
                    </div>
                    <Heart className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600">Items Donated</p>
                      <p className="text-3xl font-bold text-green-800">{userStats?.totalItems || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600">Impact Score</p>
                      <p className="text-3xl font-bold text-purple-800">{userStats?.impactScore || 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600">Badges Earned</p>
                      <p className="text-3xl font-bold text-orange-800">{userStats?.badges?.length || 0}</p>
                    </div>
                    <Award className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Donation History */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    My Donation History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">Your donation history will appear here</span>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/orders'}>
                          View All Orders
                        </Button>
                      </div>
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">No donation history yet</p>
                        <p className="text-sm text-gray-500 mb-4">Start donating to see your impact grow!</p>
                        <Button onClick={() => setActiveTab('general')} className="bg-blue-600 hover:bg-blue-700">
                          Make Your First Donation
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Login to track your personal impact</p>
                      <Button onClick={() => window.location.href = '/auth'}>
                        Login to View History
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Community Impact */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Community Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Donors:</span>
                      <span className="font-bold">{impact.totalDonations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Distributed:</span>
                      <span className="font-bold">{impact.itemsDonated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">NGOs Partnered:</span>
                      <span className="font-bold">{impact.ngosHelped}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requests Completed:</span>
                      <span className="font-bold">{impact.requestsFulfilled}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {impact.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No recent donation activity</p>
                    <p className="text-sm text-gray-500">Be the first to make a donation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {impact.recentActivity.map((activity, index) => {
                      const donationDate = activity.createdAt?.toDate?.() || new Date();
                      const isRecent = (Date.now() - donationDate.getTime()) < 24 * 60 * 60 * 1000; // Within 24 hours
                      
                      return (
                        <div key={activity.id || index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            {activity.images && activity.images.length > 0 ? (
                              <img
                                src={activity.images[0].url}
                                alt="Donation preview"
                                className="w-12 h-12 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Gift className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">
                                {activity.donorName || activity.userId?.slice(0, 8) + '...' || 'Anonymous'}
                              </p>
                              {isRecent && (
                                <Badge className="bg-green-100 text-green-800 text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Donated <span className="font-medium">{activity.quantity || 1}</span> {activity.items || 'items'}
                              {activity.cause && (
                                <span className="text-gray-500"> for {activity.cause}</span>
                              )}
                            </p>
                            {activity.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-gray-500">
                              {donationDate.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {donationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DonateHub;
