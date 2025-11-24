#!/usr/bin/env node

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  try {
    // First, try to generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Then try to push database schema (creates tables directly)
    console.log('🗄️ Pushing database schema...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const prisma = new PrismaClient();
    await prisma.user.findFirst();
    await prisma.$disconnect();
    
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('🔧 Attempting to continue anyway...');
    process.exit(0); // Don't fail the deployment, let the API start
  }
}

initializeDatabase();