'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Player = {
  id: string
  username: string
  points: number
  avatar: string
  rank?: number
}

const LEVEL = (p: number) =>
  p >= 500 ? { label: 'خبير',  color: '#ff6b35', icon: '👑' }
  : p >= 200 ? { label: 'متقدم', color: '#a855f7', icon: '⚡' }
  : p >= 50  ? { label: 'متوسط', color: '#00d4ff', icon: '🔥' }
  :            { label: 'مبتدئ', color: '#00ff88', icon: '🌱' }

export default function LeaderboardPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'top10'>('all')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      setMyId(session.user.id)
      const { data } = await supabase.from('profiles').select('id, username, points, avatar').order('points', { ascending: false })
      if (data) {
        const ranked = data.map((p, i) => ({ ...p, rank: i + 1 }))
        setPlayers(ranked)
        const me = ranked.findIndex(p => p.id === session.user.id)
        if (me !== -1) setMyRank(me + 1)
      }
      setLoading(false)
      setTimeout(() => setVisible(true), 80)
    }
    init()
  }, [])

  const displayed = filter === 'top10' ? players.slice(0, 10) : players

  const rankIcon = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff8815', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#ffd700', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: '10px', border: '2px solid transparent', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }}></div>
      </div>
      <p style={{ color: '#7090a8', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '2px' }}>LOADING...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; list-style:none; }
        body { font-family:'Cairo',sans-serif; background:#050a0f; color:#e0f0ff; overflow-x:hidden; }

        .bg-grid { position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image: linear-gradient(rgba(255,215,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.02) 1px, transparent 1px);
          background-size:50px 50px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent); }
        .bg-glow-top { position:fixed; top:-200px; left:50%; transform:translateX(-50%); width:700px; height:400px; background:radial-gradient(ellipse, rgba(255,215,0,0.06) 0%, transparent 70%); pointer-events:none; z-index:0; }
        .bg-glow-me { position:fixed; bottom:-100px; right:-100px; width:400px; height:400px; background:radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%); pointer-events:none; z-index:0; }

        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#050a0f; } ::-webkit-scrollbar-thumb { background:#1a3a50; border-radius:10px; }

        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes rankIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

        .fade-up { animation:fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
        .rank-row { transition:all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .rank-row:hover { transform:translateX(-5px); filter:brightness(1.07); }
        .podium-card { transition:all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .podium-card:hover { transform:translateY(-8px); }
        .nav-link { background:none; border:none; color:#7090a8; font-family:'Cairo',sans-serif; font-size:14px; cursor:pointer; transition:all 0.2s; padding:4px 8px; border-radius:6px; }
        .nav-link:hover { color:#00ff88; background:rgba(0,255,136,0.06); }
        .filter-btn { transition:all 0.25s; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:700; border:1px solid transparent; border-radius:8px; padding:7px 16px; font-size:13px; }

        @media (max-width:768px) {
          .podium-row { flex-direction:column !important; align-items:center !important; }
          .podium-card { width:100% !important; max-width:280px !important; }
          .page-pad { padding:80px 16px 40px !important; }
          .rank-meta { display:none !important; }
          .lb-header { flex-direction:column !important; gap:12px !important; align-items:flex-start !important; }
          .levels-grid { grid-template-columns:repeat(2,1fr) !important; }
          .navbar { padding:0 16px !important; }
        }
      `}</style>

      <div className="bg-grid"></div>
      <div className="bg-glow-top"></div>
      <div className="bg-glow-me"></div>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,10,15,0.88)', borderBottom: '1px solid rgba(26,58,80,0.7)', backdropFilter: 'blur(24px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }} className="navbar">
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔐</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px', textShadow: '0 0 20px rgba(0,255,136,0.4)' }}>CYBER</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: '700', color: '#7090a8', letterSpacing: '2px' }}>عربي</span>
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { label: 'الرئيسية', path: '/dashboard' },
            { label: 'CTF', path: '/dashboard/ctf' },
            { label: 'بروفايل', path: '/dashboard/profile' },
          ].map(item => (
            <button key={item.path} className="nav-link" onClick={() => router.push(item.path)}>{item.label}</button>
          ))}
        </div>
      </nav>

      <div dir="rtl" className="page-pad" style={{ maxWidth: '900px', margin: '0 auto', padding: '90px 24px 60px', position: 'relative', zIndex: 1, opacity: visible ? 1 : 0, transition: 'opacity 0.5s' }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '100px', padding: '5px 16px', marginBottom: '18px' }}>
            <span style={{ animation: 'pulse 2s infinite', color: '#ffd700', fontSize: '9px' }}>●</span>
            <span style={{ color: 'rgba(255,215,0,0.6)', fontSize: '12px', fontFamily: 'Space Mono, monospace', letterSpacing: '1px' }}>LIVE RANKING</span>
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: '900', color: 'white', marginBottom: '10px', lineHeight: '1.1' }}>
            🏆 لوحة{' '}
            <span style={{ color: '#ffd700', textShadow: '0 0 40px rgba(255,215,0,0.4)' }}>المتصدرين</span>
          </h1>
          <p style={{ color: '#7090a8', fontSize: '15px' }}>أفضل المتعلمين في منصة CYBERعربي</p>
        </div>

        {/* My rank banner */}
        {myRank && (
          <div className="fade-up" style={{ animationDelay: '0.08s', background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,136,0.03))', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '16px', padding: '18px 28px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '2px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                {myRank <= 3 ? rankIcon(myRank) : '🧑‍💻'}
              </div>
              <div>
                <p style={{ color: '#00ff88', fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>ترتيبك الحالي</p>
                <p style={{ color: '#7090a8', fontSize: '13px' }}>واصل التعلم للوصول للقمة! 🚀</p>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '36px', fontWeight: '700', color: '#00ff88', lineHeight: 1, textShadow: '0 0 30px rgba(0,255,136,0.4)' }}>#{myRank}</p>
              <p style={{ color: '#7090a8', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>من {players.length} مشترك</p>
            </div>
          </div>
        )}

        {/* Podium */}
        {players.length >= 3 && (
          <div className="fade-up" style={{ animationDelay: '0.12s', marginBottom: '36px' }}>
            <div className="podium-row" style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', justifyContent: 'center' }}>

              {/* 2nd place */}
              <div className="podium-card" style={{ flex: 1, maxWidth: '220px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(192,192,192,0.08), rgba(10,15,26,0.95))', border: '1px solid rgba(192,192,192,0.2)', borderRadius: '18px', padding: '22px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(192,192,192,0.5), transparent)' }}></div>
                  <div style={{ fontSize: '38px', marginBottom: '10px' }}>🥈</div>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#1a2a3a', border: '2px solid rgba(192,192,192,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>
                    {players[1]?.avatar || '🧑‍💻'}
                  </div>
                  <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{players[1]?.username || 'مجهول'}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${LEVEL(players[1]?.points || 0).color}15`, border: `1px solid ${LEVEL(players[1]?.points || 0).color}25`, borderRadius: '100px', padding: '3px 10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px' }}>{LEVEL(players[1]?.points || 0).icon}</span>
                    <span style={{ color: LEVEL(players[1]?.points || 0).color, fontSize: '11px', fontWeight: '700' }}>{LEVEL(players[1]?.points || 0).label}</span>
                  </div>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '22px', fontWeight: '700', color: '#c0c0c0' }}>{players[1]?.points || 0}</p>
                  <p style={{ color: '#7090a8', fontSize: '11px' }}>نقطة</p>
                </div>
                <div style={{ height: '36px', background: 'linear-gradient(180deg, rgba(192,192,192,0.08), transparent)', borderRadius: '0 0 8px 8px' }}></div>
              </div>

              {/* 1st place */}
              <div className="podium-card" style={{ flex: 1, maxWidth: '250px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(20,14,0,0.95))', border: '1px solid rgba(255,215,0,0.35)', borderRadius: '18px', padding: '26px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 0 60px rgba(255,215,0,0.12)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.8), transparent)' }}></div>
                  <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                  <div style={{ fontSize: '46px', marginBottom: '10px', animation: 'float 3s ease-in-out infinite' }}>👑</div>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,215,0,0.1)', border: '2px solid rgba(255,215,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px', boxShadow: '0 0 20px rgba(255,215,0,0.2)' }}>
                    {players[0]?.avatar || '🧑‍💻'}
                  </div>
                  <p style={{ color: 'white', fontWeight: '900', fontSize: '16px', marginBottom: '8px' }}>{players[0]?.username || 'مجهول'}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${LEVEL(players[0]?.points || 0).color}15`, border: `1px solid ${LEVEL(players[0]?.points || 0).color}30`, borderRadius: '100px', padding: '3px 12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px' }}>{LEVEL(players[0]?.points || 0).icon}</span>
                    <span style={{ color: LEVEL(players[0]?.points || 0).color, fontSize: '12px', fontWeight: '700' }}>{LEVEL(players[0]?.points || 0).label}</span>
                  </div>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '30px', fontWeight: '700', color: '#ffd700', textShadow: '0 0 30px rgba(255,215,0,0.5)' }}>{players[0]?.points || 0}</p>
                  <p style={{ color: 'rgba(255,215,0,0.5)', fontSize: '12px' }}>نقطة</p>
                </div>
                <div style={{ height: '56px', background: 'linear-gradient(180deg, rgba(255,215,0,0.1), transparent)', borderRadius: '0 0 8px 8px' }}></div>
              </div>

              {/* 3rd place */}
              <div className="podium-card" style={{ flex: 1, maxWidth: '220px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(205,127,50,0.08), rgba(10,8,6,0.95))', border: '1px solid rgba(205,127,50,0.2)', borderRadius: '18px', padding: '22px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(205,127,50,0.5), transparent)' }}></div>
                  <div style={{ fontSize: '38px', marginBottom: '10px' }}>🥉</div>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#1a0e08', border: '2px solid rgba(205,127,50,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>
                    {players[2]?.avatar || '🧑‍💻'}
                  </div>
                  <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{players[2]?.username || 'مجهول'}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${LEVEL(players[2]?.points || 0).color}15`, border: `1px solid ${LEVEL(players[2]?.points || 0).color}25`, borderRadius: '100px', padding: '3px 10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px' }}>{LEVEL(players[2]?.points || 0).icon}</span>
                    <span style={{ color: LEVEL(players[2]?.points || 0).color, fontSize: '11px', fontWeight: '700' }}>{LEVEL(players[2]?.points || 0).label}</span>
                  </div>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '22px', fontWeight: '700', color: '#cd7f32' }}>{players[2]?.points || 0}</p>
                  <p style={{ color: '#7090a8', fontSize: '11px' }}>نقطة</p>
                </div>
                <div style={{ height: '18px', background: 'linear-gradient(180deg, rgba(205,127,50,0.08), transparent)', borderRadius: '0 0 8px 8px' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Filter + header */}
        <div className="fade-up lb-header" style={{ animationDelay: '0.18s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '2px' }}>الترتيب الكامل</h2>
            <p style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>{players.length} PLAYERS</p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(8,15,24,0.8)', border: '1px solid #1a3a50', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {(['all', 'top10'] as const).map(f => (
              <button key={f} className="filter-btn" onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'rgba(0,255,136,0.12)' : 'transparent',
                  color: filter === f ? '#00ff88' : '#7090a8',
                  borderColor: filter === f ? 'rgba(0,255,136,0.25)' : 'transparent',
                }}>
                {f === 'all' ? 'الكل' : 'أفضل 10'}
              </button>
            ))}
          </div>
        </div>

        {/* Player rows */}
        <div className="fade-up" style={{ animationDelay: '0.22s' }}>
          {displayed.map((player, i) => {
            const lv = LEVEL(player.points)
            const isMe = player.id === myId
            const rank = player.rank || i + 1
            const topProgress = players[0]?.points ? Math.round((player.points / players[0].points) * 100) : 0
            const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : isMe ? '#00ff88' : '#7090a8'

            return (
              <div key={player.id} className="rank-row"
                style={{
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(0,255,136,0.07), rgba(0,255,136,0.03))'
                    : rank === 1 ? 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(10,15,10,0.95))'
                    : rank === 2 ? 'linear-gradient(135deg, rgba(192,192,192,0.04), rgba(10,10,20,0.95))'
                    : rank === 3 ? 'linear-gradient(135deg, rgba(205,127,50,0.05), rgba(10,8,6,0.95))'
                    : 'rgba(10,21,32,0.6)',
                  border: `1px solid ${isMe ? 'rgba(0,255,136,0.25)' : rank <= 3 ? rankColor + '25' : '#1a3a50'}`,
                  borderRadius: '14px',
                  padding: '14px 20px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: isMe ? '0 0 30px rgba(0,255,136,0.06)' : rank === 1 ? '0 0 30px rgba(255,215,0,0.05)' : 'none',
                  animation: `rankIn 0.4s cubic-bezier(0.4,0,0.2,1) ${i * 0.035}s both`,
                  backdropFilter: 'blur(8px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>

                {/* Left accent for top 3 */}
                {rank <= 3 && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: `linear-gradient(180deg, transparent, ${rankColor}60, transparent)`, borderRadius: '0 14px 14px 0' }}></div>}

                {/* Rank number */}
                <div style={{ width: '38px', textAlign: 'center', flexShrink: 0 }}>
                  {rank <= 3 ? (
                    <span style={{ fontSize: '24px' }}>{rankIcon(rank)}</span>
                  ) : (
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: '700', color: isMe ? '#00ff88' : '#3a5a70' }}>#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isMe ? 'rgba(0,255,136,0.08)' : '#0f1f30', border: `2px solid ${isMe ? 'rgba(0,255,136,0.3)' : rank <= 3 ? rankColor + '30' : '#1a3a50'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {player.avatar || '🧑‍💻'}
                </div>

                {/* Name + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: isMe ? '#00ff88' : rank <= 3 ? 'white' : '#c0d8e8', fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.username || 'مجهول'}
                    </span>
                    {isMe && (
                      <span style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '100px', padding: '1px 8px', color: '#00ff88', fontSize: '10px', flexShrink: 0, fontFamily: 'Space Mono, monospace' }}>أنت</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '3px', background: '#0a1520', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '3px', borderRadius: '2px', background: `linear-gradient(90deg, ${lv.color}, ${lv.color}55)`, width: `${topProgress}%`, transition: 'width 1.2s ease', boxShadow: topProgress > 50 ? `0 0 6px ${lv.color}66` : 'none' }}></div>
                    </div>
                    <span style={{ color: '#3a5a70', fontSize: '10px', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{topProgress}%</span>
                  </div>
                </div>

                {/* Level badge */}
                <div className="rank-meta" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: `${lv.color}10`, border: `1px solid ${lv.color}20`, borderRadius: '100px', padding: '5px 14px', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px' }}>{lv.icon}</span>
                  <span style={{ color: lv.color, fontSize: '12px', fontWeight: '700' }}>{lv.label}</span>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '60px' }}>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', color: rankColor, textShadow: rank <= 3 || isMe ? `0 0 16px ${rankColor}44` : 'none' }}>{player.points}</p>
                  <p style={{ color: '#3a5a70', fontSize: '10px', fontFamily: 'Space Mono, monospace' }}>pts</p>
                </div>
              </div>
            )
          })}

          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#3a5a70' }}>
              <p style={{ fontSize: '48px', marginBottom: '14px' }}>🏜️</p>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px' }}>لا يوجد مستخدمون بعد</p>
            </div>
          )}
        </div>

        {/* Level guide */}
        <div className="fade-up" style={{ animationDelay: '0.32s', marginTop: '36px', background: 'rgba(10,21,32,0.7)', border: '1px solid #1a3a50', borderRadius: '16px', padding: '22px 26px', backdropFilter: 'blur(10px)' }}>
          <p style={{ color: '#7090a8', fontFamily: 'Space Mono, monospace', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px' }}>// LEVEL GUIDE</p>
          <div className="levels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {[
              { icon: '🌱', label: 'مبتدئ', color: '#00ff88', range: '0 — 49' },
              { icon: '🔥', label: 'متوسط', color: '#00d4ff', range: '50 — 199' },
              { icon: '⚡', label: 'متقدم', color: '#a855f7', range: '200 — 499' },
              { icon: '👑', label: 'خبير',  color: '#ff6b35', range: '500+' },
            ].map((lv, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '14px 8px', background: `${lv.color}06`, borderRadius: '12px', border: `1px solid ${lv.color}20`, transition: 'all 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${lv.color}12`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = `${lv.color}06`; e.currentTarget.style.transform = 'none' }}>
                <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>{lv.icon}</span>
                <p style={{ color: lv.color, fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{lv.label}</p>
                <p style={{ color: '#3a5a70', fontFamily: 'Space Mono, monospace', fontSize: '10px' }}>{lv.range}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}