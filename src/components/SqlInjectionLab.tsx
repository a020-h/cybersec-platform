'use client'
import { useState, useRef, useEffect } from 'react'

// ==================== TYPES ====================
type Stage = 'intro' | 'lab' | 'complete'
type TabType = 'terminal' | 'browser' | 'hints'
type ChallengeId = 1 | 2 | 3 | 4

interface Challenge {
  id: ChallengeId
  title: string
  description: string
  hint: string
  solution: string
  points: number
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system'
  content: string
}

interface BrowserState {
  url: string
  response: string
  statusCode: number
}

// ==================== DATA ====================
const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: 'الدخول بدون كلمة مرور',
    description: 'الموقع المستهدف يحتوي على نموذج تسجيل دخول. حاول الدخول كـ admin بدون معرفة كلمة المرور.',
    hint: "جرب: admin' -- في حقل اسم المستخدم",
    solution: "admin' --",
    points: 50
  },
  {
    id: 2,
    title: 'استخراج قاعدة البيانات',
    description: 'استخرج اسم قاعدة البيانات الحالية باستخدام UNION SELECT.',
    hint: "جرب: ' UNION SELECT database(),2,3 -- في حقل البحث",
    solution: "' UNION SELECT database(),2,3 --",
    points: 75
  },
  {
    id: 3,
    title: 'سرقة بيانات المستخدمين',
    description: 'استخرج جدول المستخدمين من قاعدة البيانات.',
    hint: "جرب: ' UNION SELECT username,password,3 FROM users --",
    solution: "' UNION SELECT username,password,3 FROM users --",
    points: 100
  },
  {
    id: 4,
    title: 'تجاوز الصلاحيات',
    description: 'ادخل كمستخدم admin باستخدام OR injection.',
    hint: "جرب: ' OR '1'='1 في حقل كلمة المرور",
    solution: "' OR '1'='1",
    points: 125
  }
]

// ==================== SQL ENGINE ====================
const fakeDB = {
  users: [
    { id: 1, username: 'admin', password: 'S3cr3t!Pass', role: 'admin' },
    { id: 2, username: 'ahmed', password: 'ahmed123', role: 'user' },
    { id: 3, username: 'sara', password: 'sara2024', role: 'user' },
  ],
  products: [
    { id: 1, name: 'Laptop', price: 1200, category: 'electronics' },
    { id: 2, name: 'Phone', price: 800, category: 'electronics' },
  ],
  dbName: 'shop_db'
}

