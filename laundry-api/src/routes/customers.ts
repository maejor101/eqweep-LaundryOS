import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Get all customers with optional search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, limit = '50', offset = '0' } = req.query;
    
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    
    const where = search ? {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' as const } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' as const } }
      ]
    } : {};
    
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
        include: {
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);
    
    // Update totalOrders count to match actual orders
    const customersWithUpdatedCounts = customers.map(customer => ({
      ...customer,
      totalOrders: customer._count.orders,
      _count: undefined
    }));
    
    res.json({
      customers: customersWithUpdatedCounts,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
    
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: true,
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: { orders: true }
        }
      }
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({
      ...customer,
      totalOrders: customer._count.orders,
      _count: undefined
    });
    
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// Create or update customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }
    
    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    const cleanPhone = phone.trim();
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: cleanPhone }
    });
    
    if (existingCustomer) {
      // Update existing customer
      const updatedCustomer = await prisma.customer.update({
        where: { phone: cleanPhone },
        data: {
          name: name.trim(),
          email: email ? email.toLowerCase().trim() : null,
          address: address ? address.trim() : null
        },
        include: {
          _count: {
            select: { orders: true }
          }
        }
      });
      
      return res.json({
        ...updatedCustomer,
        totalOrders: updatedCustomer._count.orders,
        _count: undefined,
        message: 'Customer updated successfully'
      });
    }
    
    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.toLowerCase().trim() : null,
        address: address ? address.trim() : null
      },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    
    res.status(201).json({
      ...customer,
      totalOrders: customer._count.orders,
      _count: undefined,
      message: 'Customer created successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Update customer
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });
    
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const updateData: any = {};
    
    if (name) updateData.name = name.trim();
    if (phone) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
      updateData.phone = phone.trim();
    }
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updateData.email = email.toLowerCase().trim();
    }
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    
    res.json({
      ...updatedCustomer,
      totalOrders: updatedCustomer._count.orders,
      _count: undefined,
      message: 'Customer updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Phone number already exists for another customer' });
    }
    
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Update customer order statistics (called when order is created)
router.patch('/:id/order-stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        totalOrders: { increment: 1 },
        lastOrderDate: new Date()
      },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    
    res.json({
      ...customer,
      totalOrders: customer._count.orders,
      _count: undefined,
      message: 'Customer order statistics updated'
    });
    
  } catch (error: any) {
    console.error('Error updating customer stats:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(500).json({ error: 'Failed to update customer statistics' });
  }
});

// Delete customer (soft delete by deactivating)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if customer has any orders
    const orderCount = await prisma.order.count({
      where: { customerId: id }
    });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing orders. Consider archiving instead.' 
      });
    }
    
    await prisma.customer.delete({
      where: { id }
    });
    
    res.json({ message: 'Customer deleted successfully' });
    
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

export default router;