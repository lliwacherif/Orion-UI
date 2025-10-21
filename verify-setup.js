#!/usr/bin/env node

/**
 * Setup Verification Script
 * 
 * Run this script to verify that your AURA UI project is properly configured.
 * 
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/api/orcha.ts',
  'src/components/Login.tsx',
  'src/components/ChatWindow.tsx',
  'src/components/MessageInput.tsx',
  'src/components/MessageList.tsx',
  'src/components/MessageBubble.tsx',
  'src/components/RoutingMessage.tsx',
  'src/components/AttachmentChip.tsx',
  'src/context/SessionContext.tsx',
  'src/types/orcha.d.ts',
];

const OPTIONAL_FILES = [
  '.env',
  'README.md',
  'QUICKSTART.md',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
];

console.log('🔍 AURA UI - Setup Verification\n');
console.log('=' .repeat(50));

let hasErrors = false;
let hasWarnings = false;

// Check required files
console.log('\n📁 Checking required files...\n');
REQUIRED_FILES.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${file}`);
  if (!exists) {
    hasErrors = true;
  }
});

// Check optional files
console.log('\n📋 Checking optional files...\n');
OPTIONAL_FILES.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✅' : '⚠️';
  console.log(`${icon} ${file}`);
  if (!exists && file === '.env') {
    console.log('   💡 Run: cp .env.example .env (if .env.example exists)');
    hasWarnings = true;
  }
});

// Check node_modules
console.log('\n📦 Checking dependencies...\n');
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
if (nodeModulesExists) {
  console.log('✅ node_modules directory exists');
} else {
  console.log('❌ node_modules directory not found');
  console.log('   💡 Run: npm install');
  hasErrors = true;
}

// Check package.json dependencies
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  const requiredDeps = ['react', 'react-dom', 'axios', 'react-query', 'uuid'];
  const requiredDevDeps = ['@vitejs/plugin-react', 'typescript', 'tailwindcss', 'vite'];
  
  console.log('\n🔧 Checking dependencies in package.json...\n');
  
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${dep}`);
    if (!exists) {
      hasErrors = true;
    }
  });
  
  requiredDevDeps.forEach(dep => {
    const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${dep} (dev)`);
    if (!exists) {
      hasErrors = true;
    }
  });
}

// Check environment variables
console.log('\n🔐 Checking environment configuration...\n');
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const hasApiUrl = envContent.includes('VITE_API_URL');
  
  if (hasApiUrl) {
    console.log('✅ VITE_API_URL is configured in .env');
    
    // Extract and display the URL
    const match = envContent.match(/VITE_API_URL=(.+)/);
    if (match) {
      console.log(`   📍 API URL: ${match[1].trim()}`);
    }
  } else {
    console.log('⚠️  VITE_API_URL not found in .env');
    console.log('   💡 Add: VITE_API_URL=http://localhost:8000/api/v1');
    hasWarnings = true;
  }
} else {
  console.log('⚠️  .env file not found');
  console.log('   💡 Create .env file with: VITE_API_URL=http://localhost:8000/api/v1');
  hasWarnings = true;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:\n');

if (!hasErrors && !hasWarnings) {
  console.log('✅ All checks passed! Your project is ready to run.');
  console.log('\n🚀 Next steps:');
  console.log('   1. Ensure ORCHA backend is running');
  console.log('   2. Run: npm run dev');
  console.log('   3. Open: http://localhost:3000\n');
} else if (hasErrors) {
  console.log('❌ Setup is incomplete. Please address the errors above.');
  console.log('\n🔧 Common fixes:');
  console.log('   - Missing files: Check if you downloaded the complete project');
  console.log('   - Missing dependencies: Run npm install');
  console.log('   - Check file structure matches the expected layout\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup is mostly complete, but some optional items are missing.');
  console.log('   The project should still work, but check warnings above.\n');
}

console.log('📚 Documentation:');
console.log('   - README.md - Complete documentation');
console.log('   - QUICKSTART.md - Fast setup guide');
console.log('   - ARCHITECTURE.md - Technical details\n');

