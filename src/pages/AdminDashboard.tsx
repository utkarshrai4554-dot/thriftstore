import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Users, Package, Gift, Truck, TrendingUp,
  CheckCircle, XCircle, DollarSign, ShoppingBag
} from "lucide-react";

const stats = [
  { label: "Total Sales", value: "₹24,580", icon: DollarSign, change: "+12%" },
  { label: "Active Users", value: "1,284", icon: Users, change: "+8%" },
  { label: "Products Listed", value: "432", icon: ShoppingBag, change: "+15%" },
  { label: "Donations", value: "89", icon: Gift, change: "+22%" },
];

const pendingProducts = [
  { id: 1, name: "Vintage Silk Scarf", seller: "Anna K.", status: "pending" },
  { id: 2, name: "Retro Sunglasses", seller: "Mike T.", status: "pending" },
  { id: 3, name: "Leather Belt", seller: "Sarah M.", status: "pending" },
];

const topProducts = [
  { name: "Vintage Leather Jacket", sales: 12 },
  { name: "Art Deco Vase", sales: 8 },
  { name: "Retro Gold Necklace", sales: 15 },
  { name: "Classic Canvas Sneakers", sales: 6 },
];

const deliveryAgents = [
  { name: "David R.", status: "online", deliveries: 23 },
  { name: "Lisa P.", status: "online", deliveries: 18 },
  { name: "Tom W.", status: "offline", deliveries: 31 },
];

const AdminDashboard = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your thrift store platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-success">{s.change}</Badge>
                </div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Pending Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Products Awaiting Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {pendingProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">by {p.seller}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <p className="font-medium text-sm">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {p.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {deliveryAgents.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                          {a.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.deliveries} deliveries</p>
                        </div>
                      </div>
                      <Badge variant={a.status === "online" ? "default" : "outline"}>
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
