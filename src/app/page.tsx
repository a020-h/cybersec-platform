'use client'
import { supabase } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.push('/dashboard')
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-green-400 text-center mb-8">🔐 CYBERعربي</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={[]}
          localization={{
            variables: {
              sign_in: { email_label: 'البريد الإلكتروني', password_label: 'كلمة المرور', button_label: 'دخول' },
              sign_up: { email_label: 'البريد الإلكتروني', password_label: 'كلمة المرور', button_label: 'إنشاء حساب' },
            },
          }}
        />
      </div>
    </div>
  )
}