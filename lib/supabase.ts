/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Security Check: Ensure we're not using a secret key in the browser
if (supabaseAnonKey.startsWith('sb_secret_')) {
    console.error("CRITICAL SECURITY ERROR: You are using a 'Service Role Secret Key' as your 'Anon Public Key'. This is forbidden in the browser and will prevent authentication from working.");
    throw new Error("Invalid Supabase Key: Secret keys cannot be used in the browser.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
    },
});

// Export auth and db for convenience
export const auth = supabase.auth;
export const db = supabase;

export default supabase;
