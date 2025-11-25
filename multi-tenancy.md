# Multi-Tenancy Implementation Guide for LaundryOS

This document outlines the comprehensive approach to implementing multi-tenancy in LaundryOS, allowing multiple laundry businesses to use the application independently.

## Multi-Tenancy Architecture Comparison

### Option 1: Single Database with Tenant ID (Schema-based)
**Recommended for initial implementation**

#### Advantages:
- **Cost Effective**: One database instance for all tenants
- **Easy Maintenance**: Single codebase, one deployment
- **Shared Resources**: Efficient resource utilization
- **Cross-tenant Analytics**: Easy to analyze platform-wide data
- **Backup Simplicity**: One backup strategy
- **Quick Scaling**: Add tenants instantly

#### Disadvantages:
- **Data Isolation Risk**: Programming errors could leak data between tenants
- **Performance Impact**: Large tenants can affect smaller ones
- **Limited Customization**: Hard to customize per tenant
- **Compliance Issues**: Some regulations require complete data separation
- **Single Point of Failure**: Database issues affect all tenants

---

### Option 2: Separate Docker Images per Tenant
**Complete isolation approach**

#### Advantages:
- **Perfect Isolation**: Complete data and application separation
- **Custom Deployments**: Each tenant can have different versions/features
- **Independent Scaling**: Scale each tenant based on their needs
- **Better Security**: Breach in one tenant doesn't affect others
- **Compliance Ready**: Meets strict data residency requirements
- **Performance Isolation**: No "noisy neighbor" problems

#### Disadvantages:
- **High Infrastructure Costs**: Separate database + app instances per tenant
- **Complex Management**: Multiple deployments to maintain
- **Resource Waste**: Many small tenants = underutilized resources
- **Slower Onboarding**: New tenant setup takes longer
- **Update Complexity**: Rolling out updates to hundreds of instances

---

### Option 3: Hybrid Approach (Future Scaling)
**Best of both worlds for enterprise scaling**

Combines schema-based multi-tenancy for small tenants with dedicated instances for large enterprise customers.

## Recommended Implementation

### Phase 1: Schema-based Multi-tenancy (Start Here)

Start with Option 1 as it's the most cost-effective and fastest to implement for validating the business model.

## Database Schema Updates

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// New Tenant model
model Tenant {
  id          String   @id @default(cuid())
  name        String   // Business name (e.g., "Clean Express Laundry")
  slug        String   @unique // URL slug (e.g., "clean-express")
  domain      String?  @unique // Custom domain (e.g., "cleanexpress.laundryos.app")
  subdomain   String   @unique // Subdomain (e.g., "cleanexpress")
  email       String   
  phone       String?
  address     String?
  logo        String?  // Logo URL
  primaryColor String? @default("#3b82f6") // Brand color
  timezone    String   @default("Africa/Johannesburg")
  currency    String   @default("ZAR")
  isActive    Boolean  @default(true)
  plan        TenantPlan @default(FREE)
  maxUsers    Int      @default(5)
  maxOrders   Int      @default(100)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users       User[]
  customers   Customer[]
  orders      Order[]
  
  @@map("tenants")
}

model User {
  id        String   @id @default(cuid())
  email     String   
  name      String
  password  String
  role      Role     @default(CASHIER)
  avatar    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  lastLogin DateTime?
  
  // Multi-tenancy
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orders    Order[]
  
  // Unique email per tenant
  @@unique([email, tenantId])
  @@map("users")
}

model Customer {
  id            String    @id @default(cuid())
  name          String
  phone         String    
  email         String?
  address       String?
  totalOrders   Int       @default(0)
  createdAt     DateTime  @default(now())
  lastOrderDate DateTime?
  
  // Multi-tenancy
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orders        Order[]
  
  // Unique phone per tenant
  @@unique([phone, tenantId])
  @@map("customers")
}

