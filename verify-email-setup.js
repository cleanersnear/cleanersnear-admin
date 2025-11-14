/**
 * Email System Setup Verification Script
 * 
 * Run this script to verify that all required environment variables
 * for the email system are properly configured.
 * 
 * Usage: npm run verify-email
 * or: node verify-email-setup.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local manually since Next.js doesn't automatically load it for Node scripts
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('\n🔍 Email System Configuration Verification\n');
console.log('='.repeat(50));

const requiredVars = [
  {
    name: 'SENDGRID_API_KEY',
    value: process.env.SENDGRID_API_KEY,
    description: 'SendGrid API Key for sending emails',
    required: true
  },
  {
    name: 'SENDGRID_FROM_EMAIL',
    value: process.env.SENDGRID_FROM_EMAIL,
    description: 'Email address that emails will be sent from',
    required: true
  },
  {
    name: 'SENDGRID_FROM_NAME',
    value: process.env.SENDGRID_FROM_NAME,
    description: 'Display name for sender',
    required: false,
    default: 'Cleaning Professionals'
  },
  {
    name: 'SENDGRID_TEMPLATE_CONFIRMATION',
    value: process.env.SENDGRID_TEMPLATE_CONFIRMATION,
    description: 'SendGrid template ID for confirmation emails',
    required: true
  },
  {
    name: 'SENDGRID_TEMPLATE_CANCELLATION',
    value: process.env.SENDGRID_TEMPLATE_CANCELLATION,
    description: 'SendGrid template ID for cancellation emails',
    required: true
  },
  {
    name: 'SENDGRID_TEMPLATE_COMPLETED',
    value: process.env.SENDGRID_TEMPLATE_COMPLETED,
    description: 'SendGrid template ID for completion emails',
    required: true
  },
  {
    name: 'SENDGRID_TEMPLATE_FEEDBACK',
    value: process.env.SENDGRID_TEMPLATE_FEEDBACK,
    description: 'SendGrid template ID for feedback request emails',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_NEW_SUPABASE_URL',
    value: process.env.NEXT_PUBLIC_NEW_SUPABASE_URL,
    description: 'New booking system Supabase URL',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_NEW_SUPABASE_ANON_KEY',
    value: process.env.NEXT_PUBLIC_NEW_SUPABASE_ANON_KEY,
    description: 'New booking system Supabase anon key',
    required: true
  }
];

let allValid = true;
const missing = [];
const present = [];

console.log('\n📋 Checking Environment Variables:\n');

requiredVars.forEach((envVar) => {
  const isSet = !!envVar.value;
  const status = isSet ? '✅' : (envVar.required ? '❌' : '⚠️');
  
  console.log(`${status} ${envVar.name}`);
  console.log(`   ${envVar.description}`);
  
  if (isSet) {
    // Mask sensitive values
    const displayValue = envVar.name.includes('KEY') 
      ? `${envVar.value.substring(0, 8)}...${envVar.value.substring(envVar.value.length - 4)}`
      : envVar.value;
    console.log(`   Value: ${displayValue}`);
    present.push(envVar.name);
  } else {
    if (envVar.required) {
      console.log(`   Status: MISSING (Required)`);
      missing.push(envVar.name);
      allValid = false;
    } else {
      console.log(`   Status: Not set (Optional, default: ${envVar.default})`);
    }
  }
  console.log('');
});

console.log('='.repeat(50));
console.log('\n📊 Summary:\n');

console.log(`✅ Present: ${present.length}/${requiredVars.length}`);
if (missing.length > 0) {
  console.log(`❌ Missing: ${missing.length}/${requiredVars.filter(v => v.required).length} required`);
  console.log(`\nMissing variables:\n${missing.map(v => `  - ${v}`).join('\n')}`);
}

console.log('\n='.repeat(50));

if (allValid) {
  console.log('\n✅ SUCCESS: All required environment variables are set!');
  console.log('\nYou can now use the email system.');
  console.log('\nNext steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Navigate to a booking detail page');
  console.log('3. Try sending a test confirmation email');
  console.log('');
  process.exit(0);
} else {
  console.log('\n❌ ERROR: Missing required environment variables!');
  console.log('\nTo fix this:');
  console.log('1. Create/edit .env.local file in the admin directory');
  console.log('2. Add the missing environment variables');
  console.log('3. Run this script again to verify');
  console.log('\nExample .env.local configuration:');
  console.log('');
  console.log('# SendGrid Configuration');
  console.log('SENDGRID_API_KEY=SG.xxxxxxxxxxxx...');
  console.log('SENDGRID_FROM_EMAIL=noreply@cleaningprofessionals.com.au');
  console.log('SENDGRID_FROM_NAME=Cleaning Professionals');
  console.log('');
  console.log('# Supabase Configuration');
  console.log('NEXT_PUBLIC_NEW_SUPABASE_URL=https://xxx.supabase.co');
  console.log('NEXT_PUBLIC_NEW_SUPABASE_ANON_KEY=eyJxxx...');
  console.log('');
  process.exit(1);
}

