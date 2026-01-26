#!/usr/bin/env node
/**
 * Sync REACT_APP_* environment variables to frontend/.env
 * 
 * Works in both local development (reads from backend/.env) and CI/Vercel (reads from process.env)
 * The frontend/.env file is auto-generated and should not be manually edited.
 */

const fs = require('fs');
const path = require('path');

// Get the directory where this script is located
// In CommonJS (.cjs), __dirname is always available
const scriptDir = __dirname;
const frontendEnvPath = path.join(scriptDir, '.env');

// Try to find backend/.env (for local development)
// Try relative to script location first, then from cwd
let backendEnvPath = path.join(scriptDir, '../backend/.env');
if (!fs.existsSync(backendEnvPath)) {
  // Maybe running from root directory
  backendEnvPath = path.join(process.cwd(), 'backend', '.env');
}

const header =
  '# Auto-generated - DO NOT EDIT MANUALLY\n' +
  '# This file is automatically synced from backend/.env (local) or CI environment variables\n' +
  '# All environment variables should be defined in backend/.env (local) or platform env vars (CI)\n\n';

try {
  let reactVars = [];

  // Priority 1: Try to read from backend/.env (local development)
  if (fs.existsSync(backendEnvPath)) {
    const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
    const lines = backendEnvContent.split('\n');

    // Filter only REACT_APP_* variables
    reactVars = lines
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#') && trimmed.startsWith('REACT_APP_');
      })
      .map(line => line.trim());
    
    console.log(`✓ Reading from backend/.env`);
  } else {
    // Priority 2: Read from process.env (CI/Vercel)
    const envKeys = Object.keys(process.env || {}).filter(k => k.startsWith('REACT_APP_'));
    reactVars = envKeys
      .sort()
      .map(k => `${k}=${process.env[k]}`);
    
    console.log(`✓ Reading from process.env (CI/Vercel mode)`);
  }

  // Required Firebase variables
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];

  // Check if all required variables are present
  const presentVarNames = reactVars.map(line => {
    const match = line.match(/^REACT_APP_[^=]+/);
    return match ? match[0] : null;
  }).filter(Boolean);
  
  const missingVars = requiredVars.filter(v => !presentVarNames.includes(v));

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\n⚠️  Frontend build will FAIL without these variables.');
    console.error('💡 Make sure these are set in Vercel Environment Variables (for production) or backend/.env (for local)');
    process.exit(1);
  }

  if (reactVars.length > 0) {
    const frontendEnvContent = header + reactVars.join('\n') + '\n';
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log(`✓ Synced ${reactVars.length} REACT_APP_* variables to frontend/.env`);
  } else {
    console.error('❌ No REACT_APP_* variables found');
    console.error('💡 Make sure REACT_APP_* variables are set in Vercel Environment Variables or backend/.env');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error syncing environment variables:', error.message);
  console.error(error.stack);
  process.exit(1);
}