model Order {
  id                 String          @id @default(cuid())
  orderNumber        String          
  customerId         String
  userId             String
  total              Float
  paymentMethod      PaymentMethod
  cashPaymentDetails Json?
  isExpress          Boolean         @default(false)
  status             OrderStatus     @default(TODO)
  stains             String[]
  createdAt          DateTime        @default(now())
  completedAt        DateTime?
  pickedUpAt         DateTime?
  
  // Multi-tenancy
  tenantId           String
  tenant             Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  customer Customer @relation(fields: [customerId], references: [id])
  user     User     @relation(fields: [userId], references: [id])
  items    OrderItem[]
  
  // Unique order number per tenant
  @@unique([orderNumber, tenantId])
  @@map("orders")
}

model OrderItem {
  id       String @id @default(cuid())
  orderId  String
  name     String
  price    Float
  quantity Int
  notes    String?
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@map("order_items")
}

enum Role {
  SUPER_ADMIN // Platform admin
  ADMIN       // Tenant admin
  MANAGER     // Tenant manager
  CASHIER     // Tenant cashier
}

enum TenantPlan {
  FREE     // Up to 5 users, 100 orders/month
  BASIC    // Up to 15 users, 500 orders/month
  PRO      // Up to 50 users, 2000 orders/month
  ENTERPRISE // Unlimited
}

enum OrderStatus {
  TODO
  WASHERS
  WAITING
  DRYERS
  READY
  COMPLETED
  PICKED_UP
}

enum PaymentMethod {
  CASH
  CARD
  ON_COLLECTION
}
```

## Middleware for Tenant Context

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    plan: string;
  };
}

export const extractTenant = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    let tenantIdentifier: string | null = null;
    
    // Method 1: Subdomain detection (e.g., cleanexpress.laundryos.app)
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'laundryos-app') {
      tenantIdentifier = subdomain;
    }
    
    // Method 2: Custom domain detection
    if (!tenantIdentifier) {
      const tenant = await prisma.tenant.findFirst({
        where: { domain: host },
        select: { id: true, name: true, slug: true, subdomain: true, plan: true }
      });
      
      if (tenant) {
        req.tenant = tenant;
        return next();
      }
    }
    
    // Method 3: Subdomain lookup
    if (tenantIdentifier) {
      const tenant = await prisma.tenant.findFirst({
        where: { subdomain: tenantIdentifier },
        select: { id: true, name: true, slug: true, subdomain: true, plan: true }
      });
      
      if (tenant) {
        req.tenant = tenant;
        return next();
      }
    }
    
    // Method 4: Fallback - tenant from JWT token or header
    const tenantHeader = req.headers['x-tenant-id'] as string;
    if (tenantHeader) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantHeader },
        select: { id: true, name: true, slug: true, subdomain: true, plan: true }
      });
      
      if (tenant) {
        req.tenant = tenant;
        return next();
      }
    }
    
    return res.status(400).json({ 
      error: 'Tenant not found. Please check your domain or subdomain.' 
    });
    
  } catch (error) {
    console.error('Tenant extraction error:', error);
    return res.status(500).json({ error: 'Failed to identify tenant' });
  }
};

export const requireTenant = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  next();
};
```

## Updated Authentication Middleware

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from './tenant';

export interface AuthRequest extends TenantRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify token belongs to current tenant
    if (req.tenant && decoded.tenantId !== req.tenant.id) {
      return res.status(403).json({ error: 'Token not valid for this tenant' });
    }
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Tenant Management API

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Register new tenant (public endpoint)
router.post('/register', async (req, res) => {
  try {
    const { 
      businessName, 
      subdomain, 
      adminName, 
      adminEmail, 
      adminPassword,
      phone,
      address 
    } = req.body;
    
    // Validate subdomain
    if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
      return res.status(400).json({ error: 'Invalid subdomain format' });
    }
    
    // Check if subdomain is available
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain },
          { slug: subdomain }
        ]
      }
    });
    
    if (existingTenant) {
      return res.status(409).json({ error: 'Subdomain already taken' });
    }
    
    // Check if admin email exists
    const existingUser = await prisma.user.findFirst({
      where: { email: adminEmail }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug: subdomain,
          subdomain,
          email: adminEmail,
          phone,
          address
        }
      });
      
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id
        }
      });
      
      return { tenant, adminUser };
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.adminUser.id,
        email: result.adminUser.email,
        role: result.adminUser.role,
        tenantId: result.tenant.id,
        tenantSlug: result.tenant.slug
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        url: `https://${result.tenant.subdomain}.laundryos.app`
      },
      user: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        role: result.adminUser.role
      },
      token
    });
    
  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Get tenant info
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            orders: true
          }
        }
      }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      ...tenant,
      stats: tenant._count
    });
    
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({ error: 'Failed to get tenant info' });
  }
});

