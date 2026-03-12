import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Package, AlertCircle, ShoppingBag } from "lucide-react";

interface DonationRequest {
  id: string;
  title: string;
  description: string;
  items: string;
  pickupAddress: string;
  category: string;
  urgency: string;
  requestedByNGO: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  createdAt: any;
  fulfilledBy?: string;
  fulfilledAt?: any;
}

const NGORequestedOrders = () => {
  const { user } = useAuth();
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestedDonations();
  }, []);

  const fetchRequestedDonations = async () => {
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
      })) as DonationRequest[];
      setDonationRequests(data);
    } catch (error) {
      console.error('Error fetching requested donations:', error);
      toast.error('Failed to fetch requested donations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'donationRequests', requestId), {
        status: 'cancelled'
      });
      
      toast.success('Donation request cancelled successfully!');
      fetchRequestedDonations();
    } catch (error) {
      console.error('Error cancelling donation request:', error);
      toast.error('Failed to cancel donation request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'fulfilled':
        return <Badge className="bg-green-100 text-green-800">Fulfilled</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Normal</Badge>;
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
          <h1 className="font-display text-4xl font-bold mb-1 text-gray-900">Requested Orders</h1>
          <p className="text-gray-600">Manage donation requests you have made to donors</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600">Total Requests</p>
                  <p className="text-3xl font-bold text-blue-800">{donationRequests.length}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-800">{donationRequests.filter(r => r.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600">Fulfilled</p>
                  <p className="text-3xl font-bold text-green-800">{donationRequests.filter(r => r.status === 'fulfilled').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600">Cancelled</p>
                  <p className="text-3xl font-bold text-red-800">{donationRequests.filter(r => r.status === 'cancelled').length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                Donation Requests
              </span>
              <span className="text-sm font-normal text-gray-600">
                {donationRequests.length} request{donationRequests.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-blue-600">Loading requests...</p>
              </div>
            ) : donationRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No donation requests</p>
                <p className="text-sm">Request donations from the NGO dashboard to see them here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">Request Title</TableHead>
                      <TableHead className="font-semibold text-gray-900">Items Needed</TableHead>
                      <TableHead className="font-semibold text-gray-900">Category</TableHead>
                      <TableHead className="font-semibold text-gray-900">Urgency</TableHead>
                      <TableHead className="font-semibold text-gray-900">Pickup Address</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50 transition-colors">
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
                        <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 truncate">
                              {request.pickupAddress}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            {request.status === 'fulfilled' && (
                              <Badge className="bg-green-100 text-green-800">
                                Fulfilled
                              </Badge>
                            )}
                            {request.status === 'cancelled' && (
                              <Badge className="bg-red-100 text-red-800">
                                Cancelled
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

export default NGORequestedOrders;
