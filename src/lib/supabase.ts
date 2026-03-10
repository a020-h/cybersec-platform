// src/lib/supabase.ts
// ✅ استخدم createBrowserClient بدل createClient العام
// يقلل bundle size لأنه يحمّل فقط browser-specific code

import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern — نفس الـ instance في كل مكان
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}

// للتوافق مع الكود الحالي — export مباشر
export const supabase = getSupabase()