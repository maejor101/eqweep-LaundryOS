# LaundryOS 🧺

A modern, comprehensive laundry and dry cleaning management system built with React, TypeScript, and PostgreSQL. LaundryOS provides complete business management features including role-based authentication, customer management, order processing workflow, and South African Rand (ZAR) payment integration.

## 🌟 Features

### 👥 Authentication & User Management
- **Role-based Access Control**: Admin and Cashier roles with different permissions
- **Secure Authentication**: JWT-based authentication with PostgreSQL user storage
- **User Registration/Login**: Secure authentication with form validation
- **Profile Management**: Users can update personal information
- **Admin Dashboard**: Complete user management for administrators

### 🛍️ Complete Order Processing Workflow
- **Service Categories**: Dry Cleaning, Laundry, Shoe Repairs, Alterations
- **Item Catalog**: Pre-configured items with ZAR pricing (R90-R290 range)
- **Express Service**: Option for priority processing with additional fees
- **Stain Tracking**: Document specific stains and damage (Mud, Coffee, Wine, etc.)
- **Full Workflow**: Orders progress through To-Do → Washers → Waiting → Dryers → Ready → Pickup
- **Status Management**: Real-time order status updates with database persistence

### 👨‍👩‍👧‍👦 Customer Management
- **PostgreSQL Database**: Persistent customer storage with full order history
- **Smart Search**: Find existing customers by name or phone number
- **Customer Profiles**: Store name, phone, email, and address
- **Order History**: Complete tracking of customer order history
- **Duplicate Prevention**: Automatic customer deduplication by phone number

### 💳 South African Payment System
- **Currency**: All pricing in South African Rand (ZAR)
- **Multiple Payment Methods**: Cash, Card, On Collection
- **Cash Payment Interface**: 
  - **Notes**: R10, R20, R50, R100, R200
  - **Coins**: R1, R2, R5
  - **Change Calculator**: Automatic change calculation
- **Payment Validation**: Ensure sufficient payment before order completion

### 🎨 Modern User Interface
- **Professional Design**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Clean Navigation**: Role-based navigation with LaundryOS branding
- **Real-time Updates**: Live order status updates and notifications
- **Optimized Cart**: Compact payment selection with expanded cart space

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: React 18.3.x with TypeScript and Vite 5.4.x
- **Backend**: Node.js with Express.js RESTful API
- **Database**: PostgreSQL 18 with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API with API integration
- **Forms**: React Hook Form with Zod validation

### Database Schema
```sql
-- Users table for authentication
Users (id, email, name, password, role, isActive, createdAt, lastLogin)

-- Customers table for customer management  
Customers (id, name, phone, email, address, totalOrders, createdAt, lastOrderDate)

-- Orders table for order tracking
Orders (id, orderNumber, customerId, userId, total, paymentMethod, status, createdAt, updatedAt)

-- Order items for detailed item tracking
OrderItems (id, orderId, name, price, quantity, notes)
```

### API Endpoints
```
Authentication:
POST /api/auth/login    - User login
POST /api/auth/register - User registration
GET  /api/auth/profile  - Get user profile

Customers:
GET    /api/customers        - List customers
POST   /api/customers        - Create customer
GET    /api/customers/:id    - Get customer details
PATCH  /api/customers/:id    - Update customer

Orders:
GET    /api/orders           - List orders
POST   /api/orders           - Create order
GET    /api/orders/:id       - Get order details
PATCH  /api/orders/:id/status - Update order status
PATCH  /api/orders/:id       - Update order details

Users (Admin only):
GET    /api/users            - List users
POST   /api/users            - Create user
PATCH  /api/users/:id        - Update user
DELETE /api/users/:id        - Delete user
```

