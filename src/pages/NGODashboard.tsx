import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Truck, CheckCircle, XCircle, Clock } from "lucide-react";

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
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const q = query(
        collection(db, 'donations'),
        where('status', 'in', ['pending', 'accepted', 'rejected', 'picked_up'])
      );
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

  const handleAcceptDonation = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'accepted',
        assignedNGO: user?.uid,
        assignedNGOName: user?.displayName || 'Unknown NGO',
        acceptedAt: new Date()
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
        assignedNGO: user?.uid,
        assignedNGOName: user?.displayName || 'Unknown NGO',
        rejectedAt: new Date()
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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">NGO Dashboard</h1>
          <p className="text-muted-foreground">Manage donation requests and pickups</p>
        </div>

        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donations</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
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
                    <TableHead>Pickup Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{donation.donorName}</TableCell>
                      <TableCell>{donation.items}</TableCell>
                      <TableCell>{donation.pickupAddress}</TableCell>
                      <TableCell>{getStatusBadge(donation.status)}</TableCell>
                      <TableCell>{donation.assignedNGOName || 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {donation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptDonation(donation.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectDonation(donation.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {donation.status === 'accepted' && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkPickedUp(donation.id)}
                              className="bg-blue-600 hover:bg-blue-700"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NGODashboard;
