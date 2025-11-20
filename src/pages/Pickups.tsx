import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Phone, Package, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { orderDb, Order } from '@/lib/orderDatabase';
import { toast } from 'sonner';

const Pickups = () => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [pickedUpOrders, setPickedUpOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'completed' | 'pickedUp'>('completed');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderDb.getAllOrders();
      
      // Separate completed orders (ready for pickup) and picked up orders
      const completed = allOrders.filter(order => order.status === 'completed');
      const pickedUp = allOrders.filter(order => order.status === 'picked-up');
      
      setCompletedOrders(completed);
      setPickedUpOrders(pickedUp);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const markAsPickedUp = async (orderId: string) => {
    try {
      await orderDb.updateOrder(orderId, { 
        status: 'picked-up',
        pickedUpAt: new Date().toISOString()
      });
      await loadOrders(); // Reload to update the display
      toast.success('Order marked as picked up');
    } catch (error) {
      console.error('Error marking order as picked up:', error);
      toast.error('Failed to mark order as picked up');
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const OrderCard = ({ order, showPickupButton = false }: { order: Order; showPickupButton?: boolean }) => {
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
                {showPickupButton ? `Completed: ${formatDate(order.completedAt || order.createdAt)}` : `Picked up: ${formatDate(order.pickedUpAt || order.createdAt)}`}
              </div>
            </div>
            <div className="text-right">
              <Badge className={showPickupButton 
                ? "bg-blue-100 text-blue-800 border-blue-300 mb-2" 
                : "bg-gray-100 text-gray-800 border-gray-300 mb-2"
              }>
                {showPickupButton ? 'Awaiting Pickup' : 'Picked Up'}
              </Badge>
              <div className="text-lg font-bold">
                {formatCurrency(order.totalAmount)}
              </div>
              <div className="text-xs text-muted-foreground">
                {order.paymentMethod === 'on_collection' ? (showPickupButton ? 'Payment Due' : 'Paid on Collection') : 'Paid'}
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
          
          {showPickupButton && (
            <Button 
              className="w-full" 
              onClick={() => markAsPickedUp(order.id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Picked Up
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-background p-6 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  const currentOrders = activeTab === 'completed' ? completedOrders : pickedUpOrders;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Pickups & Collections</h1>
            <p className="text-muted-foreground">
              Manage completed orders and customer pickups
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <Button 
            variant={activeTab === 'completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('completed')}
            className="relative"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Awaiting Pickup ({completedOrders.length})
          </Button>
          <Button 
            variant={activeTab === 'pickedUp' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pickedUp')}
            className="relative"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Picked Up ({pickedUpOrders.length})
          </Button>
        </div>
        
        {currentOrders.length === 0 ? (
          <div className="text-center py-16">
            {activeTab === 'completed' ? (
              <>
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders awaiting pickup</h3>
                <p className="text-muted-foreground">Completed orders will appear here when they're ready for collection</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No picked up orders</h3>
                <p className="text-muted-foreground">Orders that have been collected will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {currentOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                showPickupButton={activeTab === 'completed'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pickups;
