# PostgreSQL Setup for LaundryOS

## After PostgreSQL Installation

Once PostgreSQL is installed on your device, follow these steps:

### Step 1: Create Database
```bash
# Open PostgreSQL command line (psql)
# Default user is usually 'postgres'
psql -U postgres

# Create the database
CREATE DATABASE laundry_os;

# Create shadow database for migrations (optional)
CREATE DATABASE laundry_os_shadow;

# Exit psql
\q
```

### Step 2: Update Database Credentials
If your PostgreSQL setup uses different credentials, update the `.env` file:

```
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/laundry_os?schema=public"
```

Current configuration assumes:
- Username: `postgres`
- Password: `password`
- Host: `localhost`
- Port: `5432`
- Database: `laundry_os`

### Step 3: Run Database Migration
```bash
cd laundry-api
npx prisma migrate dev --name init
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Test Database Connection
```bash
npm run dev
```

The server should start and connect to PostgreSQL successfully.

### Step 6: View Database (Optional)
```bash
npx prisma studio
```

This opens a web interface to view and manage your database data.

## Common PostgreSQL Installation Notes

### Windows:
- Default port: 5432
- Default username: postgres
- You'll set a password during installation
- Remember the password for the DATABASE_URL

### macOS:
```bash
# If using Homebrew
brew install postgresql
brew services start postgresql

# Create user and database
createdb laundry_os
```

### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```

## Troubleshooting

1. **Connection refused**: Make sure PostgreSQL service is running
2. **Authentication failed**: Check username/password in DATABASE_URL
3. **Database does not exist**: Run the CREATE DATABASE command
4. **Port in use**: PostgreSQL usually runs on port 5432

## Current Status

✅ Prisma schema defined
✅ Environment variables configured  
✅ API routes ready to activate
✅ Database migration files prepared
⏳ Waiting for PostgreSQL installation to complete