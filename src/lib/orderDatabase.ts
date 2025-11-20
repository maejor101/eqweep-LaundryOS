import { apiClient } from './api';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'on_collection';
  paymentStatus: 'paid' | 'pending';
  status: 'new' | 'in_progress' | 'washing' | 'drying' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  estimatedCompletion: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
}

class OrderDatabase {
  private storageKey = 'orders';
  
  // Map API status to frontend status
  private mapApiStatusToFrontend(apiStatus: string): Order['status'] {
    const statusMap: Record<string, Order['status']> = {
      'TODO': 'new',
      'WASHERS': 'washing',
      'WAITING': 'in_progress',
      'DRYERS': 'drying',
      'READY': 'ready',
      'COMPLETED': 'completed',
      'PICKED_UP': 'completed'
    };
    return statusMap[apiStatus] || 'new';
  }
  
  // Map frontend status to API status
  private mapFrontendStatusToApi(frontendStatus: Order['status']): string {
    const statusMap: Record<Order['status'], string> = {
      'new': 'TODO',
      'washing': 'WASHERS',
      'in_progress': 'WAITING',
      'drying': 'DRYERS',
      'ready': 'READY',
      'completed': 'COMPLETED',
      'cancelled': 'COMPLETED'
    };
    return statusMap[frontendStatus] || 'TODO';
  }
  
  // Transform API order to frontend format
  private transformApiOrder(apiOrder: any): Order {
    const transformed = {
      ...apiOrder,
      status: this.mapApiStatusToFrontend(apiOrder.status),
      customerName: apiOrder.customer?.name || apiOrder.customerName || 'Unknown',
      customerPhone: apiOrder.customer?.phone || apiOrder.customerPhone || '',
      totalAmount: apiOrder.total || apiOrder.totalAmount || 0,
      paymentStatus: 'paid' as const,
      estimatedCompletion: apiOrder.estimatedCompletion || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      items: apiOrder.items?.map((item: any) => ({
        id: item.id || Math.random().toString(),
        name: item.name || item.type || 'Unknown Item',
        price: item.price || 0,
        quantity: item.quantity || 1,
        notes: item.notes || ''
      })) || []
    };
    console.log(`Transforming API order ${apiOrder.id}: ${apiOrder.status} -> ${transformed.status}`);
    return transformed;
  }

  // Get all orders
  async getAllOrders(): Promise<Order[]> {
    console.log('getAllOrders called');
    
    // Always get local orders first
    const localOrders = this.getLocalOrders();
    console.log('Local orders found:', localOrders.length);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No authentication token found, using localStorage for orders only');
        return localOrders;
      }
      
      console.log('Fetching orders from API...');
      const response = await apiClient.getOrders();
      console.log('API response for orders:', response);
      
      let apiOrders: Order[] = [];
      if (response && Array.isArray(response)) {
        console.log('Raw API orders:', response.length);
        console.log('First raw API order status:', response[0]?.status);
        apiOrders = response.map(order => this.transformApiOrder(order));
        console.log('Transformed API orders:', apiOrders.length);
        console.log('First transformed order status:', apiOrders[0]?.status);
        console.log('All transformed order statuses:', apiOrders.map(o => ({ id: o.id, status: o.status })));
      } else if (response && response.orders && Array.isArray(response.orders)) {
        console.log('Raw API orders (nested):', response.orders.length);
        apiOrders = response.orders.map(order => this.transformApiOrder(order));
        console.log('Transformed API orders (nested):', apiOrders.length);
      } else {
        console.warn('Unexpected API response format:', response);
        return localOrders;
      }
      
      // Merge orders: API orders + any unique local orders
      const mergedOrders = [...apiOrders];
      localOrders.forEach(localOrder => {
        if (!mergedOrders.find(order => order.id === localOrder.id)) {
          console.log('Adding local order to merged list:', localOrder.id);
          mergedOrders.push(localOrder);
        }
      });
      