### Project Structure
```
├── Frontend (React/TypeScript)
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── Header.tsx       # Navigation with LaundryOS branding
│   └── NavLink.tsx      # Custom navigation links
├── contexts/
│   └── AuthContext.tsx  # JWT authentication state management
├── hooks/
│   ├── use-mobile.tsx   # Mobile device detection
│   └── use-toast.ts     # Toast notification hook
├── lib/
│   ├── utils.ts         # Utility functions
│   ├── api.ts          # API client with authentication
│   ├── customerDatabase.ts # Customer data management
│   └── orderDatabase.ts    # Order data management
├── pages/               # Application screens
│   ├── Index.tsx        # Dashboard/landing page
│   ├── NewOrder.tsx     # Order creation interface
│   ├── Process.tsx      # Complete order workflow management
│   ├── Ready.tsx        # Ready orders view
│   ├── Pickups.tsx      # Order pickup management
│   └── NotFound.tsx     # 404 error page
├── App.tsx              # Main application component
└── main.tsx            # Application entry point

├── Backend API (Node.js/Express)
laundry-api/
├── src/
│   ├── server.ts        # Express server setup
│   ├── routes/          # API route handlers
│   │   ├── auth.ts      # Authentication routes
│   │   ├── users.ts     # User management
│   │   ├── customers.ts # Customer management
│   │   └── orders.ts    # Order management
│   └── middleware/
│       └── auth.ts      # JWT authentication middleware
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
└── package.json         # Backend dependencies
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 18 or higher  
- **npm**: Version 8 or higher
- **Docker**: Docker Desktop for containerized development (recommended)

### 🐳 Docker Setup (Recommended)

LaundryOS includes optimized Docker configuration for both development and QA environments with **51% faster build times** and **99.9% smaller build context**.

#### Quick Start with Docker

1. **Clone the repository**:
   ```bash
   git clone https://github.com/maejor101/eqweep-LaundryOS.git
   cd eqweep-LaundryOS
   ```

2. **Start optimized development environment**:
   ```bash
   # Fast build with cache (51% faster than previous setup)
   docker-compose -f docker-compose.dev.yml up --build -d
   ```

3. **Access your application**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3002  
   - **Database**: localhost:5433

#### Performance Features
- ⚡ **51% faster builds**: 413s → 204s build time
- 🔥 **99.9% smaller context**: 224MB → 184KB transfer  
- 🚀 **Cache optimization**: npm cache mounts for lightning rebuilds
- 🛡️ **Security**: Non-root containers with proper permissions
- 📦 **Multi-stage builds**: Optimized production images

#### Docker Management Scripts
```bash
# Fast optimized build
.\scripts\fast-build.ps1

# Start development environment  
.\scripts\start-dev.ps1

# Start QA environment
.\scripts\start-qa.ps1

# Stop all containers
.\scripts\stop-all.ps1
```

#### Environment Configuration
- **Development**: Port 3000 (frontend), 3002 (backend), 5433 (postgres)
- **QA**: Port 8081 (frontend), 3004 (backend), 5434 (postgres)

For detailed Docker optimization guide, see [`DOCKER-PERFORMANCE.md`](./DOCKER-PERFORMANCE.md)

---

### 💻 Local Development Setup

If you prefer local development without Docker:

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/maejor101/eqweep-LaundryOS.git
   cd eqweep-LaundryOS
   ```

2. **Setup PostgreSQL Database**:
   ```bash
   # Install PostgreSQL 18 and create database
   createdb laundry_os
   
   # Set up database user (optional)
   createuser -P postgres  # Use password: Admin
   ```

3. **Setup Backend API**:
   ```bash
   cd laundry-api
   npm install
   
   # Configure database connection
   cp .env.example .env
   # Edit .env with your PostgreSQL connection details:
   # DATABASE_URL="postgresql://postgres:Admin@localhost:5432/laundry_os"
   # JWT_SECRET="your-secret-key"
   
   # Run database migrations
   npx prisma migrate deploy
   npx prisma generate
   
   # Start backend server
   npm start
   ```

4. **Setup Frontend**:
   ```bash
   cd ..  # Back to root directory
   npm install
   
   # Start frontend development server
   npm run dev
   ```

5. **Access the application**:
   - Frontend: `http://localhost:8083` (or available port)
   - Backend API: `http://localhost:3001`

---

## 🐳 Docker Environments

### Development Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3002
- **Database**: localhost:5433
- **Features**: Hot reload, development tools, volume mounting

### QA Environment  
- **Frontend**: http://localhost:8081
- **Backend**: http://localhost:3004
- **Database**: localhost:5434
- **Features**: Production builds, optimized for testing