// Update tenant settings (admin only)
router.patch('/settings', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.id;
    delete updates.slug;
    delete updates.subdomain;
    delete updates.createdAt;
    
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updates
    });
    
    res.json({ message: 'Tenant updated successfully', tenant });
    
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

export default router;
```

## Frontend Multi-tenancy Support

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  primaryColor?: string;
  currency: string;
  timezone: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const detectTenant = async () => {
      try {
        // Extract subdomain from current URL
        const host = window.location.hostname;
        const subdomain = host.split('.')[0];
        
        // For local development
        if (host === 'localhost' || host === '127.0.0.1') {
          // Use default tenant or prompt for tenant selection
          setTenant({
            id: 'local',
            name: 'Local Development',
            subdomain: 'local',
            currency: 'ZAR',
            timezone: 'Africa/Johannesburg'
          });
          setLoading(false);
          return;
        }
        
        // For production, tenant is determined by subdomain
        const response = await fetch('/api/tenants/info');
        if (response.ok) {
          const tenantData = await response.json();
          setTenant(tenantData);
        } else {
          setError('Tenant not found');
        }
        
      } catch (err) {
        setError('Failed to load tenant information');
      } finally {
        setLoading(false);
      }
    };
    
    detectTenant();
  }, []);
  
  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
};
```

## Tenant Registration Page

```tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const TenantSignup = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    phone: '',
    address: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Business account created successfully!');
        
        // Redirect to tenant subdomain
        const tenantUrl = `https://${data.tenant.subdomain}.laundryos.app`;
        window.location.href = tenantUrl;
      } else {
        toast.error(data.error || 'Failed to create business account');
      }
      
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: value });
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start Your Laundry Business</CardTitle>
          <p className="text-sm text-gray-600">
            Create your LaundryOS business account
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Clean Express Laundry"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="subdomain">Business URL</Label>
              <div className="flex">
                <Input
                  id="subdomain"
                  type="text"
                  value={formData.subdomain}
                  onChange={handleSubdomainChange}
                  placeholder="cleanexpress"
                  required
                />
                <span className="ml-2 text-sm text-gray-500 self-center">
                  .laundryos.app
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your business will be available at: {formData.subdomain}.laundryos.app
              </p>
            </div>
            
            <div>
              <Label htmlFor="adminName">Your Name</Label>
              <Input
                id="adminName"
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="adminEmail">Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="john@cleanexpress.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                placeholder="Choose a secure password"
                minLength={6}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+27 12 345 6789"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, Cape Town"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Business Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantSignup;
```

## Implementation Plan

### Phase 1: Backend Multi-tenancy
1. Update Prisma schema with tenant model
2. Add tenant middleware 
3. Update all API routes to include tenant context
4. Create tenant management endpoints

### Phase 2: Frontend Updates
1. Add tenant context provider
2. Create tenant signup page
3. Update authentication flow
4. Add tenant branding support

### Phase 3: Deployment & DNS
1. Configure subdomain routing
2. Set up wildcard SSL certificates
3. Deploy to production
4. Test multi-tenant functionality

### Phase 4: Advanced Features
1. Tenant analytics dashboard
2. Subscription billing integration
3. Custom domain support
4. White-label options

## Docker Configuration Examples

### Phase 1: Schema-based Multi-tenancy

```yaml
version: '3.8'

services:
  # Shared PostgreSQL Database
  postgres-shared:
    image: postgres:15-alpine
    container_name: laundryos-postgres-shared
    environment:
      POSTGRES_DB: laundryos_multitenant
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_shared_data:/var/lib/postgresql/data
      - ./laundry-api/prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - laundryos-network
    restart: unless-stopped

  # Shared API Service
  api-shared:
    build:
      context: ./laundry-api
      dockerfile: Dockerfile
    container_name: laundryos-api-shared
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres-shared:5432/laundryos_multitenant
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres-shared
    networks:
      - laundryos-network
    restart: unless-stopped

  # Nginx Reverse Proxy for Subdomain Routing
  nginx-proxy:
    image: nginx:alpine
    container_name: laundryos-nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/multitenant.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api-shared
    networks:
      - laundryos-network
    restart: unless-stopped

