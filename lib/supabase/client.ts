import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

// This app calls Supabase only from server-side API routes (never from
// client components), so it uses the service role key to bypass RLS.
// Do not import this client into any "use client" component.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(
  supabaseUrl,
  serviceRoleKey ?? anonKey,
  serviceRoleKey
    ? { auth: { persistSession: false, autoRefreshToken: false } }
    : undefined
);
