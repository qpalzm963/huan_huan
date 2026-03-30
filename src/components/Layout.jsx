import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Tag, Wallet, Heart, ShoppingCart } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: '首頁' },
  { to: '/brands', icon: Tag, label: '品牌' },
  { to: '/expenses', icon: Wallet, label: '花費' },
  { to: '/health', icon: Heart, label: '健康' },
  { to: '/shopping', icon: ShoppingCart, label: '清單' },
]

export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-[#F2F9FC]">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#B0D8EE] px-4 py-3 flex items-center justify-between">
        <span className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">嬛嬛日記</span>
      </header>

      {/* Page Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-[#B0D8EE]">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[#1A4F6E]'
                    : 'text-[#7BAEC8]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#B0D8EE]' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