### Docker Commands
```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build -d

# Build and start QA environment
docker-compose -f docker-compose.qa.yml up --build -d

# View running containers
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Environment Configuration

#### Docker Environment Files
The project includes optimized Docker configurations:
- `docker-compose.dev.yml` - Development with hot reload
- `docker-compose.qa.yml` - QA environment with production builds  
- `Dockerfile.frontend` - Optimized React build with cache mounts
- `laundry-api/Dockerfile` - Optimized Node.js API with security features

#### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:Admin@localhost:5432/laundry_os"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=3001
NODE_ENV=development
```

#### Frontend (Environment Variables)
```env
VITE_API_URL="http://localhost:3001/api"
```

### Available Scripts

#### Docker Scripts (PowerShell)
```bash
.\scripts\fast-build.ps1    # Optimized build with timing
.\scripts\start-dev.ps1     # Start development environment  
.\scripts\start-qa.ps1      # Start QA environment
.\scripts\stop-all.ps1      # Stop all Docker containers
.\scripts\reset-dev-db.ps1  # Reset development database
.\scripts\test-docker.ps1   # Test Docker setup
```

#### Frontend Scripts
```bash
npm run dev      # Development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint for code quality
```

#### Backend Scripts
```bash
npm start        # Start production server
npm run dev      # Development server with auto-reload
npm run build    # Build TypeScript to JavaScript
```

## 📱 Usage Guide

### Initial Setup
1. **Database Setup**: Ensure PostgreSQL is running with the laundry_os database
2. **First User**: Register the first user (automatically becomes admin)
3. **Staff Management**: Admins can manage users through the system

### Daily Operations

#### Order Processing Workflow
1. **Create Order** (New Order Page):
   - Search for existing customer or add new customer
   - Select service items with South African Rand pricing
   - Choose payment method (Cash/Card/On Collection)
   - Submit order (automatically starts in "To-Do" status)

2. **Process Orders** (Process Page):
   - **To-Do**: Newly created orders
   - **Washers**: Orders being washed
   - **Waiting**: Orders waiting for next step
   - **Dryers**: Orders being dried
   - **Ready**: Orders ready for pickup
   - **Pickup**: Completed orders

3. **Order Management**:
   - Move orders between stages with status update buttons
   - Real-time order tracking with automatic refresh
   - Database persistence ensures no data loss

#### Customer Management Workflow
1. **Search Customer**: Type name or phone number in search
2. **View History**: See complete customer order history from database
3. **Add New Customer**: Create new profile with automatic database storage
4. **Order Linking**: Orders automatically linked to customer profiles

#### Payment Processing (ZAR Currency)
1. **Payment Selection**: Opens modal with payment method options
2. **Cash Payments**: 
   - Use South African note and coin selector
   - Automatic change calculation in Rand
   - R10, R20, R50, R100, R200 notes + R1, R2, R5 coins
3. **Card/Collection**: Simple selection for non-cash payments

## 🔧 Configuration

### Docker Configuration  
```bash
# Development Environment
Frontend: http://localhost:3000
Backend: http://localhost:3002  
Database: postgresql://postgres:DevPassword123@localhost:5433/laundry_os_dev

# QA Environment
Frontend: http://localhost:8081
Backend: http://localhost:3004
Database: postgresql://postgres:QAPassword123@localhost:5434/laundry_os_qa
```

### Local Database Configuration
```bash
# PostgreSQL Connection
Database: laundry_os
User: postgres
Password: Admin
Port: 5432
Host: localhost

# Environment Variables (.env in laundry-api/)
DATABASE_URL="postgresql://postgres:Admin@localhost:5432/laundry_os"
JWT_SECRET="your-secure-secret-key"
PORT=3001
```

### Customization Options

#### Service Items & Pricing
Edit `src/pages/NewOrder.tsx` to modify:
```typescript
const ITEMS_DATA = {
  "Dry Cleaning": [
    { id: "blazer", name: "Blazer", price: 250.0 },
    { id: "dress", name: "Dress", price: 290.0 },
    // Add more items...
  ]
};
```

#### Order Status Workflow
Modify order statuses in:
- Frontend: `src/pages/Process.tsx` (status columns)
- Backend: `laundry-api/prisma/schema.prisma` (OrderStatus enum)

