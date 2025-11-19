# LaundryOS 🧺

A modern, comprehensive laundry and dry cleaning management system built with React and TypeScript. LaundryOS provides complete business management features including role-based authentication, customer management, order processing, and South African payment integration.

## 🌟 Features

### 👥 Authentication & User Management
- **Role-based Access Control**: Admin and Cashier roles with different permissions
- **User Registration/Login**: Secure authentication with form validation
- **Profile Management**: Users can update personal information
- **Admin Dashboard**: Complete user management for administrators

### 🛍️ Order Management
- **Service Categories**: Dry Cleaning, Laundry, Shoe Repairs, Alterations
- **Item Catalog**: Pre-configured items with pricing (Dresses, Blazers, Shirts, etc.)
- **Express Service**: Option for priority processing
- **Stain Tracking**: Document specific stains and damage (Mud, Coffee, Wine, etc.)
- **Order Status**: Track orders through To-Do, Process, Ready, Pickups phases

### 👨‍👩‍👧‍👦 Customer Management
- **Customer Database**: Persistent customer storage with order history
- **Smart Search**: Find existing customers by name or phone number
- **Customer Profiles**: Store name, phone, email, and address (optional)
- **Order History**: Track total orders and last order date per customer
- **Duplicate Prevention**: Automatic customer deduplication by phone number

### 💳 Payment System (South African Currency)
- **Multiple Payment Methods**: Cash, Card, On Collection
- **Cash Payment Interface**: 
  - **Notes**: R10, R20, R50, R100, R200
  - **Coins**: R1, R2, R5
  - **Change Calculator**: Automatic change calculation
- **Payment Validation**: Ensure sufficient payment before order completion

### 🎨 User Interface
- **Modern Design**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Layout**: Works on desktop and mobile devices
- **Dark/Light Theme**: Automatic theme support
- **Professional Icons**: Lucide React icon library
- **Toast Notifications**: Real-time feedback with Sonner

## 🏗️ Architecture

### Tech Stack
- **Frontend Framework**: React 18.3.x with TypeScript
- **Build Tool**: Vite 5.4.x for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: React Router DOM v6 for navigation
- **State Management**: React Context API for authentication
- **Forms**: React Hook Form with Zod validation
- **Data Storage**: Browser localStorage (client-side persistence)
- **Icons**: Lucide React for consistent iconography

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── Header.tsx       # Navigation header with role-based menus
│   ├── NavLink.tsx      # Custom navigation links
│   ├── ProtectedRoute.tsx # Route protection wrapper
│   └── RoleGuard.tsx    # Role-based access control components
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── hooks/
│   ├── use-mobile.tsx   # Mobile device detection
│   └── use-toast.ts     # Toast notification hook
├── lib/
│   ├── utils.ts         # Utility functions and classname helpers
│   └── customerDatabase.ts # Customer data management
├── pages/               # Application screens
│   ├── Login.tsx        # User authentication
│   ├── Register.tsx     # User registration
│   ├── Profile.tsx      # User profile management
│   ├── AdminSettings.tsx # Admin user management
│   ├── NewOrder.tsx     # Order creation interface
│   ├── Process.tsx      # Order processing view
│   ├── Ready.tsx        # Ready orders view
│   ├── Pickups.tsx      # Order pickup management
│   └── NotFound.tsx     # 404 error page
├── App.tsx              # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles and CSS variables
```

### Core Components

#### Authentication System (`AuthContext.tsx`)
- **User Interface**: Defines user structure with roles and metadata
- **Authentication Functions**: Login, register, logout, profile updates
- **Role Checking**: Admin/cashier permission validation
- **Persistent Sessions**: localStorage-based session management

#### Customer Management (`customerDatabase.ts`)
- **Customer Class**: Complete customer data model
- **Search Functionality**: Name and phone number search
- **Order Tracking**: Statistics and history per customer
- **Data Persistence**: Browser localStorage integration

#### Order Processing (`NewOrder.tsx`)
- **Service Selection**: Category-based item selection
- **Customer Integration**: Search existing or add new customers
- **Payment Processing**: Multi-method payment with cash handling
- **Validation**: Complete order validation before submission

### Data Models

#### User Interface
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}
```

