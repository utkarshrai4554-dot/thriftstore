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
import { CheckCircle, XCircle, Package, MapPin, Camera, AlertCircle, Clock, Truck, Eye, Star } from "lucide-react";
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
  images?: string[];
}

interface QualityCheck {
  id: string;
  requestId: string;
  agentId: string;
  agentName: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  completeness: 'complete' | 'partial' | 'incomplete';
  cleanliness: 'excellent' | 'good' | 'fair' | 'poor';
  functionality: 'perfect' | 'good' | 'needs_repair' | 'broken';
  notes: string;
  images: string[];
  result: 'accepted' | 'rejected';
  createdAt: any;
}

const DeliveryAgentDashboard = () => {
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  const [assignedRequests, setAssignedRequests] = useState<DonationRequest[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [showQualityCheckModal, setShowQualityCheckModal] = useState(false);
  const [qualityCheckForm, setQualityCheckForm] = useState({
    condition: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    completeness: 'complete' as 'complete' | 'partial' | 'incomplete',
    cleanliness: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    functionality: 'good' as 'perfect' | 'good' | 'needs_repair' | 'broken',
    notes: '',
    images: [] as string[]
  });

  useEffect(() => {
    if (!user || userProfile?.role !== 'delivery') {
      toast.error('Access denied. Delivery agent privileges required.');
      return;
    }
    fetchAssignedRequests();
    fetchQualityChecks();
  }, [user, userProfile]);

  const fetchAssignedRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'donationRequests'),
        where('deliveryAgent', '==', user?.uid),
        where('status', 'in', ['assigned', 'quality_check', 'accepted', 'rejected'])
      );
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DonationRequest[];
      setAssignedRequests(requestsData);
    } catch (error) {
      console.error('Error fetching assigned requests:', error);
      toast.error('Failed to fetch assigned requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchQualityChecks = async () => {
    try {
      const checksQuery = query(
        collection(db, 'qualityChecks'),
        where('agentId', '==', user?.uid)
      );
      const snapshot = await getDocs(checksQuery);
      const checksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QualityCheck[];
      setQualityChecks(checksData);
    } catch (error) {
      console.error('Error fetching quality checks:', error);
    }
  };

  const handleQualityCheck = async () => {
    if (!selectedRequest) return;

    try {
      // Determine if the item passes quality check
      const passesQuality = 
        qualityCheckForm.condition !== 'poor' &&
        qualityCheckForm.completeness !== 'incomplete' &&
        qualityCheckForm.cleanliness !== 'poor' &&
        qualityCheckForm.functionality !== 'broken';

      const qualityResult: 'accepted' | 'rejected' = passesQuality ? 'accepted' : 'rejected';

      // Create quality check record
      await addDoc(collection(db, 'qualityChecks'), {
        requestId: selectedRequest.id,
        agentId: user?.uid,
        agentName: userProfile?.displayName || user?.email,
        ...qualityCheckForm,
        result: qualityResult,
        createdAt: serverTimestamp()
      });

      // Update donation request status
      await updateDoc(doc(db, 'donationRequests', selectedRequest.id), {
        status: qualityResult,
        qualityChecked: true,
        qualityCheckedBy: user?.uid,
        qualityCheckedAt: serverTimestamp(),
        qualityResult: qualityResult
      });

      // If accepted, create product in shop
      if (qualityResult === 'accepted') {
        await addDoc(collection(db, 'products'), {
          title: selectedRequest.title,
          description: selectedRequest.description,
          category: selectedRequest.category,
          condition: qualityCheckForm.condition,
          originalPrice: 100, // You may want to calculate this based on item type
          sellingPrice: 50, // You may want to calculate this
          images: qualityCheckForm.images.length > 0 ? qualityCheckForm.images : ['/placeholder.jpg'],
          sellerId: 'system', // System seller for donated items
          status: 'approved',
          quantity: 1,
          soldQuantity: 0,
          views: 0,
          likes: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          source: 'donation',
          originalRequestId: selectedRequest.id,
          qualityCheckId: qualityChecks[qualityChecks.length - 1]?.id,
          qualityNotes: qualityCheckForm.notes
        });
      }

      toast.success(`Quality check completed. Item ${qualityResult}.`);
      setShowQualityCheckModal(false);
      setSelectedRequest(null);
      setQualityCheckForm({
        condition: 'good',
        completeness: 'complete',
        cleanliness: 'good',
        functionality: 'good',
        notes: '',
        images: []
      });
      
      fetchAssignedRequests();
      fetchQualityChecks();
    } catch (error) {
      console.error('Error submitting quality check:', error);
      toast.error('Failed to submit quality check');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return theme === 'dark' ? 'bg-accent/20 text-accent-foreground' : 'bg-blue-100 text-blue-800';
      case 'quality_check':
        return theme === 'dark' ? 'bg-warm/20 text-warm-foreground' : 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return theme === 'dark' ? 'bg-success/20 text-success-foreground' : 'bg-green-100 text-green-800';
      case 'rejected':
        return theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-800';
      default:
        return theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Truck className="h-4 w-4" />;
      case 'quality_check':
        return <Eye className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return theme === 'dark' ? 'bg-success/20 text-success-foreground' : 'bg-green-100 text-green-800';
      case 'good':
        return theme === 'dark' ? 'bg-accent/20 text-accent-foreground' : 'bg-blue-100 text-blue-800';
      case 'fair':
        return theme === 'dark' ? 'bg-warm/20 text-warm-foreground' : 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-800';
      default:
        return theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || userProfile?.role !== 'delivery') {
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
            Delivery Agent Dashboard
          </h1>
          <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
            Manage assigned deliveries and perform quality checks
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
                    Assigned
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {assignedRequests.filter(r => r.status === 'assigned').length}
                  </p>
                </div>
                <Truck className={`h-8 w-8 ${
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
                    Quality Check
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {assignedRequests.filter(r => r.status === 'quality_check').length}
                  </p>
                </div>
                <Eye className={`h-8 w-8 ${
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
                    Accepted
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {assignedRequests.filter(r => r.status === 'accepted').length}
                  </p>
                </div>
                <CheckCircle className={`h-8 w-8 ${
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
                    Rejected
                  </p>
                  <p className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    {assignedRequests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className={`h-8 w-8 ${
                  theme === 'dark' ? 'text-destructive-foreground' : 'text-red-500'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Requests */}
        <Card className={theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
              Assigned Requests
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
            ) : assignedRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className={`h-16 w-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'
                }`} />
                <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                  No assigned requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedRequests.map((request) => (
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
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                            <Star className={`h-4 w-4 ${
                              theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
                            }`} />
                            <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                              {request.requestedByNGO}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {request.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowQualityCheckModal(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Start Quality Check
                          </Button>
                        )}
                        
                        {request.status === 'quality_check' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowQualityCheckModal(true);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            Continue Quality Check
                          </Button>
                        )}
                        
                        {(request.status === 'accepted' || request.status === 'rejected') && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className={theme === 'dark' ? 'border-warm/30' : ''}
                          >
                            {request.status === 'accepted' ? 'Accepted' : 'Rejected'}
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

        {/* Quality Check Modal */}
        <Dialog open={showQualityCheckModal} onOpenChange={setShowQualityCheckModal}>
          <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-card border-warm/20' : 'bg-white'
          }`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                Quality Check - {selectedRequest?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                {/* Request Info */}
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-muted/50' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    Request Details
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    {selectedRequest.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                      Items: {selectedRequest.items} ({selectedRequest.quantity})
                    </span>
                    <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
                      NGO: {selectedRequest.requestedByNGO}
                    </span>
                  </div>
                </div>

                {/* Quality Check Form */}
                <div className="space-y-4">
                  <h4 className={`font-semibold ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    Quality Assessment
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                        Condition
                      </Label>
                      <Select value={qualityCheckForm.condition} onValueChange={(value: any) => 
                        setQualityCheckForm(prev => ({ ...prev, condition: value }))
                      }>
                        <SelectTrigger className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                        Completeness
                      </Label>
                      <Select value={qualityCheckForm.completeness} onValueChange={(value: any) => 
                        setQualityCheckForm(prev => ({ ...prev, completeness: value }))
                      }>
                        <SelectTrigger className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complete">Complete</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="incomplete">Incomplete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                        Cleanliness
                      </Label>
                      <Select value={qualityCheckForm.cleanliness} onValueChange={(value: any) => 
                        setQualityCheckForm(prev => ({ ...prev, cleanliness: value }))
                      }>
                        <SelectTrigger className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                        Functionality
                      </Label>
                      <Select value={qualityCheckForm.functionality} onValueChange={(value: any) => 
                        setQualityCheckForm(prev => ({ ...prev, functionality: value }))
                      }>
                        <SelectTrigger className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perfect">Perfect</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="needs_repair">Needs Repair</SelectItem>
                          <SelectItem value="broken">Broken</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                      Notes
                    </Label>
                    <Textarea
                      value={qualityCheckForm.notes}
                      onChange={(e) => setQualityCheckForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add detailed notes about the quality assessment..."
                      className={theme === 'dark' ? 'bg-muted border-warm/20' : ''}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>
                      Photos (Optional)
                    </Label>
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      theme === 'dark' ? 'border-warm/30' : 'border-gray-300'
                    }`}>
                      <Camera className={`h-8 w-8 mx-auto mb-2 ${
                        theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
                      }`}>
                        Click to add photos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality Summary */}
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-muted/50' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                  }`}>
                    Quality Summary
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getConditionColor(qualityCheckForm.condition)}>
                      Condition: {qualityCheckForm.condition}
                    </Badge>
                    <Badge className={getConditionColor(qualityCheckForm.completeness)}>
                      {qualityCheckForm.completeness}
                    </Badge>
                    <Badge className={getConditionColor(qualityCheckForm.cleanliness)}>
                      Cleanliness: {qualityCheckForm.cleanliness}
                    </Badge>
                    <Badge className={getConditionColor(qualityCheckForm.functionality)}>
                      Functionality: {qualityCheckForm.functionality}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleQualityCheck}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Submit Quality Check
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowQualityCheckModal(false)}
                    className={theme === 'dark' ? 'border-warm/30' : ''}
                  >
                    Cancel
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

export default DeliveryAgentDashboard;
