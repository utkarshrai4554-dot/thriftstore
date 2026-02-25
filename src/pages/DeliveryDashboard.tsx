import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, MapPin, ArrowRight, Truck, CheckCircle } from "lucide-react";

const deliveryOrders = [
  { id: "DEL001", product: "Vintage Silk Scarf", from: "Anna K.", to: "Warehouse", status: "Picked up", type: "pickup" },
  { id: "DEL002", product: "Retro Sunglasses", from: "Warehouse", to: "Mike T.", status: "Transporting", type: "delivery" },
  { id: "DEL003", product: "Leather Belt", from: "Sarah M.", to: "Warehouse", status: "Assigned", type: "pickup" },
];

const statusOptions = ["Picked up", "Transporting", "Reached warehouse", "Delivered", "Returned to seller"];

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Delivery Dashboard</h1>
            <p className="text-muted-foreground">Manage your pickups and deliveries</p>
          </div>
          <div className="flex items-center gap-3 bg-card border rounded-xl px-4 py-3">
            <Label htmlFor="availability" className="text-sm font-medium">
              {isOnline ? "Online" : "Offline"}
            </Label>
            <Switch id="availability" checked={isOnline} onCheckedChange={setIsOnline} />
          </div>
        </div>

        {!isOnline && (
          <div className="bg-muted rounded-xl p-6 text-center mb-8">
            <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">You're currently offline</p>
            <p className="text-sm text-muted-foreground">Toggle online to receive new delivery assignments</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Today", value: "3", icon: Package },
            { label: "Completed", value: "18", icon: CheckCircle },
            { label: "Total", value: "142", icon: Truck },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <s.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders */}
        <h2 className="font-display text-xl font-bold mb-4">Active Orders</h2>
        <div className="space-y-3">
          {deliveryOrders.map((order) => (
            <Card key={order.id} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{order.product}</p>
                    <p className="text-sm text-muted-foreground">#{order.id}</p>
                  </div>
                  <Badge variant={order.type === "pickup" ? "outline" : "default"}>
                    {order.type}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{order.from}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>{order.to}</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={order.status === s ? "default" : "outline"}
                      className="text-xs"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
