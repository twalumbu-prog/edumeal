import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or anon key is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
