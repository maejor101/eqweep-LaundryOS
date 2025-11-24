# LaundryOS

A modern, comprehensive laundry and dry cleaning management system built with React, TypeScript, and PostgreSQL. LaundryOS provides complete business management features including role-based authentication, customer management, order processing workflow, and South African Rand (ZAR) payment integration.

**Live Application**: https://laundryos-app.netlify.app
**API Backend**: https://eqweep-laundryos-production.up.railway.app
**Database**: PostgreSQL on Railway Cloud

## Features

### Authentication & User Management
- **Role-based Access Control**: Admin and Cashier roles with different permissions
- **Secure Authentication**: JWT-based authentication with PostgreSQL user storage
- **User Registration/Login**: Secure authentication with form validation
- **Profile Management**: Users can update personal information
- **Admin Dashboard**: Complete user management for administrators

### Complete Order Processing Workflow
- **Service Categories**: Dry Cleaning, Laundry, Shoe Repairs, Alterations
- **Item Catalog**: Pre-configured items with ZAR pricing (R90-R290 range)
- **Express Service**: Option for priority processing with additional fees
- **Stain Tracking**: Document specific stains and damage (Mud, Coffee, Wine, etc.)
- **Full Workflow**: Orders progress through To-Do → Washers → Waiting → Dryers → Ready → Pickup
- **Status Management**: Real-time order status updates with database persistence

### Customer Management
- **PostgreSQL Database**: Persistent customer storage with full order history
- **Smart Search**: Find existing customers by name or phone number
- **Customer Profiles**: Store name, phone, email, and address
- **Order History**: Complete tracking of customer order history
- **Duplicate Prevention**: Automatic customer deduplication by phone number

### South African Payment System
- **Currency**: All pricing in South African Rand (ZAR)
- **Multiple Payment Methods**: Cash, Card, On Collection
- **Cash Payment Interface**: 
  - **Notes**: R10, R20, R50, R100, R200
  - **Coins**: R1, R2, R5
  - **Change Calculator**: Automatic change calculation
- **Payment Validation**: Ensure sufficient payment before order completion

### Modern User Interface
- **Professional Design**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Clean Navigation**: Role-based navigation with LaundryOS branding
- **Real-time Updates**: Live order status updates and notifications
- **Optimized Cart**: Compact payment selection with expanded cart space

## System Architecture

### Tech Stack
- **Frontend**: React 18.3.x with TypeScript and Vite 5.4.x (Deployed on Netlify)
- **Backend**: Node.js with Express.js RESTful API (Deployed on Railway)
- **Database**: PostgreSQL on Railway Cloud with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API with API integration
- **Forms**: React Hook Form with Zod validation
- **API Proxy**: Netlify Functions for CORS handling

### Cloud Infrastructure
- **Frontend Hosting**: Netlify with global CDN
- **Backend Hosting**: Railway Cloud (Asia-Southeast)
- **Database Hosting**: Railway PostgreSQL (Asia-Southeast)
- **API Proxy**: Netlify Functions for secure backend communication
- **Cost**: $0/month (Free tier deployment)

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
Base URL: https://eqweep-laundryos-production.up.railway.app/api

Authentication:
POST /auth/login    - User login
POST /auth/register - User registration
GET  /auth/profile  - Get user profile

Customers:
GET    /customers        - List customers
POST   /customers        - Create customer
GET    /customers/:id    - Get customer details
PATCH  /customers/:id    - Update customer

Orders:
GET    /orders           - List orders
POST   /orders           - Create order
GET    /orders/:id       - Get order details
PATCH  /orders/:id/status - Update order status
PATCH  /orders/:id       - Update order details

Users (Admin only):
GET    /users            - List users
POST   /users            - Create user
PATCH  /users/:id        - Update user
DELETE /users/:id        - Delete user

Health Check:
GET    /health           - API health status and database connectivity
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

## Getting Started

### Live Application

**LaundryOS is deployed and ready to use:**

1. **Access the Application**: https://laundryos-app.netlify.app
2. **Create Account**: Register as Administrator or Cashier
3. **Start Managing**: Begin creating orders and managing customers

**Demo Login Credentials:**
- **Email**: elpredente155@gmail.com
- **Password**: test123456
- **Role**: Administrator

### Development Setup

If you want to run LaundryOS locally for development:

#### Prerequisites for Development
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For cloning the repository

#### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/maejor101/eqweep-LaundryOS.git
   cd eqweep-LaundryOS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   ```bash
   # The app is pre-configured to work with the live backend
   # Frontend will connect to: https://eqweep-laundryos-production.up.railway.app/api
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access locally**:
   - Frontend: `http://localhost:5173`
   - Backend: Uses live Railway API
   - Database: Uses live Railway PostgreSQL

