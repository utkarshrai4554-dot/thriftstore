import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, ArrowRight, Truck, CheckCircle, User, Phone, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import DeliveryAgentInterface from "@/components/DeliveryAgentInterface";

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

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeliveryAgent, setIsDeliveryAgent] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    checkUserRole();
    fetchDeliveryAgents();
  }, [user]);

  const checkUserRole = async () => {
    if (!user?.uid) return;
    
    try {
      // Check if user is a delivery agent
      const agentDoc = await getDoc(doc(db, 'deliveryAgents', user.uid));
      if (agentDoc.exists()) {
        setIsDeliveryAgent(true);
        setUserRole('delivery_agent');
        return;
      }

      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setUserRole('admin');
        return;
      }

      setUserRole('user');
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('user');
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      setLoading(true);
      console.log('Fetching delivery agents from collection...');
      
      const deliveryAgentsCollection = collection(db, 'deliveryAgents');
      const querySnapshot = await getDocs(deliveryAgentsCollection);
      
      const agents: DeliveryAgent[] = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as DeliveryAgent));
      
      console.log('Fetched delivery agents:', agents);
      setDeliveryAgents(agents);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // If user is a delivery agent, show their interface
  if (isDeliveryAgent) {
    return <DeliveryAgentInterface />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h1>
              <p className="text-gray-600">Manage your delivery agents and track performance</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDeliveryAgents}
              disabled={loading}
              className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Active Agents", value: deliveryAgents.length.toString(), icon: User, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Deliveries", value: deliveryAgents.reduce((sum, agent) => sum + agent.totalDeliveries, 0).toString(), icon: CheckCircle, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Avg Rating", value: deliveryAgents.length > 0 ? (deliveryAgents.reduce((sum, agent) => sum + agent.rating, 0) / deliveryAgents.length).toFixed(1) : "0", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((s, i) => {
            const IconComponent = s.icon;
            return (
              <Card key={i} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}>
                      <IconComponent className={`h-6 w-6 ${s.color}`} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{s.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Delivery Agents */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Delivery Agents</h2>
            <p className="text-sm text-gray-600 mt-1">Approved delivery agents and their performance metrics</p>
          </div>
          
          {deliveryAgents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Agents</h3>
              <p className="text-gray-600">No delivery agents have been approved yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deliveryAgents.map((agent) => (
                <div key={agent.uid} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.displayName}</p>
                        <p className="text-sm text-gray-600">{agent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{agent.totalDeliveries} deliveries</p>
                        <p className="text-sm text-gray-600">Rating: {agent.rating.toFixed(1)}</p>
                      </div>
                      <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm px-4 py-2 text-sm font-medium">
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{agent.vehicleType} ({agent.vehicleNumber})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{agent.availability}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        </div>
    </div>
  );
};

export default DeliveryDashboard;
