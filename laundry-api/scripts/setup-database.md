# PostgreSQL Database Setup for LaundryOS

## Step 1: Install PostgreSQL

### Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the 'postgres' user
4. Make sure PostgreSQL service is running

### Alternative (Docker):
```bash
docker run --name laundry-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=laundry_os -p 5432:5432 -d postgres:15
```

## Step 2: Create Database

### Using pgAdmin (GUI):
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases" and select "Create" > "Database"
4. Name it "laundry_os"

### Using Command Line:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE laundry_os;

# Exit psql
\q
```

## Step 3: Update Environment Variables

Make sure your `.env` file has the correct database URL:
```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/laundry_os?schema=public"
```

Replace `your_password` with your actual PostgreSQL password.

## Step 4: Run Database Migrations

```bash
# Navigate to the API directory
cd laundry-api

# Run migrations to create tables
npx prisma migrate deploy

# Or if you want to create a new migration
npx prisma migrate dev --name init

# Generate Prisma client (if not done already)
npx prisma generate
```

## Step 5: Verify Setup

Start the API server:
```bash
npm run dev
```

You should see:
- ✅ Database connected successfully
- ✅ Database query test successful
- 💾 PostgreSQL storage active

## Step 6: (Optional) View Database

```bash
# Open Prisma Studio to view your data
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can view and edit your database records.

## Troubleshooting

### Connection Failed:
- Make sure PostgreSQL is running
- Check your username/password in .env
- Verify the database exists
- Check firewall settings

### Migration Errors:
- Ensure database exists before running migrations
- Check that you have proper permissions
- Try running `npx prisma generate` first

### Port Issues:
- Default PostgreSQL port is 5432
- Make sure nothing else is using this port
- Check if PostgreSQL service is actually running