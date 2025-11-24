import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Enable API routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query to ensure database is working
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful');
    
    // Try to access users table to ensure schema exists
    try {
      await prisma.user.findFirst();
      console.log('✅ Database schema verified');
    } catch (schemaError) {
      console.log('⚠️ Database schema may not exist, attempting migration...');
      
      // Try to run migrations automatically
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Database migrations completed');
        
        // Test again
        await prisma.user.findFirst();
        console.log('✅ Database schema verified after migration');
      } catch (migrationError) {
        console.log('❌ Migration failed, but continuing...', migrationError instanceof Error ? migrationError.message : 'Unknown error');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('📝 Make sure PostgreSQL is running and the database exists');
    console.log('📝 Run: npx prisma migrate deploy');
    return false;
  }
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081', 
    'http://localhost:8082',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LaundryOS API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection and table existence
    await prisma.user.findFirst();
    const dbStatus = 'connected';
    
    res.json({
      status: 'OK',
      message: 'LaundryOS API Health Check',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus
    });
  } catch (error) {
    res.json({
      status: 'WARNING',
      message: 'API running but database issues detected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'error',
      error: 'Database tables may not exist. Run migrations: npx prisma migrate deploy'
    });
  }
});

// Database initialization endpoint (for development/deployment)
app.post('/api/init-db', async (req, res) => {
  try {
    console.log('🔄 Initializing database schema...');
    
    // First try to generate Prisma client
    try {
      const { execSync } = require('child_process');
      console.log('📦 Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Prisma generate failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Try to run migrations
    try {
      const { execSync } = require('child_process');
      console.log('🗄️ Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.log('❌ Migration command failed:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(500).json({
        success: false,
        message: 'Database migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Manual intervention may be required'
      });
    }
    
    // Test database tables
    try {
      await prisma.user.findFirst();
      console.log('✅ Database schema verified');
      
      return res.json({
        success: true,
        message: 'Database successfully initialized',
        tables: 'verified'
      });
    } catch (error) {
      console.log('❌ Schema verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(503).json({
        success: false,
        message: 'Database schema verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 LaundryOS API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8081'}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  
  // Test database connection
  const dbConnected = await connectDatabase();
  if (dbConnected) {
    console.log(`💾 PostgreSQL storage active`);
  } else {
    console.log(`⚠️  PostgreSQL connection failed - API routes may not work properly`);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('Database connection closed.');
    
    process.exit(0);
  });

  // Force close server after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;