### Deployment Information

**Current Deployment:**
- **Frontend**: Netlify (Global CDN) - https://laundryos-app.netlify.app
- **Backend**: Railway Cloud (Asia-Southeast) - https://eqweep-laundryos-production.up.railway.app
- **Database**: Railway PostgreSQL (Private network)
- **SSL**: Automatic HTTPS on both platforms
- **Uptime**: 99.9% availability
- **Performance**: Global edge caching (Netlify) + Railway hosting

**Deployment Features:**
- **Auto-deployment**: Pushes to main branch trigger deployments
- **Environment separation**: Production environment with optimized builds
- **CORS handling**: Netlify Functions proxy for secure API communication
- **SSL/HTTPS**: Automatic SSL certificates
- **Custom domain ready**: Can be configured for custom domains

## Usage Guide

### Accessing LaundryOS

1. **Visit**: https://laundryos-app.netlify.app
2. **Register**: Create your administrator or cashier account
3. **Login**: Access the full system functionality

### Initial Setup
1. **First User Registration**: The first user becomes an administrator automatically
2. **Staff Management**: Administrators can create cashier accounts
3. **Start Operations**: Begin creating customers and processing orders

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

## Configuration

### Live System Configuration
```bash
# Production Environment (Current Deployment)
Frontend: https://laundryos-app.netlify.app
Backend: https://eqweep-laundryos-production.up.railway.app
Database: Railway PostgreSQL (Private network)

# API Proxy
Frontend API calls → Netlify Functions → Railway Backend
```

### Development Configuration
```bash
# Local Development (connects to live backend)
Frontend: http://localhost:5173
Backend: https://eqweep-laundryos-production.up.railway.app (Live)
Database: Railway PostgreSQL (Live)

# Environment Variables (.env.production)
VITE_API_URL="/.netlify/functions/api"
VITE_APP_TITLE="LaundryOS"
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

**Note**: LaundryOS uses a live production database on Railway. Database management is handled automatically.

For development database access:
```bash
# View database with Railway dashboard
# Visit: https://railway.app → Login → View eqweep-laundryos-production

# API Health Check
curl https://eqweep-laundryos-production.up.railway.app/api/health
```

## Security Features

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

## Contributing

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

## Dependencies

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

## System Requirements

### Using the Live Application
- **Web Browser**: Modern browser with JavaScript enabled
- **Internet Connection**: Stable connection for API communication
- **Device**: Desktop, tablet, or mobile (responsive design)
- **Account**: Register at https://laundryos-app.netlify.app

### Development Environment
- **Node.js**: 18+ with npm 8+
- **Git**: For repository cloning
- **IDE**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

## Features Roadmap

### Completed
- **Live Production Deployment**: Netlify + Railway cloud hosting
- **Complete PostgreSQL Integration**: Prisma ORM with Railway database
- **JWT Authentication**: Role-based access control (Admin/Cashier)
- **Full Order Processing Workflow**: To-Do → Pickup with real-time updates
- **South African Rand Integration**: ZAR currency with cash calculator
- **Customer Management**: Persistent database storage with order history
- **Responsive UI**: LaundryOS branding with mobile-friendly design
- **CORS-Free API**: Netlify Functions proxy for seamless communication
- **Auto-deployment**: Git push triggers automatic deployments
- **Global CDN**: Netlify edge caching for worldwide performance

### In Development
- Advanced reporting and analytics
- Inventory management system
- SMS/Email notifications for order updates
- Multi-location support

### Planned
- Mobile app for customers
- Integration with payment gateways
- Advanced pricing rules and discounts
- Automated backup and restore

## License

This project is open source. See the LICENSE file in the repository for details.

## Support & Documentation

For issues, feature requests, or questions:
1. **GitHub Issues**: Create an issue in the repository
2. **Database Issues**: Check PostgreSQL connection and Prisma configuration
3. **API Documentation**: Refer to endpoint documentation in code comments
4. **Setup Help**: Follow the detailed installation guide above

### Common Troubleshooting
- **Login Issues**: Clear browser storage and re-login at https://laundryos-app.netlify.app/login
- **Order Not Appearing**: Use the Debug panel in Process page to check order status
- **Slow Loading**: Check internet connection - app uses live APIs
- **API Errors**: Check https://eqweep-laundryos-production.up.railway.app/api/health for backend status

### Contact & Support
- **GitHub Issues**: https://github.com/maejor101/eqweep-LaundryOS/issues
- **Live Application**: https://laundryos-app.netlify.app
- **API Status**: https://eqweep-laundryos-production.up.railway.app/api/health

---

**LaundryOS** - Complete laundry and dry cleaning business management with modern cloud technology and South African localization.

**Ready to use at**: https://laundryos-app.netlify.app