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
import { CheckCircle, XCircle, Eye, AlertCircle } from "lucide-react";

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

  const fetchDeletedNGOs = async () => {
    try {
      // Fetch from both collections for deleted NGOs
      const approvedQuery = query(collection(db, 'approvedNGOs'), where('status', '==', 'deleted'));
      const registrationQuery = query(collection(db, 'ngoRegistrations'), where('status', '==', 'deleted'));
      
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
      
      // Merge and remove duplicates
      const allDeleted = [...approvedData, ...registrationData];
      const uniqueDeleted = allDeleted.filter((ngo, index, self) => 
        index === self.findIndex((n) => n.id === ngo.id)
      );
      
      setDeletedNGOs(uniqueDeleted);
    } catch (error) {
      console.error('Error fetching deleted NGOs:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const q = query(collection(db, 'ngoRegistrations'));
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

      // Update original registration
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'approved',
        approvedAt: new Date()
      });
      
      // Add to approved NGOs collection
      await setDoc(doc(db, 'approvedNGOs', id), {
        ...ngo,
        status: 'approved',
        approvedAt: new Date()
      });
      
      toast.success('NGO approved successfully!');
      fetchRegistrations();
      fetchApprovedNGOs();
    } catch (error) {
      console.error('Error approving NGO:', error);
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
      console.error('Error rejecting NGO:', error);
      toast.error('Failed to reject NGO');
    }
  };

  const handleHold = async (id: string) => {
    if (!holdReason.trim()) {
      toast.error('Please provide a reason for putting the NGO on hold');
      return;
    }

    try {
      await updateDoc(doc(db, 'approvedNGOs', id), {
        status: 'on-hold',
        holdReason: holdReason,
        putOnHoldBy: user?.email || 'Unknown',
        putOnHoldAt: new Date()
      });
      
      // Also update original registration if it exists
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'on-hold',
        holdReason: holdReason,
        putOnHoldBy: user?.email || 'Unknown',
        putOnHoldAt: new Date()
      });
      
      toast.success('NGO put on hold successfully!');
      setHoldReason('');
      setShowHoldModal(false);
      fetchApprovedNGOs();
      fetchOnHoldNGOs();
    } catch (error) {
      console.error('Error putting NGO on hold:', error);
      toast.error('Failed to put NGO on hold');
    }
  };

  const handleDelete = async (id: string) => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deleting the NGO');
      return;
    }

    try {
      // Delete from both collections
      await updateDoc(doc(db, 'approvedNGOs', id), {
        status: 'deleted',
        deleteReason: deleteReason,
        deletedBy: user?.email || 'Unknown',
        deletedAt: new Date()
      });
      
      // Also update original registration if it exists
      await updateDoc(doc(db, 'ngoRegistrations', id), {
        status: 'deleted',
        deleteReason: deleteReason,
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
      setShowDeleteReasonModal(false);
      fetchApprovedNGOs();
      fetchRegistrations();
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
        {activeTab === 'pending' ? (
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
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                              setSelectedNGO(registration);
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
        ) : activeTab === 'approved' ? (
          <Card>
            <CardHeader>
              <CardTitle>Approved NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedNGOs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approved NGOs yet.
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
        ) : activeTab === 'onhold' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">On Hold NGOs</CardTitle>
              <p className="text-sm text-muted-foreground">NGOs that are temporarily on hold pending review</p>
            </CardHeader>
            <CardContent>
              {onHoldNGOs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No NGOs on hold.
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
                      <TableHead>Hold Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onHoldNGOs.map((ngo) => (
                      <TableRow key={ngo.id}>
                        <TableCell className="font-medium text-orange-700">{ngo.name}</TableCell>
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
                              setShowHoldReasonModal(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            View Reason
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNGO(ngo);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : activeTab === 'blacklist' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Blacklisted NGOs</CardTitle>
              <p className="text-sm text-muted-foreground">NGOs that have been deleted due to violations or suspicious activities</p>
            </CardHeader>
            <CardContent>
              {deletedNGOs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No blacklisted NGOs.
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
                      <TableHead>Delete Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedNGOs.map((ngo) => (
                      <TableRow key={ngo.id}>
                        <TableCell className="font-medium text-red-700">{ngo.name}</TableCell>
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
                              setShowDeleteReasonModal(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            View Reason
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNGO(ngo);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* NGO Details Modal */}
      {showDetailsModal && selectedNGO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">NGO Registration Details</h2>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </Button>
            </div>

            {/* Hold Alert Box */}
            {selectedNGO.status === 'on-hold' && selectedNGO.holdReason && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-semibold">⚠️ NGO ON HOLD</span>
                </div>
                <p className="text-red-700 font-medium mt-2">{selectedNGO.holdReason}</p>
                {selectedNGO.putOnHoldAt && (
                  <p className="text-red-600 text-sm mt-1">
                    Put on hold: {new Date(selectedNGO.putOnHoldAt.toDate()).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 text-primary">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">NGO Name:</span>
                    <p className="text-gray-700">{selectedNGO.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Registration Number:</span>
                    <p className="text-gray-700">{selectedNGO.registrationNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-700">{selectedNGO.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p className="text-gray-700">{selectedNGO.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Website:</span>
                    <a 
                      href={selectedNGO.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline ml-2"
                    >
                      {selectedNGO.website || 'Not provided'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Address & Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 text-primary">Address & Contact</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-gray-700">{selectedNGO.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium">City:</span>
                    <p className="text-gray-700">{selectedNGO.city}</p>
                  </div>
                  <div>
                    <span className="font-medium">Contact Person:</span>
                    <p className="text-gray-700">{selectedNGO.contactPerson}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hold Reason Section */}
            {selectedNGO.status === 'on-hold' && selectedNGO.holdReason && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg border-b pb-2 text-red-600">Hold Reason</h3>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-700 font-medium">{selectedNGO.holdReason}</p>
                  {selectedNGO.putOnHoldAt && (
                    <p className="text-red-600 text-sm mt-2">
                      Put on hold: {new Date(selectedNGO.putOnHoldAt.toDate()).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg border-b pb-2 text-primary">NGO Description</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNGO.description || 'No description provided'}</p>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg border-b pb-2 text-primary">Verification Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Registration Number:</span>
                    <span className={`px-2 py-1 rounded text-sm ${selectedNGO.registrationNumber ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedNGO.registrationNumber ? '✓ Provided' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Contact Person:</span>
                    <span className={`px-2 py-1 rounded text-sm ${selectedNGO.contactPerson ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedNGO.contactPerson ? '✓ Provided' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Valid Email:</span>
                    <span className={`px-2 py-1 rounded text-sm ${selectedNGO.email && selectedNGO.email.includes('@') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedNGO.email && selectedNGO.email.includes('@') ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Phone Number:</span>
                    <span className={`px-2 py-1 rounded text-sm ${selectedNGO.phone && selectedNGO.phone.length >= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedNGO.phone && selectedNGO.phone.length >= 10 ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Address:</span>
                    <span className={`px-2 py-1 rounded text-sm ${selectedNGO.address ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedNGO.address ? '✓ Provided' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Description:</span>
                    <span className={`px-2 py-1 rounded text-sm ${selectedNGO.description && selectedNGO.description.length > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedNGO.description && selectedNGO.description.length > 50 ? '✓ Detailed' : '✗ Too short'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleApprove(selectedNGO.id);
                  setShowDetailsModal(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve NGO
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleReject(selectedNGO.id);
                  setShowDetailsModal(false);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject NGO
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {showHoldModal && selectedNGO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Put NGO on Hold</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHoldModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                NGO: <strong>{selectedNGO.name}</strong>
              </p>
              <Label htmlFor="holdReason">Reason for putting on hold:</Label>
              <Textarea
                id="holdReason"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Please provide a reason for putting this NGO on hold (e.g., suspicious activity, verification needed, etc.)"
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowHoldModal(false);
                  setHoldReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleHold(selectedNGO.id)}
              >
                Put on Hold
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedNGO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Delete NGO</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                NGO: <strong>{selectedNGO.name}</strong>
              </p>
              <Label htmlFor="deleteReason">Reason for deletion:</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Please provide a reason for deleting this NGO (e.g., fraudulent activity, violation of terms, etc.)"
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-red-600 mt-2">
                ⚠️ This action cannot be undone. The NGO will be marked as deleted and removed from the approved list.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedNGO.id)}
              >
                Delete NGO
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reason Modal */}
      {showDeleteReasonModal && selectedNGO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Deletion Details</h2>
              <Button
                variant="outline"
                onClick={() => setShowDeleteReasonModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">NGO Name</Label>
                <p className="text-sm text-gray-600">{selectedNGO.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Delete Reason</Label>
                <p className="text-sm text-gray-600">{selectedNGO.deleteReason || 'No reason provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Deleted By</Label>
                <p className="text-sm text-gray-600">{selectedNGO.deletedBy || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Deleted Date</Label>
                <p className="text-sm text-gray-600">
                  {selectedNGO.deletedAt ? new Date(selectedNGO.deletedAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
              {selectedNGO.status === 'deleted' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleRemoveFromBlacklist(selectedNGO.id)}
                  >
                    Remove from Blacklist
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hold Reason Modal */}
      {showHoldReasonModal && selectedNGO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Hold Details</h2>
              <Button
                variant="outline"
                onClick={() => setShowHoldReasonModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">NGO Name</Label>
                <p className="text-sm text-gray-600">{selectedNGO.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Hold Reason</Label>
                <p className="text-sm text-gray-600">{selectedNGO.holdReason || 'No reason provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Put On Hold By</Label>
                <p className="text-sm text-gray-600">{selectedNGO.putOnHoldBy || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Put On Hold Date</Label>
                <p className="text-sm text-gray-600">
                  {selectedNGO.putOnHoldAt ? new Date(selectedNGO.putOnHoldAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
              {selectedNGO.status === 'on-hold' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleRemoveFromHold(selectedNGO.id)}
                  >
                    Remove from Hold
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNGOApproval;
