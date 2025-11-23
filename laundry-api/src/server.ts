import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    // Railway production domains
    /.*\.up\.railway\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'LaundryOS API Health Check',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  // Use the copied React build files
  const frontendPath = path.join(__dirname, '../public');
  console.log(`📁 Serving React frontend from: ${frontendPath}`);
  
  const fs = require('fs');
  if (fs.existsSync(frontendPath) && fs.existsSync(path.join(frontendPath, 'index.html'))) {
    console.log(`✅ React frontend files found at: ${frontendPath}`);
    
    app.use(express.static(frontendPath, {
      maxAge: '1d',
      etag: false
    }));
    
    // Catch all handler for React Router SPA routing
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
          error: 'API endpoint not found',
          path: req.path,
          method: req.method
        });
      }
      
      const indexPath = path.join(frontendPath, 'index.html');
      console.log(`📄 Serving React app from: ${indexPath}`);
      res.sendFile(indexPath);
    });
  } else {
    console.log(`❌ React frontend not found at: ${frontendPath}, using fallback`);
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>LaundryOS - Building Frontend...</title></head>
        <body>
          <h1>🧺 LaundryOS</h1>
          <p>⚠️ React frontend is building... Please wait.</p>
          <p><a href="/api/health">API Health Check</a></p>
          <script>setTimeout(() => location.reload(), 10000);</script>
        </body>
        </html>
      `);
    });
  }
} else {
  // Development mode - just show API info
  app.get('/', (req, res) => {
    res.json({
      message: 'LaundryOS API is running!',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      frontend: 'Run separately in development'
    });
  });
}

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
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