#!/usr/bin/env node

/**
 * Quick setup verification script
 * Run this before starting the servers to check if everything is ready
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking FeedVex Setup...\n');

let allGood = true;

// Check 1: .env file exists
console.log('1. Checking .env file...');
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file found');
} else {
  console.log('   ❌ .env file missing - copy from .env.example');
  allGood = false;
}

// Check 2: frontend/.env exists
console.log('\n2. Checking frontend/.env file...');
if (fs.existsSync('frontend/.env')) {
  console.log('   ✅ frontend/.env file found');
} else {
  console.log('   ❌ frontend/.env file missing');
  allGood = false;
}

// Check 3: node_modules exists
console.log('\n3. Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ Dependencies installed');
} else {
  console.log('   ❌ Dependencies not installed - run: npm install --legacy-peer-deps');
  allGood = false;
}

// Check 4: Backend build exists
console.log('\n4. Checking backend build...');
if (fs.existsSync('backend/dist')) {
  console.log('   ✅ Backend built');
} else {
  console.log('   ⚠️  Backend not built - will build on first run');
}

// Check 5: Frontend build (optional for dev)
console.log('\n5. Checking frontend build...');
if (fs.existsSync('frontend/dist')) {
  console.log('   ✅ Frontend built');
} else {
  console.log('   ⚠️  Frontend not built - will build on first run');
}

// Check 6: Port availability (basic check)
console.log('\n6. Checking configuration...');
const envContent = fs.readFileSync('.env', 'utf8');
const portMatch = envContent.match(/PORT=(\d+)/);
const port = portMatch ? portMatch[1] : '3000';
console.log(`   ℹ️  Backend will run on port ${port}`);
console.log('   ℹ️  Frontend will run on port 5173');

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Setup looks good! You\'re ready to start.\n');
  console.log('📖 Read START_HERE.md for instructions\n');
  console.log('🚀 Quick start:');
  console.log('   Terminal 1: npm run dev:backend');
  console.log('   Terminal 2: npm run dev:frontend');
  console.log('   Browser: http://localhost:5173\n');
} else {
  console.log('❌ Setup incomplete. Please fix the issues above.\n');
  process.exit(1);
}
