import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Phone, Package, DollarSign, ChevronRight, RefreshCw } from 'lucide-react';
import { orderDb, Order } from '@/lib/orderDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Process = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const { user } = useAuth();

  const statusColumns = [
    { key: 'new', title: 'To-Do', color: 'bg-blue-50 border-blue-200' },
    { key: 'washing', title: 'Washers', color: 'bg-purple-50 border-purple-200' },
    { key: 'in_progress', title: 'Waiting', color: 'bg-yellow-50 border-yellow-200' },
    { key: 'drying', title: 'Dryers', color: 'bg-orange-50 border-orange-200' },
    { key: 'ready', title: 'Ready', color: 'bg-green-50 border-green-200' },
    { key: 'completed', title: 'Pickup', color: 'bg-gray-50 border-gray-200' }
  ] as const;

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing orders...');
      loadOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading orders from database...');
      const allOrders = await orderDb.getAllOrders();
      console.log('All orders received:', allOrders.length, allOrders);
      
      // Filter out picked-up and cancelled orders from the process view
      // Keep orders that are still in the workflow (including completed ones waiting for pickup)
      const activeOrders = allOrders.filter(order => 
        !['picked-up', 'cancelled'].includes(order.status)
      );
      console.log('Active orders after filtering:', activeOrders.length, activeOrders);
      setOrders(activeOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (updatingOrder) return; // Prevent multiple updates
    
    try {
      setUpdatingOrder(orderId);
      console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);
      
      const updateData: Partial<Order> = { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      // Set appropriate timestamps based on status
      if (newStatus === 'completed') {
        updateData.completedAt = new Date().toISOString();
      } else if (newStatus === 'ready') {
        updateData.readyAt = new Date().toISOString();
      }
      
      console.log('📝 Update data:', updateData);
      
      const updatedOrder = await orderDb.updateOrder(orderId, updateData);
      console.log('✅ Updated order result:', updatedOrder);
      
      if (updatedOrder) {
        // Force reload orders to ensure UI consistency
        console.log('🔄 Reloading orders after status update...');
        await loadOrders();
        
        // Get status display name
        const statusNames = {
          'new': 'To-Do',
          'washing': 'Washers', 
          'in_progress': 'Waiting',
          'drying': 'Dryers',
          'ready': 'Ready',
          'completed': 'Pickup'
        };
        
        toast.success(`Order moved to ${statusNames[newStatus] || newStatus}`);
      } else {
        console.error('❌ Update returned null/undefined');
        toast.error('Failed to update order - no result');
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getOrdersForStatus = (status: string): Order[] => {
    const filtered = orders.filter(order => order.status === status);
    console.log(`Orders for status "${status}":`, filtered.length, filtered.map(o => ({ id: o.id, status: o.status })));
    return filtered;
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow: Record<Order['status'], Order['status'] | null> = {
      new: 'washing',
      washing: 'drying',
      in_progress: 'drying',
      drying: 'ready',
      ready: 'completed',
      completed: 'picked-up',
      'picked-up': null,
      cancelled: null
    };
    return statusFlow[currentStatus];
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const nextStatus = getNextStatus(order.status);
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-medium">
                {order.orderNumber}
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {order.customerName}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                {order.customerPhone}
              </div>
            </div>
            <Badge className={orderDb.getStatusColor(order.status)}>
              {orderDb.getStatusDisplayName(order.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1 font-medium">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(order.totalAmount)}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Created: {formatDate(order.createdAt)}
            </div>
            
            {order.estimatedCompletion && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Due: {formatDate(order.estimatedCompletion)}
              </div>
            )}

            <div className="text-xs">
              <div className="font-medium mb-1">Items:</div>
              <div className="space-y-1">
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="text-muted-foreground">
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>

            {nextStatus && (
              <Button 
                size="sm" 
                className="w-full mt-2"
                disabled={updatingOrder === order.id}
                onClick={() => updateOrderStatus(order.id, nextStatus)}
              >
                {updatingOrder === order.id ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Move to {(() => {
                      const statusNames = {
                        'new': 'To-Do',
                        'washing': 'Washers', 
                        'in_progress': 'Waiting',
                        'drying': 'Dryers',
                        'ready': 'Ready',
                        'completed': 'Pickup'
                      };
                      return statusNames[nextStatus] || nextStatus;
                    })()}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Order Processing</h1>
          <div className="flex items-center gap-2">
            <Badge variant={user ? "default" : "destructive"}>
              {user ? `Logged in: ${user.name}` : "Not authenticated"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('=== DEBUG INFO ===');
              console.log('Current orders:', orders);
              console.log('User:', user);
              console.log('Auth token:', localStorage.getItem('auth_token'));
              console.log('Local orders:', JSON.parse(localStorage.getItem('orders') || '[]'));
              alert(`Debug logged to console. Orders: ${orders.length}, User: ${user?.name || 'Not logged in'}`);
            }}
          >
            Debug
          </Button>
          <Badge variant="secondary">
            {orders.length} Active Orders
          </Badge>
        </div>
      </div>
      
      {/* Process columns */}
      <div className="flex-1 flex p-6 pt-2 gap-4 overflow-x-auto">
        {statusColumns.map((column) => {
          const columnOrders = getOrdersForStatus(column.key);
          
          return (
            <div key={column.key} className="flex-1 min-w-[320px]">
              <div className={`bg-card rounded-2xl h-full p-4 ${column.color}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{column.title}</h2>
                  <Badge variant="secondary" className="px-2 py-1">
                    {columnOrders.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {columnOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No orders here</p>
                      <p className="text-xs mt-1">Orders will appear as they move through the process</p>
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Process;
