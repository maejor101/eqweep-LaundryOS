import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireAdminOrSelf } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, limit = '50', offset = '0', role } = req.query;
    
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = (role as string).toUpperCase();
    }
    
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum
      }),
      prisma.user.count({ where })
    ]);
    
    const usersWithStats = users.map((user: any) => ({
      ...user,
      role: user.role.toLowerCase(),
      totalOrders: user._count.orders,
      _count: undefined
    }));
    
    res.json({
      users: usersWithStats,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, requireAdminOrSelf, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            customer: {
              select: { name: true, phone: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { orders: true }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      ...user,
      role: user.role.toLowerCase(),
      totalOrders: user._count.orders,
      _count: undefined
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'CASHIER' } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Validate role
    const validRoles = ['ADMIN', 'CASHIER'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN or CASHIER' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role.toUpperCase() as 'ADMIN' | 'CASHIER',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });
    
    res.status(201).json({
      ...user,
      role: user.role.toLowerCase(),
      message: 'User created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only, or user updating themselves)
router.patch('/:id', authenticateToken, requireAdminOrSelf, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updateData: any = {};
    
    if (name) updateData.name = name.trim();
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updateData.email = email.toLowerCase().trim();
    }
    
    // Only admins can update role and isActive
    if (req.user.role === 'ADMIN') {
      if (role) {
        const validRoles = ['ADMIN', 'CASHIER'];
        if (!validRoles.includes(role.toUpperCase())) {
          return res.status(400).json({ error: 'Invalid role. Must be ADMIN or CASHIER' });
        }
        updateData.role = role.toUpperCase();
      }
      
      if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });
    
    res.json({
      ...updatedUser,
      role: updatedUser.role.toLowerCase(),
      message: 'User updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deactivating yourself
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    res.json({
      ...user,
      role: user.role.toLowerCase(),
      message: 'User deactivated successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Activate user (admin only)
router.patch('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    res.json({
      ...user,
      role: user.role.toLowerCase(),
      message: 'User activated successfully'
    });
    
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// Delete user (admin only) - permanent deletion
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user has any orders
    const orderCount = await prisma.order.count({
      where: { userId: id }
    });
    
    if (orderCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing orders. Consider deactivating instead.' 
      });
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'User deleted successfully' });
    
  } catch (error: any) {
    console.error('Error resetting password:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;