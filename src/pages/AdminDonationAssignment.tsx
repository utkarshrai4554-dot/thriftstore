import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Truck, Users, CheckCircle, XCircle, Clock, Search, MapPin, Package, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  pickupAddress: string;
  items: string;
  description: string;
  cause: string;
  category?: string;
  urgency?: string;
  quantity?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up';
  assignedNGO?: string;
  assignedNGOName?: string;
  images?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  rejectedBy?: string[]; // Array of NGO UIDs who rejected this donation
  createdAt: any;
  acceptedAt?: any;
  pickedUpAt?: any;
}

interface NGO {
  id: string;
  uid: string;
  name: string;
  email: string;
  city: string;
  status: 'approved';
}

const AdminDonationAssignment = () => {
  const { user, userProfile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [approvedNGOs, setApprovedNGOs] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchDonations();
    fetchApprovedNGOs();
  }, []);

  // Add periodic refresh to see NGO actions in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDonations();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDonations = async () => {
    try {
      const q = query(collection(db, 'donations'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      setDonations(data);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedNGOs = async () => {
    try {
      const q = query(
        collection(db, 'approvedNGOs'),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NGO[];
      setApprovedNGOs(data);
    } catch (error) {
      console.error('Error fetching approved NGOs:', error);
    }
  };

  const handleAssignNGO = async (donationId: string, ngoId: string, ngoName: string, ngoUid: string) => {
    try {
      // First, get the donation details
      const donationDoc = await getDoc(doc(db, 'donations', donationId));
      const donationData = donationDoc.data();
      
      if (!donationData) {
        toast.error('Donation not found');
        return;
      }
      
      // Update the donation status
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'pending', // Reset to pending for new NGO to accept
        assignedNGO: ngoUid,
        assignedNGOName: ngoName,
        assignedBy: user?.uid,
        assignedAt: new Date(),
        ngoAssignedAt: new Date()
      });
      
      // Create a record in ngoAcceptedOrders for leaderboard tracking
      await setDoc(doc(db, 'ngoAcceptedOrders', `${donationId}_${ngoId}`), {
        donationId: donationId,
        ngoId: ngoId,
        ngoName: ngoName,
        ngoUid: ngoUid,
        donorId: donationData.userId || donationData.donorId,
        donorName: donationData.donorName,
        donorEmail: donationData.donorEmail,
        items: donationData.items,
        quantity: donationData.quantity,
        cause: donationData.cause,
        pickupAddress: donationData.pickupAddress,
        status: 'assigned',
        assignedBy: user?.uid,
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      console.log('🤝 NGO Assignment created:', {
        donationId,
        ngoId,
        ngoName,
        donorId: donationData.userId || donationData.donorId,
        donorName: donationData.donorName
      });
      
      toast.success(`Donation assigned to ${ngoName}!`);
      fetchDonations();
    } catch (error) {
      console.error('Error assigning NGO:', error);
      toast.error('Failed to assign NGO');
    }
  };

  const handleAcceptDonation = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: user?.uid
      });
      
      toast.success('Donation accepted successfully! Ready for NGO assignment.');
      fetchDonations();
    } catch (error) {
      console.error('Error accepting donation:', error);
      toast.error('Failed to accept donation');
    }
  };

  const handleRemoveDonation = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to remove this donation? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'donations', donationId));
      toast.success('Donation removed successfully!');
      fetchDonations();
    } catch (error) {
      console.error('Error removing donation:', error);
      toast.error('Failed to remove donation');
    }
  };

  const handleUnassignNGO = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'pending',
        assignedNGO: null,
        assignedNGOName: null,
        unassignedBy: user?.uid,
        unassignedAt: new Date()
      });
      
      toast.success('NGO assignment removed!');
      fetchDonations();
    } catch (error) {
      console.error('Error unassigning NGO:', error);
      toast.error('Failed to unassign NGO');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Assigned</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'picked_up':
        return <Badge className="bg-blue-100 text-blue-800">Picked Up</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesFilter = filter === 'all' || donation.status === filter;
    const matchesSearch = searchTerm === '' || 
      donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.assignedNGOName && donation.assignedNGOName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDonations = filteredDonations.slice(startIndex, endIndex);

  const truncateText = (text: string | undefined | null, maxLength: number) => {
    if (!text || typeof text !== 'string') return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">Donation Assignment</h1>
              <p className="text-muted-foreground">Assign donated items to specific NGOs</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold">{donations.length}</div>
                <div className="text-sm text-muted-foreground">Total Donations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{approvedNGOs.length}</div>
                <div className="text-sm text-muted-foreground">Available NGOs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{donations.filter(d => d.status === 'pending').length}</div>
                <div className="text-sm text-muted-foreground">Pending Assignment</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search donations by donor, items, cause, address, or NGO..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(value) => {
              setFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Donations</SelectItem>
                <SelectItem value="pending">Pending Assignment</SelectItem>
                <SelectItem value="accepted">Accepted (Ready for Assignment)</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Total Donations</p>
                  <p className="text-3xl font-bold">{donations.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">{donations.filter(d => d.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Assigned</p>
                  <p className="text-3xl font-bold">{donations.filter(d => d.status === 'accepted').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{donations.filter(d => d.status === 'picked_up').length}</p>
                </div>
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Donation Requests</span>
              <span className="text-sm font-normal text-muted-foreground">
                Showing {paginatedDonations.length} of {filteredDonations.length} donations
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No donations found</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Images</TableHead>
                        <TableHead className="font-semibold">Donor</TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">Cause</TableHead>
                        <TableHead className="font-semibold">Pickup Address</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Assigned NGO</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDonations.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell>
                            {donation.images && donation.images.length > 0 ? (
                              <div className="flex gap-1">
                                {donation.images.slice(0, 3).map((image, index) => {
                                  // Handle different image formats
                                  let imageUrl = '';
                                  if (typeof image === 'string') {
                                    imageUrl = image;
                                  } else if (image.url) {
                                    imageUrl = image.url;
                                  } else if (image.name) {
                                    // If it's a file object with name, try to construct URL
                                    imageUrl = `/uploads/donations/${image.name}`;
                                  } else {
                                    console.log('Image structure:', image);
                                    imageUrl = '';
                                  }
                                  
                                  return (
                                    <div key={index} className="relative">
                                      {imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Donation image ${index + 1}`}
                                          className="w-12 h-12 object-cover rounded border"
                                          onClick={() => window.open(imageUrl, '_blank')}
                                          style={{ cursor: 'pointer' }}
                                          onError={(e) => {
                                            console.log('Image failed to load:', imageUrl);
                                            // Use fallback donation image
                                            e.currentTarget.src = '/donation-sample.svg';
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src="/donation-sample.svg"
                                          alt={`Donation image ${index + 1}`}
                                          className="w-12 h-12 object-cover rounded border"
                                          onClick={() => window.open('/donation-sample.svg', '_blank')}
                                          style={{ cursor: 'pointer' }}
                                        />
                                      )}
                                      {donation.images.length > 3 && index === 2 && (
                                        <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center text-white text-xs">
                                          +{donation.images.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <img
                                src="/donation-sample.svg"
                                alt="No donation image"
                                className="w-12 h-12 object-cover rounded border"
                                onClick={() => window.open('/donation-sample.svg', '_blank')}
                                style={{ cursor: 'pointer' }}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{donation.donorName || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="truncate" title={donation.items || 'N/A'}>
                                {truncateText(donation.items, 30)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {donation.cause || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground truncate" title={donation.pickupAddress || 'N/A'}>
                                  {truncateText(donation.pickupAddress, 40)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(donation.status)}</TableCell>
                          <TableCell>
                            {donation.assignedNGOName ? (
                              <Badge className="bg-green-100 text-green-800">
                                {donation.assignedNGOName}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {donation.status === 'pending' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDonation(donation);
                                        console.log('Selected donation for assignment:', donation);
                                        console.log('RejectedBy array:', donation.rejectedBy);
                                        setShowAssignModal(true);
                                      }}
                                      className="text-green-600 focus:text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Assign to NGO
                                    </DropdownMenuItem>
                                  )}
                                  {donation.status === 'accepted' && (
                                    <>
                                      {!donation.assignedNGO ? (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedDonation(donation);
                                            setShowAssignModal(true);
                                          }}
                                          className="text-green-600 focus:text-green-600"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Assign to NGO
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() => handleUnassignNGO(donation.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Unassign NGO
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedDonation(donation);
                                      setShowDetailsModal(true);
                                    }}
                                  >
                                    <Package className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveDonation(donation.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Remove Donation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Available NGOs Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available NGOs for Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {approvedNGOs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No approved NGOs available</p>
                <p className="text-sm">Approve NGOs first to enable assignment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {approvedNGOs.map((ngo) => (
                  <Card key={ngo.id}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{ngo.name}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {ngo.city}
                        </p>
                        <p className="text-sm text-muted-foreground truncate" title={ngo.email}>
                          {ngo.email}
                        </p>
                      </div>
                      <Badge className="mt-3 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Donation to NGO</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Donation Details</h4>
                <p className="text-sm text-gray-600"><strong>Donor:</strong> {selectedDonation.donorName || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Items:</strong> {selectedDonation.items || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Cause:</strong> {selectedDonation.cause || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Select NGO</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {approvedNGOs
                    .filter(ngo => {
                      // Debug logging
                      console.log('NGO UID:', ngo.uid, 'RejectedBy:', selectedDonation?.rejectedBy);
                      console.log('Is NGO rejected?', selectedDonation?.rejectedBy?.includes(ngo.uid));
                      return !selectedDonation?.rejectedBy?.includes(ngo.uid);
                    })
                    .map((ngo) => (
                    <Button
                      key={ngo.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        handleAssignNGO(selectedDonation.id, ngo.id, ngo.name, ngo.uid);
                        setShowAssignModal(false);
                        setSelectedDonation(null);
                      }}
                    >
                      <div className="text-left">
                        <p className="font-medium">{ngo.name}</p>
                        <p className="text-sm text-gray-600">{ngo.city}</p>
                      </div>
                    </Button>
                  ))}
                  {selectedDonation?.rejectedBy && selectedDonation.rejectedBy.length > 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      {approvedNGOs.filter(ngo => selectedDonation?.rejectedBy?.includes(ngo.uid)).length} NGO(s) have rejected this donation
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Donation Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-6">
              {/* Donor Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
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

              {/* Donation Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Donation Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-sm text-muted-foreground">Cause</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedDonation.cause || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <Badge variant="secondary" className="mt-1">
                        {selectedDonation.category || 'General'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{selectedDonation.quantity || '1'} item(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Urgency</p>
                      <Badge variant={selectedDonation.urgency === 'High' ? 'destructive' : selectedDonation.urgency === 'Medium' ? 'default' : 'secondary'} className="mt-1">
                        {selectedDonation.urgency || 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">
                        {getStatusBadge(selectedDonation.status)}
                      </div>
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
                    {selectedDonation.acceptedAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Accepted Date</p>
                        <p className="font-medium">
                          {new Date(selectedDonation.acceptedAt.toDate ? selectedDonation.acceptedAt.toDate() : selectedDonation.acceptedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedDonation.pickedUpAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Picked Up Date</p>
                        <p className="font-medium">
                          {new Date(selectedDonation.pickedUpAt.toDate ? selectedDonation.pickedUpAt.toDate() : selectedDonation.pickedUpAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned NGO</p>
                      <p className="font-medium">{selectedDonation.assignedNGOName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Donation ID</p>
                      <p className="font-medium text-xs font-mono">{selectedDonation.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Donation Images
                </h3>
                {selectedDonation.images && selectedDonation.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedDonation.images.map((image, index) => {
                      // Handle different image formats
                      let imageUrl = '';
                      if (typeof image === 'string') {
                        imageUrl = image;
                      } else if (image.url) {
                        imageUrl = image.url;
                      } else if (image.name) {
                        // If it's a file object with name, try to construct URL
                        imageUrl = `/uploads/donations/${image.name}`;
                      } else {
                        console.log('Modal image structure:', image);
                        imageUrl = '';
                      }
                      
                      return (
                        <div key={index} className="relative group">
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={`Donation image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border cursor-pointer transition-transform hover:scale-105"
                                onClick={() => window.open(imageUrl, '_blank')}
                                onError={(e) => {
                                  console.log('Modal image failed to load:', imageUrl);
                                  // Use fallback donation image
                                  e.currentTarget.src = '/donation-sample.svg';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white/90 rounded px-2 py-1 text-xs">
                                  Click to view
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <img
                                src="/donation-sample.svg"
                                alt={`Donation image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border cursor-pointer transition-transform hover:scale-105"
                                onClick={() => window.open('/donation-sample.svg', '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white/90 rounded px-2 py-1 text-xs">
                                  Click to view
                                </div>
                              </div>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {image.name || `Image ${index + 1}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <img
                      src="/donation-sample.svg"
                      alt="No donation images"
                      className="w-32 h-32 mx-auto mb-4 object-cover rounded-lg border"
                    />
                    <p className="text-muted-foreground">No images uploaded for this donation</p>
                  </div>
                )}
              </div>

              {/* Pickup Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
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

              {/* Assignment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Assignment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedDonation.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned NGO</p>
                    <p className="font-medium">
                      {selectedDonation.assignedNGOName || 'Unassigned'}
                    </p>
                  </div>
                  {selectedDonation.acceptedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Accepted Date</p>
                      <p className="font-medium">
                        {new Date(selectedDonation.acceptedAt.toDate ? selectedDonation.acceptedAt.toDate() : selectedDonation.acceptedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedDonation.pickedUpAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Picked Up Date</p>
                      <p className="font-medium">
                        {new Date(selectedDonation.pickedUpAt.toDate ? selectedDonation.pickedUpAt.toDate() : selectedDonation.pickedUpAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedDonation.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowAssignModal(true);
                    }}
                  >
                    Assign to NGO
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDonationAssignment;
