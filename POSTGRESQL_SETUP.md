# LaundryOS PostgreSQL Integration Setup

This guide walks you through setting up the PostgreSQL database integration for LaundryOS.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Git

## Setup Instructions

### 1. Database Setup

#### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL:**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt install postgresql postgresql-contrib`

2. **Create Database:**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres

   -- Create database and user
   CREATE DATABASE laundry_db;
   CREATE USER laundry_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE laundry_db TO laundry_user;
   ALTER DATABASE laundry_db OWNER TO laundry_user;
   ```

#### Option B: Docker PostgreSQL

```bash
docker run --name laundry-postgres \
  -e POSTGRES_DB=laundry_db \
  -e POSTGRES_USER=laundry_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Backend API Setup

1. **Navigate to API directory:**
   ```bash
   cd laundry-api
   ```

2. **Configure Environment:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your database credentials
   DATABASE_URL="postgresql://laundry_user:your_secure_password@localhost:5432/laundry_db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Database Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

6. **Start the API Server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

### 3. Frontend Setup

1. **Navigate back to main directory:**
   ```bash
   cd ..
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Frontend:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## Database Schema

The system uses the following main entities:

- **Users**: Authentication and role management (admin/cashier)
- **Customers**: Customer information and contact details
- **Orders**: Laundry orders with status tracking
- **OrderItems**: Individual items within orders

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Development Features

- **Fallback Mode**: The frontend automatically falls back to localStorage if the API is unavailable
- **Mock Authentication**: Development mode includes mock users for testing
- **Type Safety**: Full TypeScript integration between frontend and backend
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Production Deployment

1. **Environment Variables:**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   DATABASE_URL="your-production-database-url"
   JWT_SECRET="your-production-jwt-secret"
   CORS_ORIGIN="https://your-domain.com"
   ```

2. **Build the Application:**
   ```bash
   npm run build
   cd laundry-api && npm run build
   ```

3. **Start Production Server:**
   ```bash
   cd laundry-api && npm start
   ```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check database credentials in `.env`
- Ensure database exists and user has proper permissions

### API Connection Issues
- Verify API server is running on port 3001
- Check CORS configuration for frontend domain
- Review server logs for specific error messages

### Frontend Issues
- Clear browser localStorage if switching between modes
- Check browser console for API connection errors
- Verify API endpoint URLs match your server configuration

## Migration from localStorage

The system automatically handles migration from localStorage to the database:

1. **Existing Users**: Will continue to work with localStorage until they log out
2. **New Users**: Must be created through the registration system
3. **Data Migration**: Use the admin interface to export/import existing data

For questions or issues, refer to the project documentation or open an issue on GitHub.