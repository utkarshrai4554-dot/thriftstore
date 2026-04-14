import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { 

  Package, 

  User, 

  Truck, 

  MapPin, 

  Calendar,

  CheckCircle,

  Clock,

  DollarSign,

  AlertCircle

} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

import { toast } from "sonner";

import { doc, updateDoc, collection, getDocs, query, where, orderBy, getDoc, setDoc, deleteDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";



interface DeliveryAssignment {

  id: string;

  title: string;

  brand: string;

  category: string;

  color?: string;

  size?: string;

  condition: string;

  originalPrice?: number;

  sellingPrice: number;

  description: string;

  images: string[];

  sellerId: string;

  sellerInfo?: {

    displayName: string;

    email: string;

  };

  status: 'awaiting-assignment' | 'assigned' | 'in-transit' | 'delivered';

  assignedTo?: string;

  assignedAt?: Date;

  approvedAt: Date;

  approvedBy: string;

  createdAt: Date;

  updatedAt: Date;

}



interface DeliveryAgent {

  uid: string;

  displayName: string;

  email: string;

  phone: string;

  vehicleType: string;

  vehicleNumber: string;

  drivingLicense: string;

  address: string;

  experience?: string;

  availability: string;

  status: string;

  totalDeliveries: number;

  rating: number;

  approvedAt: any;

  createdAt: any;

}



export const DeliveryAssignment = () => {

  const { user } = useAuth();

  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);

  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedAgent, setSelectedAgent] = useState<{ [key: string]: string }>({});



  // Helper function to format price in Indian currency

  const formatIndianPrice = (price: number | undefined | null) => {

    if (!price || isNaN(price)) return '₹0';

    

    const formattedPrice = new Intl.NumberFormat('en-IN', {

      style: 'currency',

      currency: 'INR',

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,

    }).format(price);

    

    return formattedPrice;

  };



  const fetchAssignments = async () => {

    try {

      console.log('📦 Fetching delivery assignments...');

      

      const assignmentsRef = collection(db, 'deliveryAssignment');

      const querySnapshot = await getDocs(assignmentsRef);

      

      const assignmentsList: DeliveryAssignment[] = [];

      

      for (const doc of querySnapshot.docs) {

        const assignmentData = doc.data();

        

        // Get seller information

        let sellerInfo = undefined;

        try {

          const sellerDoc = await getDoc(doc(db, 'users', assignmentData.sellerId));

          if (sellerDoc.exists()) {

            const sellerData = sellerDoc.data() as any;

            sellerInfo = {

              displayName: sellerData?.displayName || 'Unknown',

              email: sellerData?.email || 'Unknown'

            };

          }

        } catch (error) {

          console.error('Error fetching seller info:', error);

        }

        

        assignmentsList.push({

          id: doc.id,

          title: assignmentData.title || 'Unknown Product',

          brand: assignmentData.brand || 'Unknown',

          category: assignmentData.category || 'Other',

          color: assignmentData.color,

          size: assignmentData.size,

          condition: assignmentData.condition || 'Good',

          originalPrice: assignmentData.originalPrice,

          sellingPrice: assignmentData.sellingPrice,

          description: assignmentData.description || '',

          images: assignmentData.images || [],

          sellerId: assignmentData.sellerId,

          sellerInfo,

          status: assignmentData.status || 'awaiting-assignment',

          assignedTo: assignmentData.assignedTo,

          assignedAt: assignmentData.assignedAt?.toDate(),

          approvedAt: assignmentData.approvedAt?.toDate() || new Date(),

          approvedBy: assignmentData.approvedBy,

          createdAt: assignmentData.createdAt?.toDate() || new Date(),

          updatedAt: assignmentData.updatedAt?.toDate() || new Date()

        });

      }

      

      // Sort by approvedAt (newest first)

      assignmentsList.sort((a, b) => b.approvedAt.getTime() - a.approvedAt.getTime());

      

      console.log(`✅ Loaded ${assignmentsList.length} delivery assignments`);

      setAssignments(assignmentsList);

      

    } catch (error) {

      console.error('Error fetching delivery assignments:', error);

      toast.error('Failed to load delivery assignments');

    } finally {

      setLoading(false);

    }

  };



  const fetchDeliveryAgents = async () => {

    try {

      console.log('🚚 Fetching available delivery agents...');

      

      const agentsRef = collection(db, 'deliveryAgents');

      const querySnapshot = await getDocs(agentsRef);

      

      const agentsList: DeliveryAgent[] = querySnapshot.docs.map(doc => ({

        uid: doc.id,

        ...doc.data()

      })) as DeliveryAgent[];

      

      // Filter only approved agents

      const approvedAgents = agentsList.filter(agent => agent.status === 'approved');

      

      console.log(`✅ Loaded ${approvedAgents.length} approved delivery agents`);

      setDeliveryAgents(approvedAgents);

      

    } catch (error) {

      console.error('Error fetching delivery agents:', error);

      toast.error('Failed to load delivery agents');

    }

  };



  const handleAssignAgent = async (assignmentId: string, agentId: string) => {

    try {

      console.log('🚚 Assigning delivery agent:', { assignmentId, agentId });

      

      const assignmentRef = doc(db, 'deliveryAssignment', assignmentId);

      

      // Get agent info

      const agentDoc = await getDoc(doc(db, 'deliveryAgents', agentId));

      if (!agentDoc.exists()) {

        toast.error('Delivery agent not found');

        return;

      }

      

      const agentData = agentDoc.data();

      

      // Update assignment with assigned agent

      await updateDoc(assignmentRef, {

        assignedTo: agentId,

        assignedAt: new Date(),

        status: 'assigned',

        updatedAt: new Date()

      });

      

      // Update delivery agent's assigned products

      await updateDoc(doc(db, 'deliveryAgents', agentId), {

        currentAssignments: (agentData.currentAssignments || 0) + 1,

        updatedAt: new Date()

      });

      

      toast.success('Delivery agent assigned successfully');

      

      // Clear selection for this assignment

      const newSelectedAgent = { ...selectedAgent };

      delete newSelectedAgent[assignmentId];

      setSelectedAgent(newSelectedAgent);

      

      fetchAssignments();

      

    } catch (error) {

      console.error('Error assigning delivery agent:', error);

      toast.error('Failed to assign delivery agent');

    }

  };



  useEffect(() => {

    if (user) {

      fetchAssignments();

      fetchDeliveryAgents();

    }

  }, [user]);



  const getStatusBadge = (status: string) => {

    switch (status) {

      case 'awaiting-assignment':

        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Awaiting Assignment</Badge>;

      case 'assigned':

        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Truck className="w-3 h-3 mr-1" />Assigned</Badge>;

      case 'in-transit':

        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Package className="w-3 h-3 mr-1" />In Transit</Badge>;

      case 'delivered':

        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;

      default:

        return <Badge variant="outline">Unknown</Badge>;

    }

  };



  const awaitingAssignments = assignments.filter(a => a.status === 'awaiting-assignment');



  if (!user) {

    return (

      <div className="min-h-screen py-8">

        <div className="container mx-auto px-4">

          <div className="text-center py-16">

            <AlertCircle className="h-24 w-24 mx-auto text-muted-foreground mb-4" />

            <h2 className="font-display text-2xl font-bold mb-2">Authentication Required</h2>

            <p className="text-muted-foreground mb-6">You need to be logged in to access this page.</p>

          </div>

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen py-8">

      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header */}

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="font-display text-3xl font-bold">Delivery Assignment</h1>

            <p className="text-muted-foreground">Assign delivery agents to approved products</p>

          </div>

          <div className="flex items-center gap-4">

            <div className="text-sm text-muted-foreground">

              <span className="font-medium">{awaitingAssignments.length}</span> awaiting assignment

            </div>

            <div className="text-sm text-muted-foreground">

              <span className="font-medium">{deliveryAgents.length}</span> available agents

            </div>

          </div>

        </div>



        {loading ? (

          <div className="flex items-center justify-center py-16">

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>

            <span className="ml-2">Loading delivery assignments...</span>

          </div>

        ) : awaitingAssignments.length === 0 ? (

          <div className="text-center py-16">

            <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />

            <h3 className="text-lg font-medium mb-2">No Pending Assignments</h3>

            <p className="text-muted-foreground">All products have been assigned to delivery agents.</p>

          </div>

        ) : (

          <div className="space-y-6">

            {awaitingAssignments.map((assignment) => (

              <Card key={assignment.id} className="w-full">

                <CardHeader>

                  <div className="flex items-start justify-between">

                    <div className="flex-1">

                      <div className="flex items-center gap-2 mb-2">

                        <CardTitle className="text-xl">{assignment.title}</CardTitle>

                        {getStatusBadge(assignment.status)}

                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">

                        <span>{assignment.brand}</span>

                        <span>•</span>

                        <span>{assignment.category}</span>

                        <span>•</span>

                        <span>{assignment.condition}</span>

                      </div>

                    </div>

                    <div className="text-right">

                      <div className="text-lg font-bold text-green-600">

                        {formatIndianPrice(assignment.sellingPrice)}

                      </div>

                      {assignment.originalPrice && (

                        <div className="text-sm text-muted-foreground line-through">

                          {formatIndianPrice(assignment.originalPrice)}

                        </div>

                      )}

                    </div>

                  </div>

                </CardHeader>

                <CardContent>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Product Details */}

                    <div className="space-y-4">

                      <div>

                        <h4 className="font-medium mb-2">Product Details</h4>

                        <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>

                        {assignment.images && assignment.images.length > 0 && (

                          <div className="flex gap-2">

                            {assignment.images.slice(0, 3).map((image, index) => (

                              <img

                                key={index}

                                src={image}

                                alt={`${assignment.title} ${index + 1}`}

                                className="w-16 h-16 object-cover rounded border"

                              />

                            ))}

                            {assignment.images.length > 3 && (

                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-sm text-muted-foreground">

                                +{assignment.images.length - 3}

                              </div>

                            )}

                          </div>

                        )}

                      </div>

                      

                      <div className="grid grid-cols-2 gap-4 text-sm">

                        {assignment.color && (

                          <div>

                            <span className="font-medium">Color:</span> {assignment.color}

                          </div>

                        )}

                        {assignment.size && (

                          <div>

                            <span className="font-medium">Size:</span> {assignment.size}

                          </div>

                        )}

                      </div>

                    </div>



                    {/* Assignment Section */}

                    <div className="space-y-4">

                      <div>

                        <h4 className="font-medium mb-2">Seller Information</h4>

                        <div className="flex items-center gap-2 text-sm">

                          <Avatar className="h-8 w-8">

                            <AvatarFallback>

                              {assignment.sellerInfo?.displayName?.charAt(0) || 'S'}

                            </AvatarFallback>

                          </Avatar>

                          <div>

                            <div className="font-medium">{assignment.sellerInfo?.displayName}</div>

                            <div className="text-muted-foreground">{assignment.sellerInfo?.email}</div>

                          </div>

                        </div>

                      </div>



                      <div>

                        <h4 className="font-medium mb-2">Assign Delivery Agent</h4>

                        <Select

                          value={selectedAgent[assignment.id] || ''}

                          onValueChange={(value) => 

                            setSelectedAgent(prev => ({ ...prev, [assignment.id]: value }))

                          }

                        >

                          <SelectTrigger>

                            <SelectValue placeholder="Select delivery agent..." />

                          </SelectTrigger>

                          <SelectContent>

                            {deliveryAgents.map((agent) => (

                              <SelectItem key={agent.uid} value={agent.uid}>

                                <div className="flex items-center gap-2">

                                  <Avatar className="h-6 w-6">

                                    <AvatarFallback>

                                      {agent.displayName?.charAt(0) || 'D'}

                                    </AvatarFallback>

                                  </Avatar>

                                  <div>

                                    <div className="font-medium">{agent.displayName}</div>

                                    <div className="text-xs text-muted-foreground">

                                      {agent.vehicleType} • {agent.totalDeliveries || 0} deliveries

                                    </div>

                                  </div>

                                </div>

                              </SelectItem>

                            ))}

                          </SelectContent>

                        </Select>

                      </div>



                      <Button

                        onClick={() => selectedAgent[assignment.id] && handleAssignAgent(assignment.id, selectedAgent[assignment.id])}

                        disabled={!selectedAgent[assignment.id]}

                        className="w-full"

                      >

                        <Truck className="mr-2 h-4 w-4" />

                        Assign to Delivery Agent

                      </Button>

                    </div>

                  </div>

                </CardContent>

              </Card>

            ))}

          </div>

        )}

      </div>

    </div>

  );

};