volumes:
  postgres_shared_data:

networks:
  laundryos-network:
    driver: bridge
```

### Phase 2: Hybrid Architecture

```yaml
version: '3.8'

services:
  # Shared Database for Small Tenants (Free/Basic Plans)
  postgres-shared:
    image: postgres:15-alpine
    container_name: laundryos-postgres-shared
    environment:
      POSTGRES_DB: laundryos_shared
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_shared_data:/var/lib/postgresql/data
    networks:
      - laundryos-network

  # Dedicated Database for Large Tenants (Pro/Enterprise Plans)
  postgres-enterprise-1:
    image: postgres:15-alpine
    container_name: laundryos-postgres-enterprise-1
    environment:
      POSTGRES_DB: laundryos_enterprise_1
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_enterprise_1_data:/var/lib/postgresql/data
    networks:
      - laundryos-network

  # Shared API Instance
  api-shared:
    build:
      context: ./laundry-api
      dockerfile: Dockerfile
    container_name: laundryos-api-shared
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres-shared:5432/laundryos_shared
    depends_on:
      - postgres-shared
    networks:
      - laundryos-network

  # Dedicated API Instance for Enterprise Tenants
  api-enterprise-1:
    build:
      context: ./laundry-api
      dockerfile: Dockerfile.enterprise
    container_name: laundryos-api-enterprise-1
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres-enterprise-1:5432/laundryos_enterprise_1
      TENANT_MODE: dedicated
    depends_on:
      - postgres-enterprise-1
    networks:
      - laundryos-network

  # Load Balancer / Tenant Router
  tenant-router:
    build:
      context: ./tenant-router
      dockerfile: Dockerfile
    container_name: laundryos-tenant-router
    ports:
      - "80:80"
      - "443:443"
    environment:
      SHARED_API: api-shared:3000
      ENTERPRISE_APIS: api-enterprise-1:3000
    depends_on:
      - api-shared
      - api-enterprise-1
    networks:
      - laundryos-network

volumes:
  postgres_shared_data:
  postgres_enterprise_1_data:

networks:
  laundryos-network:
    driver: bridge
```

## Decision Matrix

| Factor | Schema-based | Separate Docker | Hybrid |
|--------|-------------|----------------|---------|
| **Initial Cost** | Low | High | Medium |
| **Maintenance** | Simple | Complex | Moderate |
| **Data Security** | Good | Excellent | Excellent |
| **Performance** | Shared | Isolated | Flexible |
| **Scalability** | Limited | Unlimited | Best |
| **Time to Market** | Fast | Slow | Moderate |

## Monetization Options

- **Free Plan**: 5 users, 100 orders/month
- **Basic Plan**: 15 users, 500 orders/month ($29/month)
- **Pro Plan**: 50 users, 2000 orders/month ($79/month)
- **Enterprise**: Unlimited ($199/month)

## Migration Path

```
Phase 1: Schema-based (0-50 tenants)
    ↓
Phase 2: Hybrid (50-500 tenants) 
    ↓
Phase 3: Kubernetes + Microservices (500+ tenants)
```

## Recommendations

### Start with Schema-based Multi-tenancy because:

1. **Cost-effective**: Railway free tier can handle multiple tenants
2. **Fast to market**: Validate business model quickly
3. **Simple deployment**: Current infrastructure works
4. **Easy maintenance**: Single codebase and deployment
5. **Proven approach**: Used by successful SaaS companies

### Implementation Timeline:

- **Week 1-2**: Schema-based multi-tenancy implementation
- **Week 3-4**: Production setup and subdomain routing
- **Future**: Enterprise features and dedicated instances

This approach allows for rapid deployment while maintaining a clear path to enterprise-grade multi-tenancy as the business scales.