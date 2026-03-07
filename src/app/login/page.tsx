'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function getPasswordStrength(pw: string): { score: number; label: string; color: string; checks: Record<string, boolean> } {
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  const labels = ['', 'ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً ✓']
  const colors = ['', '#ff3366', '#ff6b35', '#ffd700', '#00d4ff', '#00ff88']
  return { score, label: labels[score] || '', color: colors[score] || '', checks }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [visible, setVisible] = useState(false)
  const [shake, setShake] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const pwStrength = getPasswordStrength(password)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else setTimeout(() => setVisible(true), 80)
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const cols = Math.floor(canvas.width / 26)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01ABCDEF0123456789!@#$%^&*></'
    const draw = () => {
      ctx.fillStyle = 'rgba(5,10,15,0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = `rgba(0,255,136,${Math.random() * 0.35 + 0.04})`
        ctx.font = '13px monospace'
        ctx.fillText(char, i * 26, y * 22)
        if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 55)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  const validateForm = (): string | null => {
    if (!email.trim()) return 'يرجى إدخال البريد الإلكتروني'
    if (!isValidEmail(email)) return 'صيغة البريد الإلكتروني غير صحيحة'
    if (!password) return 'يرجى إدخال كلمة المرور'
    if (mode === 'register') {
      if (!username.trim()) return 'يرجى إدخال اسم المستخدم'
      if (username.trim().length < 3) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
      if (username.trim().length > 20) return 'اسم المستخدم لا يتجاوز 20 حرفاً'
      if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(username.trim())) return 'اسم المستخدم يحتوي على أحرف غير مسموح بها'
      if (pwStrength.score < 3) return 'كلمة المرور ضعيفة — يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز'
      if (!pwStrength.checks.length) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      if (!pwStrength.checks.uppercase) return 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل'
      if (!pwStrength.checks.number) return 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'
      if (!pwStrength.checks.symbol) return 'كلمة المرور يجب أن تحتوي على رمز واحد على الأقل (!@#$...)'
      if (password !== confirmPassword) return 'كلمتا المرور غير متطابقتين'
    } else {
      if (password.length < 6) return 'كلمة المرور قصيرة جداً'
    }
    return null
  }

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); triggerShake(); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (err) {
          if (err.message.includes('Invalid login') || err.message.includes('invalid_credentials')) {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
          } else if (err.message.includes('Email not confirmed')) {
            setError('يرجى تأكيد بريدك الإلكتروني أولاً')
          } else if (err.message.includes('Too many requests')) {
            setError('محاولات كثيرة — انتظر قليلاً ثم حاول مرة أخرى')
          } else {
            setError('حدث خطأ، حاول مرة أخرى')
          }
          triggerShake()
        } else {
          setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...')
          setTimeout(() => router.push('/dashboard'), 1000)
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password })
        if (err) {
          if (err.message.includes('already registered') || err.message.includes('User already registered')) {
            setError('هذا البريد الإلكتروني مسجل مسبقاً — جرب تسجيل الدخول')
          } else {
            setError('حدث خطأ في التسجيل: ' + err.message)
          }
          triggerShake()
        } else if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: username.trim(),
            points: 0,
            avatar: '🧑‍💻',
          }, { onConflict: 'id' })
          setSuccess('تم إنشاء حسابك بنجاح! جاري التحويل...')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      }
    } catch {
      setError('حدث خطأ غير متوقع، تحقق من اتصالك بالإنترنت')
      triggerShake()
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }
  const mark = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  const fieldError = (field: string, value: string): string => {
    if (!touched[field]) return ''
    if (field === 'email' && value && !isValidEmail(value)) return 'صيغة البريد غير صحيحة'
    if (field === 'username' && value && value.length < 3) return 'اسم المستخدم قصير جداً'
    if (field === 'confirm' && value && value !== password) return 'كلمتا المرور غير متطابقتين'
    return ''
  }

  const inp = (hasErr: boolean): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(5,10,15,0.8)',
    border: `1px solid ${hasErr ? 'rgba(255,51,102,0.5)' : '#1a3a50'}`,
    borderRadius: '10px',
    padding: '13px 46px 13px 16px',
    color: '#e0f0ff',
    fontFamily: 'Cairo, sans-serif',
    fontSize: '15px',
    outline: 'none',
    direction: 'rtl',
    transition: 'all 0.25s',
    boxSizing: 'border-box',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; overflow:hidden; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 30px rgba(0,255,136,0.08)} 50%{box-shadow:0 0 50px rgba(0,255,136,0.18)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-9px)} 40%{transform:translateX(9px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; }
        .card-glow { animation:glow 3s ease-in-out infinite; }
        .do-shake { animation:shake 0.4s ease-in-out; }
        .slide-down { animation:slideDown 0.25s ease; }
        input:focus { border-color: rgba(0,255,136,0.4) !important; background: rgba(10,21,32,0.95) !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.07); }
        input::placeholder { color: #3a5a70; }
        .submit-btn { width:100%; border:none; border-radius:12px; padding:14px; font-family:'Cairo',sans-serif; font-size:16px; font-weight:900; cursor:pointer; transition:all 0.3s; }
        .submit-btn:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 12px 35px rgba(0,255,136,0.35); }
        .submit-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .tab-btn { flex:1; padding:11px; border:none; background:transparent; font-family:'Cairo',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.25s; border-radius:8px; }
        .show-pass { position:absolute; left:13px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#3a5a70; font-size:15px; transition:color 0.2s; padding:4px; }
        .show-pass:hover { color:#00ff88; }
        .check-item { display:flex; align-items:center; gap:7px; font-size:12px; font-family:'Space Mono',monospace; transition:color 0.3s; }
        @media(max-width:480px) {
          .auth-card { padding:26px 18px !important; margin:0 12px !important; }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '450px', background: 'radial-gradient(ellipse, rgba(0,255,136,0.07), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-120px', right: '-120px', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(168,85,247,0.05), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', opacity: visible ? 1 : 0, transition: 'opacity 0.5s', overflowY: 'auto' }} dir="rtl">

        {/* Logo */}
        <div className="fade-up" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#7090a8', fontFamily: 'Cairo, sans-serif', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s', margin: '0 auto 10px' }}>
            ← العودة للرئيسية
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span style={{ fontSize: '22px' }}>🔐</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '22px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px', textShadow: '0 0 20px rgba(0,255,136,0.4)' }}>CYBER</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '22px', fontWeight: '700', color: '#7090a8', letterSpacing: '2px' }}>عربي</span>
          </div>
          <p style={{ color: '#3a5a70', fontFamily: 'Space Mono, monospace', fontSize: '11px', marginTop: '4px', letterSpacing: '1px' }}>ARABIC CYBERSECURITY PLATFORM</p>
        </div>

        {/* Card */}
        <div className={`fade-up card-glow auth-card ${shake ? 'do-shake' : ''}`}
          style={{ animationDelay: '0.1s', background: 'rgba(8,16,28,0.97)', border: '1px solid #1a3a50', borderRadius: '22px', padding: '36px 32px', width: '100%', maxWidth: '440px', backdropFilter: 'blur(24px)', position: 'relative', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)' }}></div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(5,10,15,0.7)', borderRadius: '12px', padding: '4px', marginBottom: '28px', position: 'relative', border: '1px solid #1a3a5055' }}>
            <div style={{ position: 'absolute', top: '4px', bottom: '4px', borderRadius: '9px', background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))', border: '1px solid rgba(0,255,136,0.25)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', left: mode === 'login' ? '4px' : '50%', right: mode === 'login' ? '50%' : '4px' }} />
            <button className="tab-btn" onClick={() => { setMode('login'); setError(''); setSuccess(''); setTouched({}) }} style={{ color: mode === 'login' ? '#00ff88' : '#5a7a90', position: 'relative', zIndex: 1 }}>تسجيل الدخول</button>
            <button className="tab-btn" onClick={() => { setMode('register'); setError(''); setSuccess(''); setTouched({}) }} style={{ color: mode === 'register' ? '#00ff88' : '#5a7a90', position: 'relative', zIndex: 1 }}>حساب جديد</button>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '22px' }}>
            <h1 style={{ fontSize: '23px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>
              {mode === 'login' ? '👋 أهلاً بعودتك!' : '🚀 انضم إلينا مجاناً'}
            </h1>
            <p style={{ color: '#7090a8', fontSize: '13px' }}>
              {mode === 'login' ? 'سجّل دخولك لمتابعة رحلتك في الأمن السيبراني' : 'أنشئ حسابك وابدأ التعلّم الآن'}
            </p>
          </div>

          {/* Fields */}
          <div key={mode}>

            {mode === 'register' && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', zIndex: 1 }}>👤</span>
                  <input style={inp(!!fieldError('username', username))} placeholder="اسم المستخدم (يظهر للجميع)" value={username}
                    onChange={e => setUsername(e.target.value)} onBlur={() => mark('username')}
                    onKeyDown={handleKey} maxLength={20} autoComplete="username" />
                </div>
                {fieldError('username', username) && (
                  <p className="slide-down" style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '5px', fontFamily: 'Space Mono, monospace', paddingRight: '4px' }}>⚠ {fieldError('username', username)}</p>
                )}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', zIndex: 1 }}>📧</span>
                <input style={inp(!!fieldError('email', email))} type="email" placeholder="البريد الإلكتروني" value={email}
                  onChange={e => setEmail(e.target.value)} onBlur={() => mark('email')}
                  onKeyDown={handleKey} autoComplete="email" />
                {touched.email && isValidEmail(email) && (
                  <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#00ff88', fontSize: '14px' }}>✓</span>
                )}
              </div>
              {fieldError('email', email) && (
                <p className="slide-down" style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '5px', fontFamily: 'Space Mono, monospace', paddingRight: '4px' }}>⚠ {fieldError('email', email)}</p>
              )}
            </div>

            <div style={{ marginBottom: mode === 'register' ? '8px' : '14px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', zIndex: 1 }}>🔑</span>
                <input style={{ ...inp(false), paddingLeft: '46px' }} type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'كلمة المرور (8+ أحرف وأرقام ورموز)' : 'كلمة المرور'}
                  value={password} onChange={e => setPassword(e.target.value)} onBlur={() => mark('password')}
                  onKeyDown={handleKey} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button className="show-pass" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {mode === 'register' && password && (
                <div className="slide-down" style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= pwStrength.score ? pwStrength.color : '#1a3a50', transition: 'all 0.3s', boxShadow: i <= pwStrength.score && pwStrength.score >= 4 ? `0 0 6px ${pwStrength.color}66` : 'none' }} />
                    ))}
                  </div>
                  <p style={{ color: pwStrength.color, fontSize: '11px', fontFamily: 'Space Mono, monospace', marginBottom: '8px' }}>
                    قوة كلمة المرور: {pwStrength.label}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {[
                      { key: 'length', label: '8 أحرف على الأقل' },
                      { key: 'uppercase', label: 'حرف كبير (A-Z)' },
                      { key: 'lowercase', label: 'حرف صغير (a-z)' },
                      { key: 'number', label: 'رقم (0-9)' },
                      { key: 'symbol', label: 'رمز (!@#$...)' },
                    ].map(c => (
                      <div key={c.key} className="check-item" style={{ color: pwStrength.checks[c.key as keyof typeof pwStrength.checks] ? '#00ff88' : '#3a5a70' }}>
                        <span style={{ fontSize: '11px' }}>{pwStrength.checks[c.key as keyof typeof pwStrength.checks] ? '✓' : '○'}</span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: '14px', marginTop: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', zIndex: 1 }}>🔒</span>
                  <input style={{ ...inp(!!fieldError('confirm', confirmPassword)), paddingLeft: '46px' }}
                    type={showConfirm ? 'text' : 'password'} placeholder="تأكيد كلمة المرور"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => mark('confirm')} onKeyDown={handleKey} autoComplete="new-password" />
                  <button className="show-pass" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                  {confirmPassword && confirmPassword === password && (
                    <span style={{ position: 'absolute', left: '40px', top: '50%', transform: 'translateY(-50%)', color: '#00ff88', fontSize: '14px' }}>✓</span>
                  )}
                </div>
                {fieldError('confirm', confirmPassword) && (
                  <p className="slide-down" style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '5px', fontFamily: 'Space Mono, monospace', paddingRight: '4px' }}>⚠ {fieldError('confirm', confirmPassword)}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="slide-down" style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.25)', borderRadius: '10px', padding: '11px 14px', marginBottom: '14px', color: '#ff6b6b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: '1.5' }}>
              <span style={{ flexShrink: 0, fontSize: '15px' }}>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="slide-down" style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '10px', padding: '11px 14px', marginBottom: '14px', color: '#00ff88', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ flexShrink: 0, fontSize: '15px' }}>✅</span> {success}
            </div>
          )}

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}
            style={{ background: loading ? 'rgba(0,255,136,0.4)' : '#00ff88', color: '#050a0f', boxShadow: loading ? 'none' : '0 6px 24px rgba(0,255,136,0.25)', marginBottom: '18px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(5,10,15,0.3)', borderTopColor: '#050a0f', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}></span>
                جاري المعالجة...
              </span>
            ) : mode === 'login' ? '🔓 تسجيل الدخول' : '🚀 إنشاء الحساب'}
          </button>

          <p style={{ textAlign: 'center', color: '#7090a8', fontSize: '13px' }}>
            {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); setTouched({}) }}
              style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px', fontWeight: '900', padding: 0 }}>
              {mode === 'login' ? 'سجّل الآن مجاناً ←' : '← تسجيل الدخول'}
            </button>
          </p>
        </div>

        <div className="fade-up" style={{ animationDelay: '0.3s', display: 'flex', gap: '16px', marginTop: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['🔒 SSL مشفر', '🛡️ بياناتك آمنة', '🎓 مجاني 100%', '🚫 بدون إعلانات'].map((b, i) => (
            <span key={i} style={{ color: '#3a5a70', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>{b}</span>
          ))}
        </div>
      </div>
    </>
  )
}