      console.log('Total merged orders:', mergedOrders.length);
      return mergedOrders;
      
    } catch (error) {
      console.warn('Failed to fetch orders from API, using localStorage:', error);
      return localOrders;
    }
  }

  // Get orders by status
  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    const orders = await this.getAllOrders();
    return orders.filter(order => order.status === status);
  }

  // Get single order
  async getOrder(id: string): Promise<Order | null> {
    try {
      const response = await apiClient.getOrder(id);
      return response.order || null;
    } catch (error) {
      console.warn('Failed to fetch order from API, using localStorage:', error);
      const orders = this.getLocalOrders();
      return orders.find(order => order.id === id) || null;
    }
  }

  // Create new order
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      // First, check if we need to create a customer
      let customerId = orderData.customerId;
      
      if (!customerId) {
        // Create customer first if no ID provided
        try {
          const customerResponse = await apiClient.saveCustomer({
            name: orderData.customerName,
            phone: orderData.customerPhone
          });
          customerId = customerResponse.customer?.id || customerResponse.id;
        } catch (customerError) {
          console.warn('Failed to create customer via API:', customerError);
          // Continue without customer ID for local storage fallback
        }
      }
      
      // Transform to API format
      const apiOrderData = {
        customerId: customerId || '',
        items: orderData.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || ''
        })),
        total: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod.toUpperCase(),
        isExpress: orderData.notes?.includes('Express: true') || false,
        stains: []
      };
      
      console.log('Creating order with API data:', apiOrderData);
      const response = await apiClient.createOrder(apiOrderData);
      
      let createdOrder: Order;
      
      // Return the created order from API response
      if (response.order) {
        createdOrder = response.order;
      } else if (response.id) {
        // Sometimes the response structure might be different
        createdOrder = {
          id: response.id,
          orderNumber: response.orderNumber || this.generateOrderNumber(),
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentStatus,
          status: orderData.status,
          notes: orderData.notes,
          estimatedCompletion: orderData.estimatedCompletion,
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.updatedAt || new Date().toISOString(),
          customerId: customerId
        };
      } else {
        console.warn('Unexpected API response format, falling back to local creation:', response);
        return this.createLocalOrder(orderData);
      }
      
      // Also save to localStorage as backup
      console.log('Saving order to localStorage as backup:', createdOrder.id);
      const localOrders = this.getLocalOrders();
      localOrders.push(createdOrder);
      localStorage.setItem(this.storageKey, JSON.stringify(localOrders));
      
      return createdOrder;
    } catch (error) {
      console.error('Failed to create order via API, saving locally:', error);
      // Fallback to local storage
      return this.createLocalOrder(orderData);
    }
  }

  // Update order
  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    console.log(`🔄 updateOrder called for ${id}:`, updates);
    
    try {
      // Map frontend status to API format if status is being updated
      const apiUpdates = { ...updates };
      if (apiUpdates.status) {
        const originalStatus = apiUpdates.status;
        apiUpdates.status = this.mapFrontendStatusToApi(apiUpdates.status) as any;
        console.log(`🔄 Status mapping: ${originalStatus} -> ${apiUpdates.status}`);
      }
      
      console.log('📤 Sending to API:', apiUpdates);
      const response = await apiClient.updateOrder(id, apiUpdates);
      console.log('📥 API response:', response);
      
      // The API returns the order data directly (not nested in .order)
      if (response && response.id) {
        const transformedOrder = this.transformApiOrder(response);
        console.log('✅ Transformed order:', transformedOrder);
        
        // Also update localStorage as backup
        const localOrders = this.getLocalOrders();
        const orderIndex = localOrders.findIndex(o => o.id === id);
        if (orderIndex !== -1) {
          localOrders[orderIndex] = transformedOrder;
          localStorage.setItem(this.storageKey, JSON.stringify(localOrders));
          console.log('💾 Updated localStorage backup');
        }
        
        return transformedOrder;
      }
      console.log('⚠️ No order data in response:', response);
      return null;
    } catch (error) {
      console.warn('❌ Failed to update order via API, updating locally:', error);
      return this.updateLocalOrder(id, updates);
    }
  }

  // Delete order
  async deleteOrder(id: string): Promise<boolean> {
    try {
      // Since deleteOrder doesn't exist in API client, use local storage
      return this.deleteLocalOrder(id);
    } catch (error) {
      console.warn('Failed to delete order via API, deleting locally:', error);
      return this.deleteLocalOrder(id);
    }
  }

  // Search orders
  async searchOrders(query: string): Promise<Order[]> {
    const orders = await this.getAllOrders();
    const searchTerm = query.toLowerCase();
    
    return orders.filter(order => 
      order.customerName.toLowerCase().includes(searchTerm) ||
      order.customerPhone.includes(searchTerm) ||
      order.orderNumber.toLowerCase().includes(searchTerm) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm))
    );
  }

  // Generate order number
  generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `LO${year}${month}${day}${time}${random}`;
  }

  // LocalStorage fallback methods
  private getLocalOrders(): Order[] {
    try {
      const orders = localStorage.getItem(this.storageKey);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error parsing orders from localStorage:', error);
      return [];
    }
  }

  private createLocalOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getLocalOrders();
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
    return newOrder;
  }

  private updateLocalOrder(id: string, updates: Partial<Order>): Order | null {
    const orders = this.getLocalOrders();
    const index = orders.findIndex(order => order.id === id);
    
    if (index === -1) return null;
    
    orders[index] = {
      ...orders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
    return orders[index];
  }

  private deleteLocalOrder(id: string): boolean {
    const orders = this.getLocalOrders();
    const filteredOrders = orders.filter(order => order.id !== id);
    
    if (filteredOrders.length === orders.length) return false;
    
    localStorage.setItem(this.storageKey, JSON.stringify(filteredOrders));
    return true;
  }

  // Utility methods
  calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getStatusColor(status: Order['status']): string {
    const colors = {
      new: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      washing: 'bg-purple-100 text-purple-800 border-purple-300',
      drying: 'bg-orange-100 text-orange-800 border-orange-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      'picked-up': 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    
    return colors[status] || colors.new;
  }

  getStatusDisplayName(status: Order['status']): string {
    const names = {
      new: 'New Order',
      in_progress: 'In Progress',
      washing: 'Washing',
      drying: 'Drying',
      ready: 'Ready for Collection',
      completed: 'Awaiting Pickup',
      'picked-up': 'Picked Up',
      cancelled: 'Cancelled'
    };
    
    return names[status] || status;
  }
}

export const orderDb = new OrderDatabase();