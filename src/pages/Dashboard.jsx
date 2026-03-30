import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import { BarChart2 } from 'lucide-react'

const EXPENSE_CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_CATEGORY_COLORS = { food: '#4AAFDC', medical: '#F87171', supplies: '#34D399', other: '#A78BFA' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [recentExpenses, setRecentExpenses] = useState([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const expQ = query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(3))
        const snap = await getDocs(expQ)
        const expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setRecentExpenses(expenses)

        const now = new Date()
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const allExp = query(collection(db, 'expenses'), orderBy('date', 'desc'))
        const allSnap = await getDocs(allExp)
        const total = allSnap.docs
          .map(d => d.data())
          .filter(d => d.date >= monthStart)
          .reduce((sum, d) => sum + (d.amount || 0), 0)
        setMonthTotal(total)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-4 space-y-4">
      {/* Cat Hero Card */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4AAFDC] to-[#B0D8EE] flex items-center justify-center text-3xl flex-shrink-0">
            🐱
          </div>
          <div>
            <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">嬛嬛</h1>
            <p className="text-sm text-[#7BAEC8]">本月花費</p>
            <p className="font-['Caveat'] text-xl font-bold text-[#3A7EA0]">
              ${monthTotal.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="ml-auto p-2 rounded-xl text-[#7BAEC8] hover:bg-[#F2F9FC] transition-colors cursor-pointer"
            aria-label="查看報表"
          >
            <BarChart2 size={22} />
          </button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '品牌', emoji: '🏷️', to: '/brands' },
          { label: '健康', emoji: '❤️', to: '/health' },
          { label: '照片', emoji: '📷', to: '/photos' },
        ].map(({ label, emoji, to }) => (
          <Card key={to} className="p-3 text-center" onClick={() => navigate(to)}>
            <div className="text-2xl mb-1">{emoji}</div>
            <p className="text-xs text-[#7BAEC8] font-medium">{label}</p>
          </Card>
        ))}
      </div>

      {/* Recent Expenses */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-['Caveat'] text-lg font-semibold text-[#1A4F6E]">最近花費</h2>
          <button
            onClick={() => navigate('/expenses')}
            className="text-xs text-[#3A7EA0] font-medium cursor-pointer"
          >
            查看全部
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-[#7BAEC8]">還沒有花費紀錄</p>
            <button
              onClick={() => navigate('/expenses/new')}
              className="mt-2 text-sm text-[#4AAFDC] font-semibold cursor-pointer"
            >
              新增第一筆
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map(exp => (
              <Card key={exp.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: CAT_CATEGORY_COLORS[exp.category] || '#7BAEC8' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A4F6E] truncate">{exp.name}</p>
                  <p className="text-xs text-[#7BAEC8]">{EXPENSE_CATEGORIES[exp.category]} · {exp.date}</p>
                </div>
                <p className="font-['Caveat'] text-lg font-bold text-[#3A7EA0] flex-shrink-0">
                  ${exp.amount?.toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-['Caveat'] text-lg font-semibold text-[#1A4F6E] mb-2">快速新增</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '記帳', to: '/expenses/new', color: '#4AAFDC' },
            { label: '飲食', to: '/diet/new', color: '#34D399' },
            { label: '健康', to: '/health/new', color: '#F87171' },
            { label: '照片', to: '/photos/new', color: '#A78BFA' },
          ].map(({ label, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="py-3 rounded-2xl text-white font-semibold text-sm cursor-pointer transition-opacity active:opacity-80"
              style={{ background: color }}
            >
              + {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
