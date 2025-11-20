import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Phone, Package, DollarSign, Check } from 'lucide-react';
import { orderDb, Order } from '@/lib/orderDatabase';
import { toast } from 'sonner';

const Ready = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadyOrders();
  }, []);

  const loadReadyOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderDb.getAllOrders();
      // Show only orders that are ready for pickup
      const readyOrders = allOrders.filter(order => order.status === 'ready');
      setOrders(readyOrders);
    } catch (error) {
      console.error('Error loading ready orders:', error);
      toast.error('Failed to load ready orders');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (orderId: string) => {
    try {
      await orderDb.updateOrder(orderId, { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      await loadReadyOrders(); // Reload to update the display
      toast.success('Order marked as completed and moved to pickups');
    } catch (error) {
      console.error('Error marking order as completed:', error);
      toast.error('Failed to mark order as completed');
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const OrderCard = ({ order }: { order: Order }) => {
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {order.orderNumber}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {order.customerName}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {order.customerPhone}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Ready since: {formatDate(order.createdAt)}
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 border-green-300 mb-2">
                Ready for Pickup
              </Badge>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(order.totalAmount)}
              </div>
              <div className="text-xs text-muted-foreground">
                {order.paymentMethod === 'on_collection' ? 'Payment Due' : 'Paid'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="w-4 h-4" />
              Items ({order.items.length})
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            {order.isExpress && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 mt-2">
                EXPRESS ORDER
              </Badge>
            )}
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => markAsCompleted(order.id)}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark as Completed
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-background p-6 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading ready orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-4xl font-bold mb-4">Ready for Pickup</h1>
          <p className="text-xl text-muted-foreground">No orders ready for pickup yet</p>
          <p className="text-sm text-muted-foreground mt-2">Orders will appear here when they're finished processing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Ready for Pickup</h1>
            <p className="text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? 's' : ''} ready for customer pickup
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-3 py-1">
            {orders.length} Ready
          </Badge>
        </div>
        
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ready;
