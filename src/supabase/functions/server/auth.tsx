// ============================================================================
// AUTHENTICATION & AUTHORIZATION MODULE
// ============================================================================
// This module handles all authentication and authorization logic for the
// Guard Up application, including signup, login, session management, and
// role-based access control.

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import type { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type UserRole = 'SECURITY_ADMIN' | 'GUARD' | 'COMPANY_ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  guardId?: number; // For GUARD role, links to guard record
  org_id?: string; // Organization ID for multi-tenant filtering
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  accessToken?: string;
  error?: string;
}

// ============================================================================
// SUPABASE CLIENT FACTORY
// ============================================================================

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

function getAnonClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
}

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

/**
 * Store user profile in KV store
 */
async function saveUserProfile(profile: UserProfile): Promise<void> {
  await kv.set(`user:${profile.id}`, profile);
  await kv.set(`user:email:${profile.email}`, profile.id);
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return await kv.get<UserProfile>(`user:${userId}`);
}

/**
 * Get user profile by email
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const userId = await kv.get<string>(`user:email:${email}`);
  if (!userId) return null;
  return await getUserProfile(userId);
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error('User profile not found');
  
  const updatedProfile = { ...profile, ...updates };
  await saveUserProfile(updatedProfile);
}

// ============================================================================
// AUTHENTICATION HANDLERS
// ============================================================================

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  guardId?: number
): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseClient();

    // Check if user already exists
    const existingProfile = await getUserProfileByEmail(email);
    if (existingProfile) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, guardId },
      // Automatically confirm email since email server isn't configured
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Failed to create user'
      };
    }

    // Create user profile in KV store
    const profile: UserProfile = {
      id: data.user.id,
      email,
      name,
      role,
      guardId,
      createdAt: new Date().toISOString()
    };

    await saveUserProfile(profile);

    return {
      success: true,
      user: profile
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: 'Internal server error during signup'
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = getAnonClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.session || !data.user) {
      return {
        success: false,
        error: 'Failed to create session'
      };
    }

    // Get user profile from KV store
    const profile = await getUserProfile(data.user.id);
    if (!profile) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }

    // Update last login time
    await updateUserProfile(profile.id, {
      lastLoginAt: new Date().toISOString()
    });

    return {
      success: true,
      user: profile,
      accessToken: data.session.access_token
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'Internal server error during sign in'
    };
  }
}

/**
 * Get session for an authenticated user
 */
export async function getSession(accessToken: string): Promise<AuthResponse> {
  try {
    const supabase = getAnonClient();

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired session'
      };
    }

    const profile = await getUserProfile(user.id);
    if (!profile) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }

    return {
      success: true,
      user: profile,
      accessToken
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      success: false,
      error: 'Internal server error during session validation'
    };
  }
}

/**
 * Sign out a user
 */
export async function signOut(accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAnonClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: 'Internal server error during sign out'
    };
  }
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Extract and validate access token from request headers
 */
export async function validateAccessToken(c: Context): Promise<{ user: UserProfile; accessToken: string } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    console.log('❌ No Authorization header found');
    return null;
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    console.log('❌ No access token in Authorization header');
    return null;
  }

  // DEMO MODE: Check if this is the anon key by decoding the JWT payload
  // Anon keys have "role":"anon" in their payload
  try {
    if (accessToken.startsWith('eyJ')) {
      // Decode JWT payload (it's base64 encoded between the first and second dot)
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        
        // If the role is "anon", treat this as demo mode
        if (payload.role === 'anon') {
          const demoUser: UserProfile = {
            id: 'demo-admin-user',
            email: 'admin@guardupapp.com',
            role: 'SECURITY_ADMIN',
            name: 'Demo Admin',
            org_id: 'default_org', // Default organization for MVP demo
            createdAt: new Date().toISOString()
          };
          
          console.log('🔓 Demo mode: Using mock admin user (detected anon key)');
          
          return {
            user: demoUser,
            accessToken
          };
        }
      }
    }
  } catch (e) {
    // If JWT decode fails, continue to normal auth
    console.log('⚠️ Failed to decode JWT, attempting normal auth');
  }

  console.log('⚠️ Attempting real auth...');
  
  const sessionResult = await getSession(accessToken);
  if (!sessionResult.success || !sessionResult.user) {
    console.log('❌ Real auth failed');
    return null;
  }

  return {
    user: sessionResult.user,
    accessToken
  };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(c: Context, next: () => Promise<void>) {
  const auth = await validateAccessToken(c);
  
  if (!auth) {
    return c.json({ error: 'Unauthorized - Please sign in' }, 401);
  }

  // Attach user to context for downstream handlers
  c.set('user', auth.user);
  c.set('accessToken', auth.accessToken);
  
  await next();
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = await validateAccessToken(c);
    
    if (!auth) {
      return c.json({ error: 'Unauthorized - Please sign in' }, 401);
    }

    if (!allowedRoles.includes(auth.user.role)) {
      return c.json({ 
        error: 'Forbidden - You do not have permission to access this resource',
        requiredRole: allowedRoles,
        yourRole: auth.user.role
      }, 403);
    }

    // Attach user to context
    c.set('user', auth.user);
    c.set('accessToken', auth.accessToken);
    
    await next();
  };
}

/**
 * Get current user from context (use after requireAuth middleware)
 */
export function getCurrentUser(c: Context): UserProfile {
  return c.get('user');
}