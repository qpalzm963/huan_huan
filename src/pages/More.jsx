import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import { UtensilsCrossed, Camera, BarChart2, ShoppingCart } from 'lucide-react'

const items = [
  { icon: ShoppingCart, label: '購物清單', sub: '記錄預計購買的項目', to: '/shopping', color: '#F97316' },
  { icon: UtensilsCrossed, label: '飲食日誌', sub: '記錄每天吃了什麼', to: '/diet', color: '#34D399' },
  { icon: Camera, label: '照片日記', sub: '記錄嬛嬛的可愛瞬間', to: '/photos', color: '#A78BFA' },
  { icon: BarChart2, label: '報表', sub: '花費統計與體重趨勢', to: '/reports', color: '#4AAFDC' },
]

export default function More() {
  const navigate = useNavigate()
  return (
    <div className="p-4">
      <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E] mb-4">更多功能</h1>
      <div className="space-y-3">
        {items.map(({ icon: Icon, label, sub, to, color }) => (
          <Card key={to} className="px-4 py-4 flex items-center gap-4" onClick={() => navigate(to)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-[#1A4F6E] text-sm">{label}</p>
              <p className="text-xs text-[#7BAEC8]">{sub}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
