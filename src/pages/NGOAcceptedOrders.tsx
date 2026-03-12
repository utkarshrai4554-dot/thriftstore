import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Truck, Package, Clock } from "lucide-react";

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

const NGOAcceptedOrders = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcceptedDonations();
  }, []);

  const fetchAcceptedDonations = async () => {
    try {
      // Fetch donations assigned to this NGO that have been accepted
      const q = query(
        collection(db, 'donations'),
        where('assignedNGO', '==', user?.uid),
        where('status', 'in', ['accepted', 'picked_up'])
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      setDonations(data);
    } catch (error) {
      console.error('Error fetching accepted donations:', error);
      toast.error('Failed to fetch accepted donations');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPickedUp = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'picked_up',
        pickedUpAt: new Date()
      });
      
      toast.success('Donation marked as picked up successfully!');
      fetchAcceptedDonations();
    } catch (error) {
      console.error('Error marking donation as picked up:', error);
      toast.error('Failed to mark donation as picked up');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Accepted</Badge>;
      case 'picked_up':
        return <Badge className="bg-green-100 text-green-800">Picked Up</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
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
          <h1 className="font-display text-4xl font-bold mb-1 text-gray-900">Accepted Orders</h1>
          <p className="text-gray-600">Manage donations you have accepted from donors</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600">Total Accepted</p>
                  <p className="text-3xl font-bold text-blue-800">{donations.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600">Picked Up</p>
                  <p className="text-3xl font-bold text-green-800">{donations.filter(d => d.status === 'picked_up').length}</p>
                </div>
                <Truck className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600">Pending Pickup</p>
                  <p className="text-3xl font-bold text-orange-800">{donations.filter(d => d.status === 'accepted').length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                Accepted Donations
              </span>
              <span className="text-sm font-normal text-gray-600">
                {donations.length} donation{donations.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-blue-600">Loading donations...</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No accepted donations</p>
                <p className="text-sm">Accept donations from donors to see them here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">Donor</TableHead>
                      <TableHead className="font-semibold text-gray-900">Items</TableHead>
                      <TableHead className="font-semibold text-gray-900">Pickup Address</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">{donation.donorName}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate" title={donation.items}>
                              {donation.items}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 truncate">
                              {donation.pickupAddress}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(donation.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {donation.status === 'accepted' && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkPickedUp(donation.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Mark Picked Up
                              </Button>
                            )}
                            {donation.status === 'picked_up' && (
                              <Badge className="bg-green-100 text-green-800">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NGOAcceptedOrders;