#### Customer Interface
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: Date;
  totalOrders: number;
  lastOrderDate?: Date;
}
```

#### Order Interface
```typescript
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/maejor101/eqweep-LaundryOS.git
   cd eqweep-LaundryOS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run ESLint for code quality
npm run lint
```

## 📱 Usage Guide

### Initial Setup
1. **First Run**: Navigate to the registration page
2. **Create Admin**: Register the first user as an admin
3. **Add Staff**: Admins can add cashier accounts through Admin Settings

### Daily Operations

#### For Cashiers
1. **Login**: Use cashier credentials to access the system
2. **Create Orders**: 
   - Search for existing customers or add new ones
   - Select service items and quantities
   - Choose payment method
   - Process payment (especially cash with change calculation)
3. **Manage Orders**: Track orders through different stages

#### For Administrators
- **All Cashier Features**: Full access to order management
- **User Management**: Add, edit, and deactivate staff accounts
- **System Administration**: Access to all system features

### Customer Management Workflow
1. **Search Customer**: Type name or phone number in search
2. **Select Existing**: Choose from search results with order history
3. **Add New Customer**: Create new profile if customer not found
4. **Order Processing**: Customer automatically linked to order

### Payment Processing
1. **Select Payment Method**: Cash, Card, or On Collection
2. **Cash Payments**: 
   - Use note and coin selector interface
   - System calculates change automatically
   - Validate sufficient payment before completion
3. **Card/On Collection**: Simple selection without cash handling

## 🔧 Configuration

### Environment Setup
The application uses localStorage for data persistence. No external database configuration required for development.

### Customization Options

#### Service Categories & Items
Edit `src/pages/NewOrder.tsx` to modify:
- Service categories (Dry Cleaning, Laundry, etc.)
- Item catalog and pricing
- Available stains and damage types

#### Payment Methods
Modify payment options in `src/pages/NewOrder.tsx`:
- South African currency denominations
- Payment method types
- Currency formatting

#### User Roles
Extend role system in `src/contexts/AuthContext.tsx`:
- Add new user roles
- Modify permission structures
- Update role-based access controls

## 🛡️ Security Features

### Authentication
- **Password Validation**: Minimum 6 characters required
- **Role-based Access**: Different permissions for admin/cashier
- **Session Management**: Secure session handling with localStorage

### Data Protection
- **Client-side Storage**: All data stored locally for privacy
- **Input Validation**: Zod schema validation on all forms
- **XSS Prevention**: React's built-in XSS protection

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow existing TypeScript and React patterns
2. **Component Structure**: Use functional components with hooks
3. **Styling**: Utilize Tailwind CSS and shadcn/ui components
4. **Type Safety**: Maintain strict TypeScript typing

### Adding Features
1. **New Pages**: Add to `src/pages/` and update routing in `App.tsx`
2. **New Components**: Create in `src/components/` with proper exports
3. **State Management**: Use React Context for global state
4. **Forms**: Implement with React Hook Form and Zod validation

## 📋 Dependencies

### Production Dependencies
- **React Ecosystem**: React 18, React Router DOM, React Hook Form
- **UI Framework**: shadcn/ui components, Radix UI primitives
- **Styling**: Tailwind CSS with class variance authority
- **Validation**: Zod for schema validation
- **Icons**: Lucide React for consistent iconography
- **Notifications**: Sonner for toast messages

### Development Dependencies
- **Build Tools**: Vite, TypeScript, ESLint
- **Type Definitions**: @types packages for Node, React
- **Code Quality**: ESLint with React and TypeScript rules

## 📄 License

This project is open source. See the repository for license details.

## 🆘 Support

For issues, feature requests, or questions:
1. **GitHub Issues**: Create an issue in the repository
2. **Documentation**: Refer to this README and code comments
3. **Community**: Check existing issues and discussions

---

**LaundryOS** - Streamlining laundry and dry cleaning operations with modern technology. 🚀