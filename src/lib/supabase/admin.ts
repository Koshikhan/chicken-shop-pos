import {
    createClient,
  } from "@supabase/supabase-js";
  
  export function createSupabaseAdminClient() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
  
    const secretKey =
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;
  
    if (!supabaseUrl) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL is missing.",
      );
    }
  
    if (!secretKey) {
      throw new Error(
        "SUPABASE_SECRET_KEY is missing. Add the server-only Supabase secret key to .env.local.",
      );
    }
  
    return createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          autoRefreshToken:
            false,
          persistSession:
            false,
          detectSessionInUrl:
            false,
        },
      },
    );
  }
  