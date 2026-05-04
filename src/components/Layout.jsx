import { NavLink, Outlet } from 'react-router-dom'
import NavIcon from './NavIcon'

const navItems = [
  { to: '/', k: 'home', label: '首頁', col: '#FF92AE' },
  { to: '/brands', k: 'brand', label: '品牌', col: '#F5C04D' },
  { to: '/expenses', k: 'spend', label: '花費', col: '#FFA877' },
  { to: '/health', k: 'health', label: '健康', col: '#7FCCA6' },
  { to: '/shopping', k: 'list', label: '清單', col: '#B594D9' },
]

// Decorative sparkle/heart helpers
function Sparkle({ x, y, size = 12, color = '#F5C04D', rotate = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" fill={color} />
    </svg>
  )
}
function Dot({ x, y, size = 5, color = '#FFA877' }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: 999, background: color, pointerEvents: 'none' }} />
}

export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh relative" style={{ background: '#FFF9F2' }}>
      {/* Decorative sprinkles */}
      <Dot x={28} y={70} size={5} color="#FFC8D6" />
      <Dot x="calc(100vw - 28px)" y={120} size={5} color="#F5C04D" />
      <Dot x={20} y={220} size={4} color="#7FCCA6" />
      <Dot x="calc(100vw - 20px)" y={300} size={5} color="#B594D9" />
      <Sparkle x="calc(100vw - 32px)" y={50} size={11} color="#F5C04D" rotate={15} />
      <Sparkle x={20} y={420} size={9} color="#FF92AE" rotate={-10} />

      {/* Top Bar */}
      <header className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,249,242,0.9)', backdropFilter: 'blur(12px)' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', lineHeight: 1, fontWeight: 600 }}>hi! ♡</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 22, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 2 }}>
            嬛嬛日記
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 pb-28 overflow-y-auto relative z-10">
        <Outlet />
      </main>

      {/* Bottom Nav — sticker style with chunky border */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-2" style={{ background: 'linear-gradient(to top, #FFF9F2 60%, transparent)' }}>
        <div
          className="flex justify-between items-center"
          style={{
            background: '#FFFFFF',
            borderRadius: 28,
            padding: '8px 6px',
            border: '2px solid #3D2A2A',
            boxShadow: '0 4px 0 #3D2A2A, 0 8px 22px rgba(61,42,42,0.15)',
          }}
        >
          {navItems.map(({ to, k, label, col }) => (
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
                    borderRadius: 18,
                    background: isActive ? col : 'transparent',
                    transition: 'background 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <NavIcon k={k} color={isActive ? '#FFFFFF' : col} active={isActive} />
                  <div style={{
                    fontFamily: "'Fredoka', system-ui",
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? '#FFFFFF' : '#7A5C5C',
                  }}>{label}</div>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
