#!/usr/bin/env tsx

/**
 * Admin Setup Script
 * 
 * This script helps set up an admin user for the KORAUTO application.
 * It can be used to:
 * 1. Create an admin user through Supabase Auth
 * 2. Promote an existing user to admin
 * 3. Verify admin setup
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set this in your .env file or environment variables');
  process.exit(1);
}

// Create admin client (with service role key for admin operations)
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Create regular client (for testing login)
const clientSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdminUser(email: string, password: string) {
  console.log(`Creating admin user: ${email}`);
  
  try {
    // Create user with admin client
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return false;
    }

    console.log('User created successfully:', data.user.email);
    
    // The trigger should automatically assign admin role for admin@korauto.com
    // But let's also manually ensure it using our promote function
    const { data: promoteResult, error: promoteError } = await adminSupabase
      .rpc('promote_to_admin', { user_email: email });

    if (promoteError) {
      console.error('Error promoting to admin:', promoteError.message);
      return false;
    }

    console.log('User promoted to admin successfully');
    return true;

  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

async function promoteUserToAdmin(email: string) {
  console.log(`Promoting user to admin: ${email}`);
  
  try {
    const { data, error } = await adminSupabase
      .rpc('promote_to_admin', { user_email: email });

    if (error) {
      console.error('Error promoting user:', error.message);
      return false;
    }

    if (data) {
      console.log('User promoted to admin successfully');
      return true;
    } else {
      console.log('User not found or promotion failed');
      return false;
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

async function testAdminLogin(email: string, password: string) {
  console.log(`Testing admin login for: ${email}`);
  
  try {
    // Sign in with regular client
    const { data: authData, error: authError } = await clientSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Authentication failed:', authError.message);
      return false;
    }

    console.log('Authentication successful');

    // Check admin role
    const { data: roleData, error: roleError } = await clientSupabase.rpc('is_admin');

    if (roleError) {
      console.error('Role check failed:', roleError.message);
      return false;
    }

    if (roleData) {
      console.log('✅ Admin login test PASSED - user has admin privileges');
      return true;
    } else {
      console.log('❌ Admin login test FAILED - user does not have admin privileges');
      return false;
    }

  } catch (error) {
    console.error('Unexpected error during login test:', error);
    return false;
  } finally {
    // Sign out
    await clientSupabase.auth.signOut();
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'create': {
      const email = process.argv[3] || 'admin@korauto.com';
      const password = process.argv[4] || 'KorAuto2024!';
      
      console.log('=== Creating Admin User ===');
      const created = await createAdminUser(email, password);
      
      if (created) {
        console.log('\n=== Testing Admin Login ===');
        await testAdminLogin(email, password);
      }
      break;
    }
      
    case 'promote': {
      const promoteEmail = process.argv[3];
      if (!promoteEmail) {
        console.error('Usage: npm run admin-setup promote <email>');
        process.exit(1);
      }
      
      console.log('=== Promoting User to Admin ===');
      await promoteUserToAdmin(promoteEmail);
      break;
    }
      
    case 'test': {
      const testEmail = process.argv[3] || 'admin@korauto.com';
      const testPassword = process.argv[4] || 'KorAuto2024!';
      
      console.log('=== Testing Admin Login ===');
      await testAdminLogin(testEmail, testPassword);
      break;
    }
      
    default:
      console.log('KORAUTO Admin Setup Tool');
      console.log('');
      console.log('Usage:');
      console.log('  npm run admin-setup create [email] [password]  # Create admin user (default: admin@korauto.com / KorAuto2024!)');
      console.log('  npm run admin-setup promote <email>           # Promote existing user to admin');
      console.log('  npm run admin-setup test [email] [password]   # Test admin login');
      console.log('');
      console.log('Examples:');
      console.log('  npm run admin-setup create');
      console.log('  npm run admin-setup create admin@korauto.com mypassword');
      console.log('  npm run admin-setup promote user@example.com');
      console.log('  npm run admin-setup test admin@korauto.com KorAuto2024!');
      break;
  }
}

main().catch(console.error);