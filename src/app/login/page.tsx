'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [visible, setVisible] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
      else setTimeout(() => setVisible(true), 80)
    })
  }, [])

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const cols = Math.floor(canvas.width / 24)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01ABCDEF0123456789!@#$%^&*'
    const draw = () => {
      ctx.fillStyle = 'rgba(5,10,15,0.07)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = `rgba(0,255,136,${Math.random() * 0.4 + 0.05})`
        ctx.font = '13px monospace'
        ctx.fillText(char, i * 24, y * 22)
        if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 55)
    return () => { clearInterval(interval); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubmit = async () => {
    setError(''); setSuccess('')

    // Validation
    if (!email || !password) { setError('يرجى ملء جميع الحقول'); return }
    if (mode === 'register' && !username.trim()) { setError('يرجى إدخال اسم المستخدم'); return }
    if (mode === 'register' && username.trim().length < 3) { setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'); return }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
          if (err.message.includes('Invalid login')) setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
          else setError('حدث خطأ، حاول مرة أخرى')
        } else {
          router.push('/dashboard')
        }

      } else {
        // ===== REGISTER =====
        const { data, error: err } = await supabase.auth.signUp({ email, password })

        if (err) {
          if (err.message.includes('already registered')) setError('هذا البريد الإلكتروني مسجل مسبقاً')
          else setError('حدث خطأ في التسجيل: ' + err.message)

        } else if (data.user) {
          // ✅ حفظ username و avatar في profiles
          const { error: profileErr } = await supabase.from('profiles').upsert({
            id: data.user.id,
            username: username.trim(),
            points: 0,
            avatar: '🧑‍💻',
          }, { onConflict: 'id' })

          if (profileErr) {
            console.error('Profile save error:', profileErr)
            // نكمل حتى لو فيه خطأ في الـ profile
          }

          setSuccess('تم التسجيل بنجاح! جاري التحويل...')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      }
    } catch (e) {
      setError('حدث خطأ غير متوقع')
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Cairo',sans-serif;background:#050a0f;color:#e0f0ff;overflow:hidden;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.1)}50%{box-shadow:0 0 40px rgba(0,255,136,0.25)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        .fade-up{animation:fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) both;}
        .card-glow{animation:glow 3s ease-in-out infinite;}
        .shake{animation:shake 0.35s ease-in-out;}
        .input-field{
          width:100%;background:#0a1520;border:1px solid #1a3a50;border-radius:10px;
          padding:13px 44px 13px 16px;color:#e0f0ff;font-family:'Cairo',sans-serif;
          font-size:15px;outline:none;transition:all 0.25s;direction:rtl;
        }
        .input-field:focus{border-color:#00ff8866;background:#0d1e2e;box-shadow:0 0 0 3px rgba(0,255,136,0.08);}
        .input-field::placeholder{color:#3a5a70;}
        .input-wrap{position:relative;margin-bottom:16px;}
        .input-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none;z-index:1;}
        .submit-btn{
          width:100%;background:#00ff88;color:#050a0f;border:none;border-radius:10px;
          padding:14px;font-family:'Cairo',sans-serif;font-size:16px;font-weight:900;
          cursor:pointer;transition:all 0.3s;margin-top:8px;
        }
        .submit-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,255,136,0.35);}
        .submit-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
        .tab-btn{
          flex:1;padding:11px;border:none;background:transparent;font-family:'Cairo',sans-serif;
          font-size:14px;font-weight:700;cursor:pointer;transition:all 0.25s;border-radius:8px;
        }
        .show-pass{
          position:absolute;left:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;color:#3a5a70;font-size:15px;
          transition:color 0.2s;padding:4px;
        }
        .show-pass:hover{color:#00ff88;}
        .back-btn{
          background:none;border:none;color:#5a7a90;font-family:'Cairo',sans-serif;
          font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;
          transition:color 0.2s;padding:0;
        }
        .back-btn:hover{color:#00ff88;}
        @media(max-width:480px){
          .auth-card{padding:28px 20px !important;margin:0 16px !important;}
          .auth-title{font-size:22px !important;}
        }
      `}</style>

      {/* Matrix BG */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, opacity:0.3, pointerEvents:'none' }} />

      {/* Glow orbs */}
      <div style={{ position:'fixed', top:'-100px', left:'50%', transform:'translateX(-50%)', width:'600px', height:'400px', background:'radial-gradient(ellipse,rgba(0,255,136,0.06),transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-100px', right:'-100px', width:'400px', height:'400px', background:'radial-gradient(ellipse,rgba(168,85,247,0.05),transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', opacity: visible ? 1 : 0, transition:'opacity 0.5s' }} dir="rtl">

        {/* Logo */}
        <div className="fade-up" style={{ marginBottom:'28px', textAlign:'center' }}>
          <button onClick={() => router.push('/')} className="back-btn" style={{ margin:'0 auto 12px', display:'flex', justifyContent:'center' }}>
            ← العودة للرئيسية
          </button>
          <span style={{ fontFamily:'monospace', fontSize:'24px', fontWeight:'700', color:'#00ff88', letterSpacing:'2px' }}>
            🔐 CYBER<span style={{ color:'#7090a8' }}>عربي</span>
          </span>
          <p style={{ color:'#3a5a70', fontFamily:'monospace', fontSize:'11px', marginTop:'4px' }}>منصة الأمن السيبراني العربية</p>
        </div>

        {/* Card */}
        <div
          className="fade-up card-glow auth-card"
          style={{ animationDelay:'0.1s', background:'rgba(10,21,32,0.95)', border:'1px solid #1a3a50', borderRadius:'20px', padding:'36px 32px', width:'100%', maxWidth:'420px', backdropFilter:'blur(20px)' }}
        >
          {/* Tabs */}
          <div style={{ display:'flex', background:'#080f18', borderRadius:'10px', padding:'4px', marginBottom:'28px', position:'relative' }}>
            <div style={{
              position:'absolute', top:'4px', bottom:'4px', borderRadius:'7px',
              background:'linear-gradient(135deg,#0f2a1a,#0a1520)', border:'1px solid #00ff8833',
              transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              left: mode === 'login' ? '4px' : '50%',
              right: mode === 'login' ? '50%' : '4px',
            }} />
            <button className="tab-btn" onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              style={{ color: mode === 'login' ? '#00ff88' : '#5a7a90', position:'relative', zIndex:1 }}>
              تسجيل الدخول
            </button>
            <button className="tab-btn" onClick={() => { setMode('register'); setError(''); setSuccess('') }}
              style={{ color: mode === 'register' ? '#00ff88' : '#5a7a90', position:'relative', zIndex:1 }}>
              حساب جديد
            </button>
          </div>

          {/* Title */}
          <div style={{ marginBottom:'24px' }}>
            <h1 className="auth-title" style={{ fontSize:'24px', fontWeight:'900', color:'white', marginBottom:'6px' }}>
              {mode === 'login' ? '👋 أهلاً بعودتك!' : '🚀 انضم إلينا مجاناً'}
            </h1>
            <p style={{ color:'#5a7a90', fontSize:'13px' }}>
              {mode === 'login' ? 'سجّل دخولك لمتابعة رحلتك في الأمن السيبراني' : 'أنشئ حسابك وابدأ التعلّم الآن'}
            </p>
          </div>

          {/* Fields */}
          <div key={mode}>
            {mode === 'register' && (
              <div className="fade-up input-wrap" style={{ animationDelay:'0s' }}>
                <span className="input-icon">👤</span>
                <input
                  className="input-field"
                  placeholder="اسم المستخدم (يظهر في المتصدرين)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKey}
                  maxLength={20}
                  autoComplete="username"
                />
              </div>
            )}

            <div className="fade-up input-wrap" style={{ animationDelay:'0.05s' }}>
              <span className="input-icon">📧</span>
              <input
                className="input-field"
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="email"
              />
            </div>

            <div className="fade-up input-wrap" style={{ animationDelay:'0.1s' }}>
              <span className="input-icon">🔑</span>
              <input
                className="input-field"
                type={showPass ? 'text' : 'password'}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingLeft: '44px' }}
              />
              <button className="show-pass" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="shake" style={{ background:'rgba(255,59,59,0.1)', border:'1px solid #ff3b3b44', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', color:'#ff6b6b', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="fade-up" style={{ background:'rgba(0,255,136,0.08)', border:'1px solid #00ff8833', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', color:'#00ff88', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px' }}>
              ✅ {success}
            </div>
          )}

          {/* Submit */}
          <button className="submit-btn fade-up" style={{ animationDelay:'0.15s' }} onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <span style={{ width:'16px', height:'16px', border:'2px solid #050a0f', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}></span>
                جاري التحميل...
              </span>
            ) : mode === 'login' ? '🔓 تسجيل الدخول' : '🚀 إنشاء الحساب'}
          </button>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0' }}>
            <div style={{ flex:1, height:'1px', background:'#1a3a50' }} />
            <span style={{ color:'#3a5a70', fontSize:'12px', fontFamily:'monospace' }}>أو</span>
            <div style={{ flex:1, height:'1px', background:'#1a3a50' }} />
          </div>

          {/* Switch mode */}
          <p style={{ textAlign:'center', color:'#5a7a90', fontSize:'13px' }}>
            {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              style={{ background:'none', border:'none', color:'#00ff88', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontSize:'13px', fontWeight:'700', padding:0 }}>
              {mode === 'login' ? 'سجّل الآن مجاناً ←' : '← سجّل الدخول'}
            </button>
          </p>
        </div>

        {/* Security badges */}
        <div className="fade-up" style={{ animationDelay:'0.3s', display:'flex', gap:'16px', marginTop:'20px', flexWrap:'wrap', justifyContent:'center' }}>
          {['🔒 اتصال آمن SSL', '🛡️ بياناتك محمية', '🎓 مجاني 100%'].map((b,i) => (
            <span key={i} style={{ color:'#3a5a70', fontSize:'11px', fontFamily:'monospace', display:'flex', alignItems:'center', gap:'4px' }}>{b}</span>
          ))}
        </div>

      </div>
    </>
  )
}