function processSQL(input: string, field: 'username' | 'password' | 'search'): { success: boolean; data: any; query: string } {
  const inp = input.toLowerCase().trim()

  if (field === 'username') {
    const query = `SELECT * FROM users WHERE username='${input}' AND password='[hidden]'`
    if (inp.includes("'") && (inp.includes('--') || inp.includes('#'))) {
      const match = input.match(/^([^']+)/)
      const user = match ? fakeDB.users.find(u => u.username.toLowerCase() === match[1].toLowerCase().trim()) : null
      if (user || inp.includes('admin')) {
        return { success: true, data: { user: user || fakeDB.users[0] }, query }
      }
    }
    return { success: false, data: null, query }
  }

  if (field === 'password') {
    const query = `SELECT * FROM users WHERE username='admin' AND password='${input}'`
    if (inp.includes("'") && inp.includes('or') && inp.includes('1')) {
      return { success: true, data: { user: fakeDB.users[0] }, query }
    }
    return { success: false, data: null, query }
  }

  if (field === 'search') {
    const query = `SELECT id,name,price FROM products WHERE name LIKE '%${input}%'`
    if (inp.includes('union') && inp.includes('select')) {
      if (inp.includes('database()')) {
        return { success: true, data: { union: true, result: [[fakeDB.dbName, '2', '3']] }, query }
      }
      if (inp.includes('from users')) {
        return {
          success: true,
          data: { union: true, result: fakeDB.users.map(u => [u.username, u.password, u.role]) },
          query
        }
      }
    }
    const results = fakeDB.products.filter(p => p.name.toLowerCase().includes(inp))
    return { success: true, data: { products: results }, query }
  }

  return { success: false, data: null, query: '' }
}

// ==================== BROWSER SIMULATOR ====================
function BrowserSim({
  solved,
  onSolve,
  currentChallenge
}: {
  solved: Set<number>
  onSolve: (id: ChallengeId, points: number) => void
  currentChallenge: ChallengeId
}) {
  const [page, setPage] = useState<'home' | 'login' | 'search' | 'dashboard'>('home')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loginResult, setLoginResult] = useState<null | { success: boolean; message: string; query?: string }>(null)
  const [searchResult, setSearchResult] = useState<null | { data: any; query: string }>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loggedUser, setLoggedUser] = useState<any>(null)

  const handleLogin = () => {
    if (!username) return
    const r1 = processSQL(username, 'username')
    if (r1.success) {
      setLoggedIn(true)
      setLoggedUser(r1.data.user)
      setLoginResult({ success: true, message: `✅ تم الدخول كـ ${r1.data.user.username}`, query: r1.query })
      if (!solved.has(1) && currentChallenge === 1) onSolve(1, 50)
      if (!solved.has(4) && currentChallenge === 4) onSolve(4, 125)
      setTimeout(() => setPage('dashboard'), 800)
      return
    }
    const r2 = processSQL(password, 'password')
    if (r2.success) {
      setLoggedIn(true)
      setLoggedUser(r2.data.user)
      setLoginResult({ success: true, message: `✅ تم الدخول كـ ${r2.data.user.username}`, query: r2.query })
      if (!solved.has(4) && currentChallenge === 4) onSolve(4, 125)
      setTimeout(() => setPage('dashboard'), 800)
      return
    }
    setLoginResult({ success: false, message: '❌ خطأ في اسم المستخدم أو كلمة المرور', query: r1.query })
  }

  const handleSearch = () => {
    const r = processSQL(searchQuery, 'search')
    setSearchResult({ data: r.data, query: r.query })
    if (r.data?.union) {
      if (r.data.result?.[0]?.[0] === fakeDB.dbName && !solved.has(2)) onSolve(2, 75)
      if (r.data.result?.length > 0 && r.data.result[0][1]?.includes('S3cr3t') && !solved.has(3)) onSolve(3, 100)
    }
  }

  const url = page === 'home' ? 'http://vuln-shop.local/'
    : page === 'login' ? 'http://vuln-shop.local/login'
    : page === 'search' ? 'http://vuln-shop.local/search'
    : 'http://vuln-shop.local/dashboard'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Cairo', sans-serif" }}>
      {/* Browser Chrome */}
      <div style={{ background: '#1a1a2e', borderBottom: '1px solid #ff3366', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }}/>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }}/>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca41' }}/>
        </div>
        <div style={{ flex: 1, background: '#0d0d1a', border: '1px solid #ff336644', borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#ff6688', fontFamily: 'monospace' }}>
          🔓 {url}
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: '#0d0d1a', borderBottom: '1px solid #1a1a3a', padding: '8px 16px', display: 'flex', gap: '12px' }}>
        {['home','login','search'].map(p => (
          <button key={p} onClick={() => { setPage(p as any); setLoginResult(null); setSearchResult(null) }}
            style={{ background: page === p ? '#ff336622' : 'transparent', border: `1px solid ${page === p ? '#ff3366' : '#1a1a3a'}`, color: page === p ? '#ff3366' : '#888', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>
            {p === 'home' ? '🏠 الرئيسية' : p === 'login' ? '🔐 تسجيل الدخول' : '🔍 البحث'}
          </button>
        ))}
        {loggedIn && (
          <span style={{ marginRight: 'auto', color: '#00ff88', fontSize: 12 }}>👤 {loggedUser?.username}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', background: '#080814' }} dir="rtl">

        {page === 'home' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
            <h2 style={{ color: '#ff3366', fontFamily: 'monospace', marginBottom: 8 }}>VulnShop</h2>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>متجر إلكتروني يحتوي على ثغرات SQL Injection</p>
            <div style={{ display: 'inline-block', background: '#ff336611', border: '1px solid #ff336644', borderRadius: 8, padding: '12px 24px' }}>
              <p style={{ color: '#ff6688', fontSize: 12 }}>⚠️ هذا موقع وهمي للتدريب فقط</p>
              <p style={{ color: '#666', fontSize: 11, marginTop: 4 }}>استخدم تسجيل الدخول والبحث لاستغلال الثغرات</p>
            </div>
          </div>
        )}

        {page === 'login' && (
          <div style={{ maxWidth: 360, margin: '0 auto', paddingTop: 20 }}>
            <h3 style={{ color: '#ff3366', marginBottom: 20, fontFamily: 'monospace' }}>🔐 تسجيل الدخول</h3>
            <div style={{ background: '#0d0d1a', border: '1px solid #1a1a3a', borderRadius: 8, padding: 20 }}>
              <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>اسم المستخدم</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', background: '#080814', border: '1px solid #ff336644', borderRadius: 4, padding: '8px 12px', color: '#ff6688', fontSize: 13, fontFamily: 'monospace', marginBottom: 12, boxSizing: 'border-box' }}
                placeholder="username" dir="ltr" />
              <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', background: '#080814', border: '1px solid #ff336644', borderRadius: 4, padding: '8px 12px', color: '#ff6688', fontSize: 13, fontFamily: 'monospace', marginBottom: 16, boxSizing: 'border-box' }}
                placeholder="password" dir="ltr" />
              <button onClick={handleLogin}
                style={{ width: '100%', background: '#ff3366', color: 'white', border: 'none', borderRadius: 4, padding: '10px', fontFamily: "'Cairo', sans-serif", fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                دخول
              </button>
              {loginResult && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ color: loginResult.success ? '#00ff88' : '#ff4444', fontSize: 13, marginBottom: 6 }}>{loginResult.message}</p>
                  {loginResult.query && (
                    <div style={{ background: '#050508', border: '1px solid #1a1a3a', borderRadius: 4, padding: '8px', marginTop: 6 }}>
                      <p style={{ color: '#444', fontSize: 10, marginBottom: 3 }}>SQL Query:</p>
                      <code style={{ color: '#ffd700', fontSize: 10, wordBreak: 'break-all' }}>{loginResult.query}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ marginTop: 12, background: '#0d0d1a', border: '1px solid #1a1a3a', borderRadius: 6, padding: 12 }}>
              <p style={{ color: '#555', fontSize: 11 }}>💡 الكود في الخادم:</p>
              <code style={{ color: '#4488ff', fontSize: 10, display: 'block', marginTop: 4 }}>
                {`"SELECT * FROM users WHERE username='"+input+"' AND password='"+pw+"'"`}
              </code>
            </div>
          </div>
        )}

        {page === 'search' && (
          <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 20 }}>
            <h3 style={{ color: '#ff3366', marginBottom: 20, fontFamily: 'monospace' }}>🔍 البحث عن منتج</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, background: '#0d0d1a', border: '1px solid #ff336644', borderRadius: 4, padding: '8px 12px', color: '#ff6688', fontSize: 13, fontFamily: 'monospace' }}
                placeholder="ابحث عن منتج..." dir="rtl" />
              <button onClick={handleSearch}
                style={{ background: '#ff3366', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>
                بحث
              </button>
            </div>

            {searchResult && (
              <div>
                <div style={{ background: '#050508', border: '1px solid #1a1a3a', borderRadius: 4, padding: 8, marginBottom: 12 }}>
                  <p style={{ color: '#444', fontSize: 10, marginBottom: 3 }}>SQL Query:</p>
                  <code style={{ color: '#ffd700', fontSize: 10, wordBreak: 'break-all' }}>{searchResult.query}</code>
                </div>
                {searchResult.data?.union ? (
                  <div style={{ background: '#0a2a0a', border: '1px solid #00ff8844', borderRadius: 8, padding: 16 }}>
                    <p style={{ color: '#00ff88', fontSize: 12, marginBottom: 8 }}>🎯 UNION Injection ناجح!</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <tbody>
                        {searchResult.data.result.map((row: string[], i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #0d2a0d' }}>
                            {row.map((cell, j) => (
                              <td key={j} style={{ padding: '6px 10px', color: j === 1 ? '#ff6688' : '#a0ffa0', fontFamily: 'monospace' }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div>
                    {searchResult.data?.products?.length > 0 ? searchResult.data.products.map((p: any) => (
                      <div key={p.id} style={{ background: '#0d0d1a', border: '1px solid #1a1a3a', borderRadius: 6, padding: '10px 14px', marginBottom: 8 }}>
                        <span style={{ color: 'white', fontSize: 13 }}>{p.name}</span>
                        <span style={{ color: '#ff3366', fontSize: 13, float: 'left' }}>${p.price}</span>
                      </div>
                    )) : (
                      <p style={{ color: '#555', fontSize: 13 }}>لا توجد نتائج</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {page === 'dashboard' && (
          <div style={{ textAlign: 'center', paddingTop: 30 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <h2 style={{ color: '#00ff88' }}>مرحباً {loggedUser?.username}!</h2>
            <p style={{ color: '#888', marginTop: 8 }}>دورك: <span style={{ color: '#ffd700' }}>{loggedUser?.role}</span></p>
            <div style={{ marginTop: 20, background: '#0a2a0a', border: '1px solid #00ff8844', borderRadius: 8, padding: '12px 20px', display: 'inline-block' }}>
              <p style={{ color: '#00ff88', fontSize: 13 }}>✅ نجحت في اختراق لوحة التحكم!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== TERMINAL ====================
function Terminal({ onCommand, lines }: { onCommand: (cmd: string) => void; lines: TerminalLine[] }) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines])

  const submit = () => {
    if (!input.trim()) return
    setHistory(h => [input, ...h])
    setHistIdx(-1)
    onCommand(input)
    setInput('')
  }

  const colorMap: Record<TerminalLine['type'], string> = {
    input: '#00ff88',
    output: '#a0c8d8',
    error: '#ff4444',
    success: '#ffd700',
    system: '#666'
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050508', fontFamily: 'monospace' }}
      onClick={() => inputRef.current?.focus()}>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ marginBottom: 3, fontSize: 13, lineHeight: 1.6, color: colorMap[line.type] }}>
            {line.type === 'input' && <span style={{ color: '#ff3366' }}>{'sqli@lab:~$ '}</span>}
            <span style={{ whiteSpace: 'pre-wrap' }}>{line.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop: '1px solid #1a1a3a', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#ff3366', fontSize: 13 }}>sqli@lab:~$</span>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
            if (e.key === 'ArrowUp') { const idx = Math.min(histIdx + 1, history.length - 1); setHistIdx(idx); setInput(history[idx] || '') }
            if (e.key === 'ArrowDown') { const idx = Math.max(histIdx - 1, -1); setHistIdx(idx); setInput(idx === -1 ? '' : history[idx]) }
          }}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#00ff88', fontSize: 13, caretColor: '#00ff88' }}
          autoFocus spellCheck={false} />
        <span style={{ color: '#333', fontSize: 11 }}>↵</span>
      </div>
    </div>
  )
}

// ==================== MAIN LAB ====================
export default function SqlInjectionLab({ onComplete }: { onComplete?: (score: number) => void }) {
  const [stage, setStage] = useState<Stage>('intro')
  const [activeTab, setActiveTab] = useState<TabType>('browser')
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeId>(1)
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: 'system', content: '╔════════════════════════════════════════╗' },
    { type: 'system', content: '║     SQL Injection Lab - CYBERArabi     ║' },
    { type: 'system', content: '╚════════════════════════════════════════╝' },
    { type: 'system', content: '' },
    { type: 'output', content: 'الهدف: http://vuln-shop.local' },
    { type: 'output', content: 'اكتب "help" لرؤية الأوامر المتاحة' },
    { type: 'system', content: '' },
  ])
  const [showHint, setShowHint] = useState(false)

  const addLines = (newLines: TerminalLine[]) => {
    setTerminalLines(prev => [...prev, ...newLines])
  }

  const handleSolve = (id: ChallengeId, points: number) => {
    if (solved.has(id)) return
    setSolved(prev => new Set([...prev, id]))
    setTotalScore(prev => prev + points)
    addLines([
      { type: 'system', content: '' },
      { type: 'success', content: `🎯 تحدي #${id} محلول! +${points} نقطة` },
      { type: 'system', content: '' },
    ])
    if (solved.size + 1 === 4) {
      setTimeout(() => setStage('complete'), 1500)
      onComplete?.(totalScore + points)
    }
  }

  const handleTerminalCommand = (cmd: string) => {
    addLines([{ type: 'input', content: cmd }])
    const c = cmd.trim().toLowerCase()

    if (c === 'help') {
      addLines([
        { type: 'output', content: 'الأوامر المتاحة:' },
        { type: 'output', content: '  scan        — مسح الهدف' },
        { type: 'output', content: '  info        — معلومات عن الهدف' },
        { type: 'output', content: '  challenge   — عرض التحدي الحالي' },
        { type: 'output', content: '  hint        — عرض تلميح' },
        { type: 'output', content: '  score       — نقاطك الحالية' },
        { type: 'output', content: '  next        — التحدي التالي' },
        { type: 'output', content: '  clear       — مسح الشاشة' },
      ])
    } else if (c === 'scan') {
      addLines([
        { type: 'output', content: 'جاري المسح...' },
        { type: 'output', content: '[+] المنفذ 80 مفتوح (HTTP)' },
        { type: 'output', content: '[+] تقنية: PHP + MySQL' },
        { type: 'output', content: '[+] صفحات: /login /search /dashboard' },
        { type: 'success', content: '[!] ثغرة محتملة: SQL Injection في حقول الإدخال' },
      ])
    } else if (c === 'info') {
      addLines([
        { type: 'output', content: 'الهدف: VulnShop v1.0' },
        { type: 'output', content: 'قاعدة البيانات: MySQL' },
        { type: 'output', content: 'الجداول المعروفة: users, products' },
        { type: 'output', content: 'نقطة الضعف: عدم التحقق من المدخلات' },
      ])
    } else if (c === 'challenge') {
      const ch = CHALLENGES.find(c => c.id === currentChallenge)!
      addLines([
        { type: 'output', content: `التحدي ${ch.id}/4: ${ch.title}` },
        { type: 'output', content: ch.description },
        { type: 'output', content: `النقاط: ${ch.points}` },
      ])
    } else if (c === 'hint') {
      const ch = CHALLENGES.find(c => c.id === currentChallenge)!
      addLines([{ type: 'success', content: `💡 ${ch.hint}` }])
    } else if (c === 'score') {
      addLines([
        { type: 'output', content: `النقاط: ${totalScore}` },
        { type: 'output', content: `التحديات المحلولة: ${solved.size}/4` },
      ])
    } else if (c === 'next') {
      if (currentChallenge < 4) {
        setCurrentChallenge(prev => (prev + 1) as ChallengeId)
        addLines([{ type: 'system', content: `انتقلت للتحدي ${currentChallenge + 1}` }])
      } else {
        addLines([{ type: 'output', content: 'هذا هو التحدي الأخير' }])
      }
    } else if (c === 'clear') {
      setTerminalLines([])
    } else if (c.startsWith('sqlmap')) {
      addLines([
        { type: 'error', content: 'sqlmap غير متاح في هذا Lab 😄' },
        { type: 'output', content: 'حاول يدوياً! هذا أفيد للتعلم' },
      ])
    } else {
      addLines([{ type: 'error', content: `الأمر غير معروف: ${cmd}. اكتب "help"` }])
    }
  }

  // ==================== INTRO SCREEN ====================
  if (stage === 'intro') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #050508 0%, #0a0a1a 50%, #0d0515 100%)',
        minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cairo', sans-serif", padding: 24, direction: 'rtl'
      }}>
        <div style={{ maxWidth: 600, width: '100%' }}>
          {/* Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ background: '#ff336622', border: '1px solid #ff3366', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#ff6688' }}>
              🧪 Lab تفاعلي
            </div>
            <div style={{ background: '#ffd70022', border: '1px solid #ffd70066', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#ffd700' }}>
              ⚡ مستوى: مبتدئ-متوسط
            </div>
            <div style={{ background: '#00ff8822', border: '1px solid #00ff8866', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#00ff88' }}>
              🏆 350 نقطة
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'white', marginBottom: 8, lineHeight: 1.2 }}>
            SQL Injection
            <span style={{ display: 'block', color: '#ff3366', fontFamily: 'monospace', fontSize: 28 }}>Lab التفاعلي</span>
          </h1>

          <p style={{ color: '#888', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
            تعلّم أخطر ثغرات قواعد البيانات عبر تجربة حقيقية. ستهاجم موقعاً وهمياً يحتوي على ثغرات SQL Injection حقيقية داخل المتصفح مباشرة.
          </p>

          {/* Challenges Preview */}
          <div style={{ marginBottom: 32 }}>
            {CHALLENGES.map((ch, i) => (
              <div key={ch.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', marginBottom: 8,
                background: '#0d0d1a', border: '1px solid #1a1a3a', borderRadius: 8,
                animation: `fadeIn 0.4s ease ${i * 0.1}s both`
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff336622', border: '1px solid #ff336666', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3366', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {ch.id}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{ch.title}</p>
                  <p style={{ color: '#555', fontSize: 12 }}>{ch.description.slice(0, 60)}...</p>
                </div>
                <span style={{ color: '#ffd700', fontFamily: 'monospace', fontSize: 13 }}>+{ch.points}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setStage('lab')} style={{
            width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ff3366, #cc1144)',
            color: 'white', border: 'none', borderRadius: 10, fontFamily: "'Cairo', sans-serif",
            fontSize: 18, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 0 30px #ff336644', transition: 'all 0.3s'
          }}>
            🚀 ابدأ Lab الآن
          </button>

          <style>{`@keyframes fadeIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }`}</style>
        </div>
      </div>
    )
  }

  // ==================== COMPLETE SCREEN ====================
  if (stage === 'complete') {
    return (
      <div style={{
        background: '#050508', minHeight: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: "'Cairo', sans-serif", direction: 'rtl', padding: 24
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: 'bounce 1s ease infinite' }}>🏆</div>
          <h1 style={{ fontSize: 32, color: '#ffd700', marginBottom: 8 }}>أكملت الـ Lab!</h1>
          <p style={{ color: '#888', marginBottom: 32 }}>نجحت في اختراق جميع التحديات الأربعة</p>
          <div style={{ background: '#0d0d1a', border: '1px solid #ffd70044', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 48, fontWeight: 900, color: '#ffd700', fontFamily: 'monospace' }}>{totalScore}</p>
            <p style={{ color: '#888', marginTop: 4 }}>نقطة مكتسبة</p>
          </div>
          {CHALLENGES.map(ch => (
            <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', marginBottom: 6, background: '#0a2a0a', border: '1px solid #00ff8833', borderRadius: 6 }}>
              <span style={{ color: '#a0ffa0', fontSize: 13 }}>✅ {ch.title}</span>
              <span style={{ color: '#00ff88', fontFamily: 'monospace' }}>+{ch.points}</span>
            </div>
          ))}
<button onClick={() => window.location.href = '/dashboard'}
  style={{
    marginTop: 24, width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #ff3366, #cc1144)',
    color: 'white', border: 'none', borderRadius: 10,
    fontFamily: "'Cairo', sans-serif", fontSize: 16,
    fontWeight: 900, cursor: 'pointer',
    boxShadow: '0 0 20px #ff336644'
  }}>
  ← العودة للداشبورد
</button>
          <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
        </div>
      </div>
    )
  }

  // ==================== LAB SCREEN ====================
  const challenge = CHALLENGES.find(c => c.id === currentChallenge)!

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#050508', fontFamily: "'Cairo', sans-serif", direction: 'rtl'
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#0a0a18', borderBottom: '1px solid #1a1a3a',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {CHALLENGES.map(ch => (
            <button key={ch.id} onClick={() => setCurrentChallenge(ch.id)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: `2px solid ${solved.has(ch.id) ? '#00ff88' : ch.id === currentChallenge ? '#ff3366' : '#1a1a3a'}`,
                background: solved.has(ch.id) ? '#00ff8822' : ch.id === currentChallenge ? '#ff336622' : 'transparent',
                color: solved.has(ch.id) ? '#00ff88' : ch.id === currentChallenge ? '#ff3366' : '#444',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'monospace'
              }}>
              {solved.has(ch.id) ? '✓' : ch.id}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#ffd700', fontFamily: 'monospace', fontSize: 14 }}>⭐ {totalScore}</span>
          <span style={{ color: '#555', fontSize: 12 }}>{solved.size}/4 محلول</span>
        </div>
      </div>

      {/* Challenge Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ff336611, #00000000)',
        borderBottom: '1px solid #ff336633', padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <span style={{ color: '#ff6688', fontSize: 12, fontFamily: 'monospace' }}>التحدي {challenge.id}/4</span>
          <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, marginTop: 2 }}>{challenge.title}</h3>
          <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{challenge.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowHint(!showHint)}
            style={{ background: '#ffd70022', border: '1px solid #ffd70066', color: '#ffd700', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>
            💡 تلميح
          </button>
          {currentChallenge < 4 && (
            <button onClick={() => setCurrentChallenge(prev => (prev + 1) as ChallengeId)}
              style={{ background: '#1a1a3a', border: '1px solid #2a2a4a', color: '#888', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>
              التالي →
            </button>
          )}
        </div>
      </div>

      {showHint && (
        <div style={{ background: '#1a1a00', borderBottom: '1px solid #ffd70033', padding: '10px 20px' }}>
          <p style={{ color: '#ffd700', fontSize: 13 }}>💡 {challenge.hint}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a3a', background: '#080814' }}>
        {(['browser', 'terminal', 'hints'] as TabType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#ff3366' : 'transparent'}`,
              background: 'transparent', color: activeTab === tab ? '#ff3366' : '#555',
              cursor: 'pointer', fontSize: 13, fontFamily: "'Cairo', sans-serif"
            }}>
            {tab === 'browser' ? '🌐 المتصفح' : tab === 'terminal' ? '⌨️ Terminal' : '📖 الشرح'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'browser' && (
          <BrowserSim solved={solved} onSolve={handleSolve} currentChallenge={currentChallenge} />
        )}
        {activeTab === 'terminal' && (
          <Terminal lines={terminalLines} onCommand={handleTerminalCommand} />
        )}
        {activeTab === 'hints' && (
          <div style={{ padding: 24, overflow: 'auto', height: '100%', direction: 'rtl' }}>
            <h3 style={{ color: '#ff3366', marginBottom: 20, fontFamily: 'monospace' }}>📖 كيف تعمل SQL Injection؟</h3>
            <div style={{ background: '#0d0d1a', border: '1px solid #1a1a3a', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <p style={{ color: '#a0c8d8', fontSize: 14, lineHeight: 1.8 }}>
                SQL Injection تحدث عندما يأخذ الكود مدخل المستخدم ويضعه مباشرة في SQL Query بدون تنظيف.
              </p>
              <code style={{ display: 'block', background: '#050508', padding: 12, borderRadius: 6, marginTop: 12, color: '#ffd700', fontSize: 12, direction: 'ltr' }}>
                {"SELECT * FROM users WHERE username='" + "admin' --" + "'"}
              </code>
              <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                الـ -- يعلّق بقية الكود مما يجعل التحقق من كلمة المرور يُهمل
              </p>
            </div>
            {CHALLENGES.map(ch => (
              <div key={ch.id} style={{ background: '#0d0d1a', border: `1px solid ${solved.has(ch.id) ? '#00ff8844' : '#1a1a3a'}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: solved.has(ch.id) ? '#00ff88' : 'white', fontSize: 14, fontWeight: 700 }}>
                    {solved.has(ch.id) ? '✅' : '🔒'} {ch.title}
                  </span>
                  <span style={{ color: '#ffd700', fontFamily: 'monospace', fontSize: 13 }}>+{ch.points}</span>
                </div>
                <p style={{ color: '#888', fontSize: 13 }}>{ch.description}</p>
                {solved.has(ch.id) && (
                  <div style={{ marginTop: 8, background: '#0a200a', border: '1px solid #00ff8833', borderRadius: 4, padding: '6px 10px' }}>
                    <code style={{ color: '#00ff88', fontSize: 12 }}>{ch.solution}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}