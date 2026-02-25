import { mockOrders } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";

const statusConfig: Record<string, { color: string; icon: typeof Package }> = {
  "Picked up": { color: "bg-secondary/20 text-secondary", icon: Package },
  "Transporting": { color: "bg-primary/20 text-primary", icon: Truck },
  "Reached warehouse": { color: "bg-warm/20 text-warm", icon: MapPin },
  "Delivered": { color: "bg-success/20 text-success", icon: CheckCircle },
  "Returned to seller": { color: "bg-destructive/20 text-destructive", icon: Clock },
};

const statusSteps = ["Picked up", "Transporting", "Reached warehouse", "Delivered"];

const OrderTracking = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-2">Your Orders</h1>
        <p className="text-muted-foreground mb-8">Track your purchases and sales</p>

        <div className="space-y-4">
          {mockOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig["Picked up"];
            const stepIndex = statusSteps.indexOf(order.status);
            const Icon = config.icon;

            return (
              <div key={order.id} className="bg-card border rounded-xl p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium">{order.product}</p>
                    <p className="text-sm text-muted-foreground">Order #{order.id} • {order.date}</p>
                  </div>
                  <Badge className={config.color}>
                    <Icon className="h-3 w-3 mr-1" /> {order.status}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-1">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex-1 flex items-center">
                      <div
                        className={`h-2 w-full rounded-full ${
                          i <= stepIndex ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {statusSteps.map((step) => (
                    <span key={step} className="text-[10px] text-muted-foreground">{step}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
