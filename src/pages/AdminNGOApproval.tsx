import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye } from "lucide-react";

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
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  approvedAt?: any;
}

const AdminNGOApproval = () => {
  const { user, userProfile } = useAuth();
  const [registrations, setRegistrations] = useState<NGORegistration[]>([]);
  const [approvedNGOs, setApprovedNGOs] = useState<NGORegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNGO, setSelectedNGO] = useState<NGORegistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    fetchApprovedNGOs();
  }, []);

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
      const q = query(collection(db, 'approvedNGOs'));
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
        status: 'rejected',
        rejectedAt: new Date()
      });
      
      toast.success('NGO rejected');
      fetchRegistrations();
    } catch (error) {
      console.error('Error rejecting NGO:', error);
      toast.error('Failed to reject NGO');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Registrations */}
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

          {/* Approved NGOs */}
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
                          <Button size="sm" variant="outline">
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
        </div>
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
    </div>
  );
};

export default AdminNGOApproval;
