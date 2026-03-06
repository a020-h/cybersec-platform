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
  p >= 500 ? { label: 'خبير', color: '#ff6b35', icon: '👑' }
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
      if (!session) { router.push('/login'); return }
      setMyId(session.user.id)

      const { data } = await supabase
        .from('profiles')
        .select('id, username, points, avatar')
        .order('points', { ascending: false })

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

  const rankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg,#2a1a00,#1a1000)', border: '#ffd70066' }
    if (rank === 2) return { bg: 'linear-gradient(135deg,#1a1a2a,#10101a)', border: '#c0c0c066' }
    if (rank === 3) return { bg: 'linear-gradient(135deg,#1a0e0a,#10080a)', border: '#cd7f3266' }
    return { bg: '#0a1520', border: '#1a3a50' }
  }

  const rankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: '#5a7a90', fontFamily: 'monospace', fontSize: '13px' }}>جارٍ تحميل الترتيب...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Cairo',sans-serif;background:#050a0f;color:#e0f0ff;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:#0a1520;}
        ::-webkit-scrollbar-thumb{background:#1a3a50;border-radius:3px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes rankIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        .fade-up{animation:fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) both;}
        .rank-row{transition:all 0.25s;cursor:default;}
        .rank-row:hover{transform:translateX(-4px);filter:brightness(1.08);}
        .podium-card{transition:all 0.3s;}
        .podium-card:hover{transform:translateY(-6px);}
        .filter-btn{transition:all 0.2s;cursor:pointer;font-family:'Cairo',sans-serif;}
        .nav-link{background:none;border:none;color:#7090a8;font-family:'Cairo',sans-serif;font-size:14px;cursor:pointer;transition:color 0.2s;padding:0;}
        .nav-link:hover{color:#00ff88;}
        @media(max-width:768px){
          .podium-row{flex-direction:column!important;align-items:center!important;}
          .podium-card{width:100%!important;max-width:280px!important;}
          .page-pad{padding:80px 16px 40px!important;}
          .rank-meta{display:none!important;}
          .rank-points-big{font-size:14px!important;}
          .lb-header{flex-direction:column!important;gap:12px!important;align-items:flex-start!important;}
          .levels-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,10,15,0.97)', borderBottom: '1px solid #1a3a50', backdropFilter: 'blur(20px)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px' }}>
            🔐 CYBER<span style={{ color: '#7090a8' }}>عربي</span>
          </span>
        </button>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button className="nav-link" onClick={() => router.push('/dashboard')}>الرئيسية</button>
          <button className="nav-link" onClick={() => router.push('/dashboard/ctf')}>CTF</button>
          <button className="nav-link" onClick={() => router.push('/dashboard/profile')}>بروفايل</button>
        </div>
      </nav>

      <div className="page-pad" dir="rtl" style={{ maxWidth: '900px', margin: '0 auto', padding: '90px 24px 60px', opacity: visible ? 1 : 0, transition: 'opacity 0.5s' }}>

        {/* Page header */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0a1520', border: '1px solid #ffd70033', borderRadius: '100px', padding: '5px 16px', marginBottom: '16px' }}>
            <span style={{ animation: 'pulse 2s infinite', color: '#ffd700', fontSize: '10px' }}>●</span>
            <span style={{ color: '#7090a8', fontSize: '12px', fontFamily: 'monospace' }}>تحديث مباشر</span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
            🏆 لوحة <span style={{ color: '#ffd700' }}>المتصدرين</span>
          </h1>
          <p style={{ color: '#5a7a90', fontSize: '15px' }}>أفضل المتعلمين في منصة CYBERعربي</p>
        </div>

        {/* My rank banner */}
        {myRank && (
          <div className="fade-up" style={{ animationDelay: '0.1s', background: 'linear-gradient(135deg,#0f2a1a,#0a1520)', border: '1px solid #00ff8833', borderRadius: '14px', padding: '16px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>
                {myRank <= 3 ? rankIcon(myRank) : '🧑‍💻'}
              </span>
              <div>
                <p style={{ color: '#00ff88', fontWeight: '700', fontSize: '15px' }}>ترتيبك الحالي</p>
                <p style={{ color: '#5a7a90', fontSize: '13px' }}>استمر في التعلم للوصول للقمة!</p>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '32px', fontWeight: '900', color: '#ffd700', lineHeight: 1 }}>#{myRank}</p>
              <p style={{ color: '#5a7a90', fontSize: '12px' }}>من أصل {players.length}</p>
            </div>
          </div>
        )}

        {/* Podium top 3 */}
        {players.length >= 3 && (
          <div className="fade-up" style={{ animationDelay: '0.15s', marginBottom: '32px' }}>
            <div className="podium-row" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', justifyContent: 'center' }}>

              {/* 2nd */}
              <div className="podium-card" style={{ flex: 1, maxWidth: '220px' }}>
                <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#10101a)', border: '1px solid #c0c0c044', borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 8px 30px rgba(192,192,192,0.08)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🥈</div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1a2a3a', border: '2px solid #c0c0c044', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 10px' }}>
                    {players[1]?.avatar || '🧑‍💻'}
                  </div>
                  <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{players[1]?.username || 'مجهول'}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: LEVEL(players[1]?.points || 0).color + '15', borderRadius: '100px', padding: '2px 10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px' }}>{LEVEL(players[1]?.points || 0).icon}</span>
                    <span style={{ color: LEVEL(players[1]?.points || 0).color, fontSize: '11px' }}>{LEVEL(players[1]?.points || 0).label}</span>
                  </div>
                  <p style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '900', color: '#c0c0c0' }}>{players[1]?.points || 0}</p>
                  <p style={{ color: '#5a7a90', fontSize: '11px' }}>نقطة</p>
                </div>
                <div style={{ height: '40px', background: 'linear-gradient(180deg,#c0c0c022,transparent)', borderRadius: '0 0 8px 8px' }} />
              </div>

              {/* 1st */}
              <div className="podium-card" style={{ flex: 1, maxWidth: '240px', marginBottom: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg,#2a1e00,#1a1200)', border: '1px solid #ffd70066', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', boxShadow: '0 12px 40px rgba(255,215,0,0.15)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: 'rgba(255,215,0,0.04)', borderRadius: '50%', filter: 'blur(30px)' }} />
                  <div style={{ fontSize: '44px', marginBottom: '8px', animation: 'float 3s ease-in-out infinite' }}>👑</div>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#2a1e00', border: '2px solid #ffd70066', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 10px' }}>
                    {players[0]?.avatar || '🧑‍💻'}
                  </div>
                  <p style={{ color: 'white', fontWeight: '900', fontSize: '16px', marginBottom: '4px' }}>{players[0]?.username || 'مجهول'}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: LEVEL(players[0]?.points || 0).color + '15', borderRadius: '100px', padding: '2px 10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px' }}>{LEVEL(players[0]?.points || 0).icon}</span>
                    <span style={{ color: LEVEL(players[0]?.points || 0).color, fontSize: '11px' }}>{LEVEL(players[0]?.points || 0).label}</span>
                  </div>
                  <p style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: '900', color: '#ffd700' }}>{players[0]?.points || 0}</p>
                  <p style={{ color: '#a08020', fontSize: '12px' }}>نقطة</p>
                </div>
                <div style={{ height: '60px', background: 'linear-gradient(180deg,#ffd70022,transparent)', borderRadius: '0 0 8px 8px' }} />
              </div>

              {/* 3rd */}
              <div className="podium-card" style={{ flex: 1, maxWidth: '220px' }}>
                <div style={{ background: 'linear-gradient(135deg,#1a0e08,#100808)', border: '1px solid #cd7f3244', borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 8px 30px rgba(205,127,50,0.08)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🥉</div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1a0e08', border: '2px solid #cd7f3244', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 10px' }}>
                    {players[2]?.avatar || '🧑‍💻'}
                  </div>
                  <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{players[2]?.username || 'مجهول'}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: LEVEL(players[2]?.points || 0).color + '15', borderRadius: '100px', padding: '2px 10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px' }}>{LEVEL(players[2]?.points || 0).icon}</span>
                    <span style={{ color: LEVEL(players[2]?.points || 0).color, fontSize: '11px' }}>{LEVEL(players[2]?.points || 0).label}</span>
                  </div>
                  <p style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '900', color: '#cd7f32' }}>{players[2]?.points || 0}</p>
                  <p style={{ color: '#5a7a90', fontSize: '11px' }}>نقطة</p>
                </div>
                <div style={{ height: '20px', background: 'linear-gradient(180deg,#cd7f3222,transparent)', borderRadius: '0 0 8px 8px' }} />
              </div>

            </div>
          </div>
        )}

        {/* Filter + table header */}
        <div className="fade-up lb-header" style={{ animationDelay: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>الترتيب الكامل</h2>
            <p style={{ color: '#5a7a90', fontSize: '12px' }}>{players.length} مشترك</p>
          </div>
          <div style={{ display: 'flex', background: '#080f18', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['all', 'top10'] as const).map(f => (
              <button key={f} className="filter-btn" onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                  background: filter === f ? '#0f2a1a' : 'transparent',
                  color: filter === f ? '#00ff88' : '#5a7a90',
                  border: filter === f ? '1px solid #00ff8822' : '1px solid transparent'
                }}>
                {f === 'all' ? 'الكل' : 'أفضل 10'}
              </button>
            ))}
          </div>
        </div>

        {/* Player rows */}
        <div className="fade-up" style={{ animationDelay: '0.25s' }}>
          {displayed.map((player, i) => {
            const rs = rankStyle(player.rank || i + 1)
            const lv = LEVEL(player.points)
            const isMe = player.id === myId
            const topProgress = players[0]?.points ? Math.round((player.points / players[0].points) * 100) : 0

            return (
              <div key={player.id} className="rank-row"
                style={{
                  background: isMe ? 'linear-gradient(135deg,#0f2a1a,#0a1520)' : rs.bg,
                  border: `1px solid ${isMe ? '#00ff8844' : rs.border}`,
                  borderRadius: '12px', padding: '14px 20px', marginBottom: '10px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  boxShadow: isMe ? '0 0 20px rgba(0,255,136,0.08)' : 'none',
                  animation: `rankIn 0.4s cubic-bezier(0.4,0,0.2,1) ${i * 0.04}s both`
                }}>

                {/* Rank */}
                <div style={{ width: '36px', textAlign: 'center', flexShrink: 0 }}>
                  {(player.rank || i + 1) <= 3 ? (
                    <span style={{ fontSize: '22px' }}>{rankIcon(player.rank || i + 1)}</span>
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: isMe ? '#00ff88' : '#3a5a70' }}>
                      #{player.rank || i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0f1f30', border: `2px solid ${isMe ? '#00ff8844' : '#1a3a50'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {player.avatar || '🧑‍💻'}
                </div>

                {/* Name + progress bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: isMe ? '#00ff88' : 'white', fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.username || 'مجهول'}
                    </span>
                    {isMe && (
                      <span style={{ background: '#00ff8822', border: '1px solid #00ff8833', borderRadius: '100px', padding: '1px 8px', color: '#00ff88', fontSize: '10px', flexShrink: 0 }}>أنت</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '3px', background: '#0f1f30', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '3px', borderRadius: '2px', background: `linear-gradient(90deg,${lv.color},${lv.color}88)`, width: `${topProgress}%`, transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ color: '#3a5a70', fontSize: '10px', fontFamily: 'monospace', flexShrink: 0 }}>{topProgress}%</span>
                  </div>
                </div>

                {/* Level badge */}
                <div className="rank-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: lv.color + '12', border: `1px solid ${lv.color}22`, borderRadius: '100px', padding: '4px 12px' }}>
                  <span style={{ fontSize: '12px' }}>{lv.icon}</span>
                  <span style={{ color: lv.color, fontSize: '12px', fontWeight: '700' }}>{lv.label}</span>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p className="rank-points-big" style={{
                    fontFamily: 'monospace', fontSize: '18px', fontWeight: '900',
                    color: isMe ? '#00ff88'
                      : (player.rank || i + 1) === 1 ? '#ffd700'
                      : (player.rank || i + 1) === 2 ? '#c0c0c0'
                      : (player.rank || i + 1) === 3 ? '#cd7f32'
                      : '#7090a8'
                  }}>
                    {player.points}
                  </p>
                  <p style={{ color: '#3a5a70', fontSize: '10px' }}>نقطة</p>
                </div>

              </div>
            )
          })}

          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#3a5a70' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏜️</p>
              <p style={{ fontFamily: 'monospace' }}>لا يوجد مستخدمون بعد</p>
            </div>
          )}
        </div>

        {/* Level guide */}
        <div className="fade-up" style={{ animationDelay: '0.35s', marginTop: '40px', background: '#0a1520', border: '1px solid #1a3a50', borderRadius: '14px', padding: '20px 24px' }}>
          <p style={{ color: '#7090a8', fontFamily: 'monospace', fontSize: '12px', marginBottom: '14px' }}>// دليل المستويات</p>
          <div className="levels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {[
              { icon: '🌱', label: 'مبتدئ', color: '#00ff88', range: '0 — 49' },
              { icon: '🔥', label: 'متوسط', color: '#00d4ff', range: '50 — 199' },
              { icon: '⚡', label: 'متقدم', color: '#a855f7', range: '200 — 499' },
              { icon: '👑', label: 'خبير',  color: '#ff6b35', range: '500+' },
            ].map((lv, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: '#080f18', borderRadius: '10px', border: `1px solid ${lv.color}22` }}>
                <span style={{ fontSize: '20px' }}>{lv.icon}</span>
                <p style={{ color: lv.color, fontWeight: '700', fontSize: '13px', marginTop: '6px' }}>{lv.label}</p>
                <p style={{ color: '#3a5a70', fontFamily: 'monospace', fontSize: '11px' }}>{lv.range}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}