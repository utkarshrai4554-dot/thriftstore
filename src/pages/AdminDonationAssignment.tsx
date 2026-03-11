import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Truck, Users, CheckCircle, XCircle, Clock } from "lucide-react";

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  pickupAddress: string;
  items: string;
  description: string;
  cause: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up';
  assignedNGO?: string;
  assignedNGOName?: string;
  createdAt: any;
  acceptedAt?: any;
  pickedUpAt?: any;
}

interface NGO {
  id: string;
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

  useEffect(() => {
    fetchDonations();
    fetchApprovedNGOs();
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

  const handleAssignNGO = async (donationId: string, ngoId: string, ngoName: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'accepted',
        assignedNGO: ngoId,
        assignedNGOName: ngoName,
        assignedBy: user?.uid,
        assignedAt: new Date()
      });
      
      toast.success(`Donation assigned to ${ngoName}!`);
      fetchDonations();
    } catch (error) {
      console.error('Error assigning NGO:', error);
      toast.error('Failed to assign NGO');
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
    if (filter === 'all') return true;
    return donation.status === filter;
  });

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
          <h1 className="font-display text-3xl font-bold mb-1">Donation Assignment</h1>
          <p className="text-muted-foreground">Assign donated items to specific NGOs</p>
        </div>

        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donations</SelectItem>
              <SelectItem value="pending">Pending Assignment</SelectItem>
              <SelectItem value="accepted">Assigned</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Donation Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading donations...</div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No donations found matching the current filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Cause</TableHead>
                    <TableHead>Pickup Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned NGO</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{donation.donorName}</TableCell>
                      <TableCell>{donation.items}</TableCell>
                      <TableCell>{donation.cause}</TableCell>
                      <TableCell>{donation.pickupAddress}</TableCell>
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
                        <div className="flex gap-2">
                          {donation.status === 'pending' && (
                            <div className="flex gap-1">
                              {approvedNGOs.map((ngo) => (
                                <Button
                                  key={ngo.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignNGO(donation.id, ngo.id, ngo.name)}
                                  className="text-xs"
                                >
                                  Assign to {ngo.name}
                                </Button>
                              ))}
                            </div>
                          )}
                          {donation.status === 'accepted' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUnassignNGO(donation.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Unassign
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
            )}
          </CardContent>
        </Card>

        {/* Available NGOs Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available NGOs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvedNGOs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No approved NGOs available for assignment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedNGOs.map((ngo) => (
                  <Card key={ngo.id} className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{ngo.name}</h3>
                    <p className="text-sm text-muted-foreground mb-1">{ngo.city}</p>
                    <p className="text-sm text-muted-foreground mb-3">{ngo.email}</p>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDonationAssignment;
