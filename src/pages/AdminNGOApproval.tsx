import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, AlertCircle, Clock, Package, Gift, Truck, Building } from "lucide-react";

interface NGORegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  address: string;
  city: string;
  description: string;
  website?: string;
  contactPerson: string;
  status: 'pending' | 'approved' | 'rejected' | 'on-hold' | 'deleted';
  submittedAt: any;
  approvedAt?: any;
  holdReason?: string;
  deleteReason?: string;
  deletedBy?: string;
  deletedAt?: any;
  putOnHoldAt?: any;
  putOnHoldBy?: string;
}

const AdminNGOApproval = () => {
  const { user, userProfile } = useAuth();
  const [registrations, setRegistrations] = useState<NGORegistration[]>([]);
  const [approvedNGOs, setApprovedNGOs] = useState<NGORegistration[]>([]);
  const [deletedNGOs, setDeletedNGOs] = useState<NGORegistration[]>([]);
  const [onHoldNGOs, setOnHoldNGOs] = useState<NGORegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNGO, setSelectedNGO] = useState<NGORegistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'blacklist' | 'onhold'>('pending');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteReasonModal, setShowDeleteReasonModal] = useState(false);
  const [showHoldReasonModal, setShowHoldReasonModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchRegistrations();
    fetchApprovedNGOs();
    fetchDeletedNGOs();
    fetchOnHoldNGOs();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const q = query(collection(db, 'ngoRegistrations'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NGORegistration[];
      setRegistrations(data);
    } catch (error) {
      toast.error('Failed to fetch NGO registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovedNGOs = async () => {
    try {
      const q = query(collection(db, 'approvedNGOs'), where('status', '==', 'approved'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NGORegistration[];
      setApprovedNGOs(data);
    } catch (error) {
      console.error('Error fetching approved NGOs:', error);
    }
  };

  const fetchDeletedNGOs = async () => {
    try {
      const q = query(collection(db, 'approvedNGOs'), where('status', '==', 'deleted'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NGORegistration[];
      setDeletedNGOs(data);
    } catch (error) {
      console.error('Error fetching deleted NGOs:', error);
    }
  };

  const fetchOnHoldNGOs = async () => {
    try {
      // Fetch from both collections for on-hold NGOs
      const approvedQuery = query(collection(db, 'approvedNGOs'), where('status', '==', 'on-hold'));
      const registrationQuery = query(collection(db, 'ngoRegistrations'), where('status', '==', 'on-hold'));
      
      const [approvedSnapshot, registrationSnapshot] = await Promise.all([
        getDocs(approvedQuery),
        getDocs(registrationQuery)
      ]);
      
      const approvedData = approvedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NGORegistration[];
      
      const registrationData = registrationSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NGORegistration[];
      
      // Combine and remove duplicates
      const allOnHoldNGOs = [...approvedData, ...registrationData];
      const uniqueOnHoldNGOs = allOnHoldNGOs.filter((ngo, index, self) => 
        index === self.findIndex((t) => t.id === ngo.id)
      );
      
      setOnHoldNGOs(uniqueOnHoldNGOs);
    } catch (error) {
      console.error('Error fetching on-hold NGOs:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const ngo = registrations.find(r => r.id === id);
      if (!ngo) return;

      // Update to approved in ngoRegistrations
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'approved',
        approvedAt: new Date()
      });

      // Add to approvedNGOs collection
      await setDoc(doc(db, 'approvedNGOs', id), {
        ...ngo,
        status: 'approved',
        approvedAt: new Date()
      });

      toast.success('NGO approved successfully!');
      fetchRegistrations();
      fetchApprovedNGOs();
    } catch (error) {
      toast.error('Failed to approve NGO');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'rejected'
      });

      toast.success('NGO rejected successfully!');
      fetchRegistrations();
    } catch (error) {
      toast.error('Failed to reject NGO');
    }
  };

  const handlePutOnHold = async (id: string) => {
    try {
      const ngo = registrations.find(r => r.id === id) || approvedNGOs.find(r => r.id === id);
      if (!ngo) return;

      // Update status to on-hold in both collections
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'on-hold',
        holdReason,
        putOnHoldAt: new Date(),
        putOnHoldBy: user?.email || 'Unknown'
      });
      
      await updateDoc(doc(db, 'approvedNGOs', id), {
        status: 'on-hold',
        holdReason,
        putOnHoldAt: new Date(),
        putOnHoldBy: user?.email || 'Unknown'
      });
      
      toast.success('NGO put on hold successfully!');
      setHoldReason('');
      setShowHoldModal(false);
      fetchApprovedNGOs();
      fetchOnHoldNGOs();
    } catch (error) {
      toast.error('Failed to put NGO on hold');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const ngo = approvedNGOs.find(r => r.id === id);
      if (!ngo) return;

      // Update status to deleted in both collections
      await updateDoc(doc(db, 'approvedNGOs', id), {
        status: 'deleted',
        deleteReason,
        deletedBy: user?.email || 'Unknown',
        deletedAt: new Date()
      });
      
      // Also update original registration if it exists
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'deleted',
        deleteReason,
        deletedBy: user?.email || 'Unknown',
        deletedAt: new Date()
      });
      
      toast.success('NGO deleted successfully!');
      setDeleteReason('');
      setShowDeleteModal(false);
      fetchApprovedNGOs();
      fetchRegistrations();
      fetchDeletedNGOs();
    } catch (error) {
      console.error('Error deleting NGO:', error);
      toast.error('Failed to delete NGO');
    }
  };

  const handleRemoveFromBlacklist = async (id: string) => {
    try {
      // Update status back to approved in both collections
      await updateDoc(doc(db, 'approvedNGOs', id), {
        status: 'approved',
        deleteReason: null,
        deletedBy: null,
        deletedAt: null
      });
      
      // Also update original registration if it exists
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'approved',
        deleteReason: null,
        deletedBy: null,
        deletedAt: null
      });
      
      toast.success('NGO removed from blacklist successfully!');
      fetchApprovedNGOs();
      fetchDeletedNGOs();
    } catch (error) {
      console.error('Error removing NGO from blacklist:', error);
      toast.error('Failed to remove NGO from blacklist');
    }
  };

  const handleRemoveFromHold = async (id: string) => {
    try {
      // Update status back to approved in both collections
      await updateDoc(doc(db, 'approvedNGOs', id), {
        status: 'approved',
        holdReason: null,
        putOnHoldBy: null,
        putOnHoldAt: null
      });
      
      // Also update original registration if it exists
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'approved',
        holdReason: null,
        putOnHoldBy: null,
        putOnHoldAt: null
      });
      
      toast.success('NGO removed from hold successfully!');
      setShowHoldReasonModal(false);
      fetchApprovedNGOs();
      fetchOnHoldNGOs();
    } catch (error) {
      console.error('Error removing NGO from hold:', error);
      toast.error('Failed to remove NGO from hold');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'on-hold':
        return <Badge className="bg-orange-100 text-orange-800">On Hold</Badge>;
      case 'deleted':
        return <Badge className="bg-gray-100 text-gray-800">Deleted</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  // Check if user is admin based on role from user profile
  const isAdmin = user?.email && userProfile?.role === 'admin';

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Current user: {user?.email || 'Not logged in'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">NGO Approval Dashboard</h1>
          <p className="text-muted-foreground">Review and approve NGO registration applications</p>
        </div>

        {/* NGO Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total NGOs</p>
                  <p className="text-2xl font-bold text-blue-900">{approvedNGOs.length}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{registrations.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">On Hold</p>
                  <p className="text-2xl font-bold text-orange-900">{onHoldNGOs.length}</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Blacklisted</p>
                  <p className="text-2xl font-bold text-red-900">{deletedNGOs.length}</p>
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
              <p className="text-sm text-muted-foreground">Quick access to admin functions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/admin-dashboard'}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/admin-donations'}>
                  <Gift className="h-4 w-4 mr-2" />
                  Manage Donations
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/admin-products'}>
                  <Package className="h-4 w-4 mr-2" />
                  Product Approvals
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/admin-orders'}>
                  <Truck className="h-4 w-4 mr-2" />
                  Order Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="flex items-center gap-2"
          >
            <span>Pending Registrations</span>
            {registrations.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {registrations.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'approved' ? 'default' : 'outline'}
            onClick={() => setActiveTab('approved')}
            className="flex items-center gap-2"
          >
            <span>Approved NGOs</span>
            {approvedNGOs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {approvedNGOs.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'onhold' ? 'default' : 'outline'}
            onClick={() => setActiveTab('onhold')}
            className="flex items-center gap-2"
          >
            <span>On Hold</span>
            {onHoldNGOs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {onHoldNGOs.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'blacklist' ? 'default' : 'outline'}
            onClick={() => setActiveTab('blacklist')}
            className="flex items-center gap-2"
          >
            <span>Blacklist</span>
            {deletedNGOs.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {deletedNGOs.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : registrations.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending registrations.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NGO Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations
                      .filter(registration => registration.status === 'pending')
                      .map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">{registration.name}</TableCell>
                          <TableCell>{registration.contactPerson}</TableCell>
                          <TableCell>{registration.email}</TableCell>
                          <TableCell>{registration.phone}</TableCell>
                          <TableCell>{registration.city}</TableCell>
                          <TableCell>{getStatusBadge(registration.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedNGO(registration);
                                  setShowDetailsModal(true);
                                }}
                                className="mr-2"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(registration.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(registration.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle>Approved NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedNGOs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approved NGOs.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NGO Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedNGOs.map((ngo) => (
                      <TableRow key={ngo.id}>
                        <TableCell className="font-medium">{ngo.name}</TableCell>
                        <TableCell>{ngo.contactPerson}</TableCell>
                        <TableCell>{ngo.email}</TableCell>
                        <TableCell>{ngo.phone}</TableCell>
                        <TableCell>{ngo.city}</TableCell>
                        <TableCell>{getStatusBadge(ngo.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNGO(ngo);
                              setShowDetailsModal(true);
                            }}
                            className="mr-2"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedNGO(ngo);
                                setShowHoldModal(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Hold
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedNGO(ngo);
                                setShowDeleteModal(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add similar content for onhold and blacklist tabs */}
        {/* Modals and other UI components would go here */}
      </div>
    </div>
  );
};

export default AdminNGOApproval;
