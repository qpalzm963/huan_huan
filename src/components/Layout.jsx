import { NavLink, Outlet } from 'react-router-dom'
import NavIcon from './NavIcon'

const navItems = [
  { to: '/', k: 'home', label: '首頁' },
  { to: '/brands', k: 'brand', label: '品牌' },
  { to: '/expenses', k: 'spend', label: '花費' },
  { to: '/health', k: 'health', label: '健康' },
  { to: '/shopping', k: 'list', label: '清單' },
]

export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh relative" style={{ background: '#FBF6F1' }}>
      {/* Soft glow */}
      <div style={{
        position: 'fixed', top: -180, left: -80, width: 480, height: 480,
        background: 'radial-gradient(circle, oklch(0.94 0.04 20) 0%, transparent 65%)',
        opacity: 0.7, pointerEvents: 'none', filter: 'blur(8px)', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: 60, right: -120, width: 320, height: 320,
        background: 'radial-gradient(circle, oklch(0.88 0.05 15) 0%, transparent 70%)',
        opacity: 0.18, pointerEvents: 'none', filter: 'blur(12px)', zIndex: 0,
      }} />

      {/* Top Bar */}
      <header className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(251,246,241,0.85)', backdropFilter: 'blur(12px)' }}>
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em]" style={{ color: '#B5A3A3' }}>HUAN's DIARY</div>
          <div className="font-display text-xl" style={{ color: '#3A2E2E', letterSpacing: '-0.01em' }}>
            嬛嬛 <span className="" style={{ color: '#6E5A5A', fontWeight: 400 }}>日記</span>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 pb-24 overflow-y-auto relative z-10">
        <Outlet />
      </main>

      {/* Bottom Nav — floating rounded card */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-2" style={{ background: 'linear-gradient(to top, #FBF6F1 60%, transparent)' }}>
        <div
          className="flex justify-between items-center"
          style={{
            background: '#FFFFFF',
            borderRadius: 28,
            padding: '8px 6px',
            boxShadow: '0 8px 24px rgba(58,46,46,0.10), 0 2px 6px rgba(58,46,46,0.06)',
          }}
        >
          {navItems.map(({ to, k, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1"
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <div
                  style={{
                    padding: '8px 4px',
                    borderRadius: 20,
                    background: isActive ? 'oklch(0.88 0.05 15)' : 'transparent',
                    transition: 'background 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <NavIcon k={k} color={isActive ? '#3A2E2E' : '#6E5A5A'} />
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: isActive ? '#3A2E2E' : '#6E5A5A' }}>{label}</div>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