#### Payment Methods
Configure in `src/pages/NewOrder.tsx`:
```typescript
const PAYMENT_OPTIONS = [
  { id: 'cash', name: 'Cash Payment', description: 'Pay with South African Rand' },
  { id: 'card', name: 'Card Payment', description: 'Credit/Debit card' },
  { id: 'on_collection', name: 'Pay on Collection', description: 'Pay when collecting' }
];
```

### Database Management
```bash
# Reset database (development)
cd laundry-api
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate

# View database with Prisma Studio
npx prisma studio
```

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with refresh capability
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access**: Admin/Cashier permissions enforced at API level
- **Input Validation**: Zod schema validation on all endpoints

### Data Security
- **PostgreSQL**: Secure relational database with ACID compliance
- **API Authentication**: All endpoints protected with JWT middleware
- **XSS Prevention**: React's built-in XSS protection
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow TypeScript and React best practices
2. **Database Changes**: Use Prisma migrations for schema updates
3. **API Development**: Maintain RESTful API conventions
4. **Authentication**: Ensure all new endpoints use JWT middleware

### Adding Features
1. **Database Schema**: Update `prisma/schema.prisma` and run migrations
2. **API Endpoints**: Add routes in `laundry-api/src/routes/`
3. **Frontend Integration**: Update API client in `src/lib/api.ts`
4. **UI Components**: Create in `src/components/` or `src/pages/`

### Database Development
```bash
# Create new migration
npx prisma migrate dev --name feature_name

# Reset development database
npx prisma migrate reset

# View database
npx prisma studio
```

## 📋 Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18, React Router DOM, React Hook Form
- **UI Framework**: shadcn/ui components, Radix UI primitives
- **Styling**: Tailwind CSS with class variance authority
- **Validation**: Zod for schema validation
- **Icons**: Lucide React for consistent iconography
- **Notifications**: Sonner for toast messages

### Backend Dependencies
- **Server**: Express.js with TypeScript support
- **Database**: Prisma ORM with PostgreSQL adapter
- **Authentication**: jsonwebtoken, bcryptjs for password hashing
- **Validation**: Zod for API request validation
- **CORS**: Cross-origin resource sharing support

### Development Dependencies
- **Build Tools**: Vite (Frontend), tsc (Backend)
- **Type Definitions**: @types packages for Node, React, Express
- **Code Quality**: ESLint with TypeScript rules
- **Database Tools**: Prisma CLI for migrations and management

## 🔄 System Requirements

### Production Environment
- **Node.js**: 18+ (LTS recommended)
- **PostgreSQL**: 18+ with connection pooling
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 10GB minimum for database and application
- **Network**: HTTPS recommended for production

### Development Environment
- **Node.js**: 18+ with npm 8+
- **PostgreSQL**: Local installation or Docker container
- **Docker**: Docker Desktop (recommended for optimized development)
- **IDE**: VS Code with recommended extensions:
  - TypeScript and JavaScript Language Features
  - Prisma Extension
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

## 📈 Features Roadmap

### Completed ✅
- Complete PostgreSQL integration with Prisma ORM
- JWT authentication with role-based access control
- Full order processing workflow (To-Do → Pickup)
- South African Rand currency integration
- Real-time order status updates
- Customer management with order history
- Responsive UI with LaundryOS branding

### In Development 🚧
- Advanced reporting and analytics
- Inventory management system
- SMS/Email notifications for order updates
- Multi-location support

### Planned 📋
- Mobile app for customers
- Integration with payment gateways
- Advanced pricing rules and discounts
- Automated backup and restore

## 📄 License

This project is open source. See the LICENSE file in the repository for details.

## 🆘 Support & Documentation

For issues, feature requests, or questions:
1. **GitHub Issues**: Create an issue in the repository
2. **Database Issues**: Check PostgreSQL connection and Prisma configuration
3. **API Documentation**: Refer to endpoint documentation in code comments
4. **Setup Help**: Follow the detailed installation guide above

### Common Troubleshooting
- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Port Conflicts**: Backend uses 3001, frontend uses 8083 (or next available)
- **Authentication Issues**: Clear browser storage and re-login
- **Migration Errors**: Reset database with `npx prisma migrate reset`

---

**LaundryOS** - Complete laundry and dry cleaning business management with modern technology and South African localization. 🚀