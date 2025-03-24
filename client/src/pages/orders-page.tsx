import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Separator } from "@/components/ui/separator";
import { Order, OrderItem, Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";

type OrderWithItems = {
  order: Order;
  items: (OrderItem & { product?: Product })[];
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    }
  });

  const getOrderDetails = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const data = await res.json();
      setSelectedOrder(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch order details",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy • h:mm a");
  };

  return (
    <DashboardLayout title="Orders" showSidebar>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Orders</h2>
          <p className="text-muted-foreground">
            View and track your orders
          </p>
        </div>
        
        <Separator />
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Amount: ₦{order.totalAmount}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => getOrderDetails(order.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <Package className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No Orders Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any orders yet. Visit the marketplace to purchase products.
            </p>
            <Button asChild className="mt-4">
              <a href="/marketplace">Browse Marketplace</a>
            </Button>
          </div>
        )}
      </div>
      
      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order.id}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedOrder && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p>{formatDate(selectedOrder.order.createdAt)}</p>
                  </div>
                  <Badge className={getStatusColor(selectedOrder.order.status)}>
                    {selectedOrder.order.status.charAt(0).toUpperCase() + selectedOrder.order.status.slice(1)}
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {item.product?.image ? (
                            <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {item.product?.name || `Product #${item.productId}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × ₦{item.price} = ₦{item.quantity * item.price}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <p className="font-semibold">Total Amount:</p>
                  <p className="font-semibold">₦{selectedOrder.order.totalAmount}</p>
                </div>
                
                {selectedOrder.order.updatedAt && selectedOrder.order.updatedAt !== selectedOrder.order.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Last Updated: {formatDate(selectedOrder.order.updatedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}