import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'CASHIER' } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase() as 'ADMIN' | 'CASHIER',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
      }
    });
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      } as any,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    // Return response with user data and token
    const { password: _, ...userResponse } = user;
    
    res.status(201).json({
      user: {
        ...userResponse,
        role: user.role.toLowerCase()
      },
      token
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Handle Prisma table not found error
    if (error.code === 'P2021' || error.message?.includes('table') || error.message?.includes('relation')) {
      return res.status(503).json({ 
        error: 'Database schema not initialized',
        hint: 'Please run database migrations: npx prisma migrate deploy'
      });
    }
    
    // Handle general database connection errors
    if (error.message?.includes('connect') || error.message?.includes('database')) {
      return res.status(503).json({ 
        error: 'Database connection failed',
        hint: 'Please check database configuration'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      } as any,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );
    
    // Return response with user data and token
    const { password: _, ...userResponse } = user;
    
    res.json({
      user: {
        ...userResponse,
        role: user.role.toLowerCase()
      },
      token
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data without password
    const { password: _, ...userResponse } = user;
    
    res.json({
      user: {
        ...userResponse,
        role: user.role.toLowerCase()
      }
    });
    
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { name, email, avatar } = req.body;
    
    // Build update data object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    // Return user data without password
    const { password: _, ...userResponse } = updatedUser;
    
    res.json({
      user: {
        ...userResponse,
        role: updatedUser.role.toLowerCase()
      }
    });
    
  } catch (error: any) {
    console.error('Update profile error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.patch('/password', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });
    
    res.json({ message: 'Password updated successfully' });
    
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  // JWT logout is typically handled on the client side by removing the token
  // Here we can optionally log the logout event or invalidate the token server-side
  res.json({ message: 'Logged out successfully' });
});

export default router;