import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customerId,
      items,
      total,
      paymentMethod,
      cashPaymentDetails,
      isExpress = false,
      stains = []
    } = req.body;
    
    const userId = req.user.userId;
    
    // Validate required fields
    if (!customerId || !items || !Array.isArray(items) || items.length === 0 || !total || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Customer ID, items, total, and payment method are required' 
      });
    }
    
    // Validate payment method
    const validPaymentMethods = ['CASH', 'CARD', 'ON_COLLECTION'];
    if (!validPaymentMethods.includes(paymentMethod.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    
    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `LOS-${String(orderCount + 1).padStart(6, '0')}`;
    
    // Validate and prepare order items
    const orderItems = items.map((item: any) => {
      if (!item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        throw new Error('Invalid item data: name, price, and quantity are required');
      }
      
      if (item.price < 0 || item.quantity < 1) {
        throw new Error('Invalid item data: price must be non-negative and quantity must be positive');
      }
      
      return {
        name: item.name.trim(),
        price: parseFloat(item.price.toFixed(2)),
        quantity: parseInt(item.quantity, 10),
        notes: item.notes ? item.notes.trim() : null
      };
    });
    
    // Calculate and validate total
    const calculatedTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const receivedTotal = parseFloat(total.toFixed(2));
    
    if (Math.abs(calculatedTotal - receivedTotal) > 0.01) {
      return res.status(400).json({ 
        error: `Total mismatch: calculated ${calculatedTotal.toFixed(2)}, received ${receivedTotal.toFixed(2)}` 
      });
    }
    
    // Create order with transaction
    const order = await prisma.$transaction(async (tx: any) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          userId,
          total: receivedTotal,
          paymentMethod: paymentMethod.toUpperCase(),
          cashPaymentDetails: cashPaymentDetails || null,
          isExpress: Boolean(isExpress),
          stains: Array.isArray(stains) ? stains.filter(s => typeof s === 'string' && s.trim()) : [],
          items: {
            create: orderItems
          }
        },
        include: {
          items: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      // Update customer statistics
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          lastOrderDate: new Date()
        }
      });
      
      return newOrder;
    });
    
    res.status(201).json({
      ...order,
      message: 'Order created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    if (error.message && error.message.includes('Invalid item data')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      customerId, 
      paymentMethod, 
      isExpress,
      limit = '50', 
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 orders
    const offsetNum = parseInt(offset as string, 10);
    
    // Build where clause
    const where: any = {};
    
    if (status) where.status = (status as string).toUpperCase();
    if (customerId) where.customerId = customerId as string;
    if (paymentMethod) where.paymentMethod = (paymentMethod as string).toUpperCase();
    if (isExpress !== undefined) where.isExpress = isExpress === 'true';
    
    // Build order by clause
    const validSortFields = ['createdAt', 'orderNumber', 'total', 'status'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const orderBy = { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' };
    
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy,
        take: limitNum,
        skip: offsetNum
      }),
      prisma.order.count({ where })
    ]);
    
    res.json({
      orders,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['TODO', 'WASHERS', 'WAITING', 'DRYERS', 'COMPLETED', 'READY', 'PICKED_UP'];
    const upperStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const updateData: any = { status: upperStatus };
    
    // Set completion/pickup timestamps
    if (upperStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (upperStatus === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      ...order,
      message: `Order status updated to ${upperStatus}`
    });
    
  } catch (error: any) {
    console.error('Error updating order status:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update order details
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isExpress, stains, paymentMethod, cashPaymentDetails } = req.body;
    
    const updateData: any = {};
    
    if (isExpress !== undefined) updateData.isExpress = Boolean(isExpress);
    if (Array.isArray(stains)) updateData.stains = stains.filter(s => typeof s === 'string' && s.trim());
    if (paymentMethod) {
      const validPaymentMethods = ['CASH', 'CARD', 'ON_COLLECTION'];
      if (!validPaymentMethods.includes(paymentMethod.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
      updateData.paymentMethod = paymentMethod.toUpperCase();
    }
    if (cashPaymentDetails !== undefined) updateData.cashPaymentDetails = cashPaymentDetails;
    
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true
          }
        }
      }
    });
    
    res.json({
      ...order,
      message: 'Order updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating order:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only admin can delete orders
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to delete orders' });
    }
    
    await prisma.order.delete({
      where: { id }
    });
    
    res.json({ message: 'Order deleted successfully' });
    
  } catch (error: any) {
    console.error('Error canceling order:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get order statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [
      todayOrders,
      weekOrders,
      monthOrders,
      totalOrders,
      statusCounts,
      revenueToday,
      revenueWeek,
      revenueMonth
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfDay } }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfWeek } }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfMonth } }
      })
    ]);
    
    res.json({
      orders: {
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
        total: totalOrders
      },
      revenue: {
        today: revenueToday._sum.total || 0,
        thisWeek: revenueWeek._sum.total || 0,
        thisMonth: revenueMonth._sum.total || 0
      },
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.status;
        return acc;
      }, {} as Record<string, number>)
    });
    
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

export default router;