'use client'
import { supabase } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
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
    <div style={{ minHeight:'100vh', background:'#050a0f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:'420px', padding:'40px', background:'#0a1520', borderRadius:'16px', border:'1px solid #1a3a50' }}>
        <h1 style={{ color:'#00ff88', textAlign:'center', marginBottom:'8px', fontFamily:'monospace', fontSize:'24px' }}>🔐 CYBERعربي</h1>
        <p style={{ color:'#7090a8', textAlign:'center', marginBottom:'28px', fontSize:'14px' }}>سجّل دخولك وابدأ رحلتك</p>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" providers={[]}
          localization={{ variables: { sign_in: { email_label:'البريد الإلكتروني', password_label:'كلمة المرور', button_label:'دخول' }, sign_up: { email_label:'البريد الإلكتروني', password_label:'كلمة المرور', button_label:'إنشاء حساب' } } }} />
      </div>
    </div>
  )
}