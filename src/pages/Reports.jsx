import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Card from '../components/Card'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = { food: '#4AAFDC', medical: '#F87171', supplies: '#34D399', other: '#A78BFA' }

function monthLabel(dateStr) {
  const [y, m] = dateStr.split('-')
  return `${m}月`
}

export default function Reports() {
  const [expenses, setExpenses] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [expSnap, healthSnap] = await Promise.all([
        getDocs(query(collection(db, 'expenses'), orderBy('date'))),
        getDocs(query(collection(db, 'health'), orderBy('date'))),
      ])
      setExpenses(expSnap.docs.map(d => d.data()))
      setWeights(healthSnap.docs.map(d => d.data()).filter(d => d.type === 'weight'))
      setLoading(false)
    }
    load()
  }, [])

  // Monthly expense by category (last 6 months)
  const monthlyData = (() => {
    const map = {}
    expenses.forEach(e => {
      const month = e.date?.slice(0, 7)
      if (!month) return
      if (!map[month]) map[month] = { month, food: 0, medical: 0, supplies: 0, other: 0 }
      map[month][e.category] = (map[month][e.category] || 0) + (e.amount || 0)
    })
    return Object.values(map).slice(-6).map(d => ({ ...d, label: monthLabel(d.month) }))
  })()

  // Category total
  const catTotals = (() => {
    const map = { food: 0, medical: 0, supplies: 0, other: 0 }
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + (e.amount || 0) })
    return Object.entries(map).map(([cat, total]) => ({ cat, label: CATEGORIES[cat], total }))
  })()

  const weightData = weights.slice(-10).map(w => ({ date: w.date?.slice(5), weight: w.weight }))
  const totalSpend = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  if (loading) return (
    <div className="p-4 space-y-3 min-h-full" style={{ background: '#F5F0EB' }}>
      {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />)}
    </div>
  )

  return (
    <div className="p-4 space-y-4 min-h-full" style={{ background: '#F5F0EB' }}>
      <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">報表</h1>

      {/* Total */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#7BAEC8] font-medium">累計總花費</p>
          <p className="font-['Caveat'] text-3xl font-bold text-[#1A4F6E]">${totalSpend.toLocaleString()}</p>
        </div>
        <div className="text-4xl">💙</div>
      </Card>

      {/* Monthly bar chart */}
      <Card className="p-4">
        <p className="font-['Caveat'] text-lg font-semibold text-[#1A4F6E] mb-3">月花費趨勢</p>
        {monthlyData.length === 0 ? (
          <p className="text-sm text-[#7BAEC8] text-center py-6">尚無資料</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0F0F8" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7BAEC8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#7BAEC8' }} />
              <Tooltip formatter={(v, name) => [`$${v}`, CATEGORIES[name] || name]} contentStyle={{ borderRadius: 12, border: '1px solid #B0D8EE', fontSize: 12 }} />
              {Object.keys(CATEGORIES).map(cat => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={cat === 'other' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Category breakdown */}
      <Card className="p-4">
        <p className="font-['Caveat'] text-lg font-semibold text-[#1A4F6E] mb-3">分類統計</p>
        <div className="space-y-2">
          {catTotals.filter(c => c.total > 0).sort((a, b) => b.total - a.total).map(({ cat, label, total }) => {
            const pct = totalSpend > 0 ? Math.round(total / totalSpend * 100) : 0
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#3A7EA0] font-medium">{label}</span>
                  <span className="font-['Caveat'] font-bold text-[#1A4F6E]">${total.toLocaleString()} <span className="text-[#7BAEC8] font-normal text-xs">{pct}%</span></span>
                </div>
                <div className="h-2 bg-[#F2F9FC] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: CAT_COLORS[cat] }} />
                </div>
              </div>
            )
          })}
          {catTotals.every(c => c.total === 0) && <p className="text-sm text-[#7BAEC8] text-center py-4">尚無花費資料</p>}
        </div>
      </Card>

      {/* Weight chart */}
      <Card className="p-4">
        <p className="font-['Caveat'] text-lg font-semibold text-[#1A4F6E] mb-3">體重趨勢</p>
        {weightData.length < 2 ? (
          <p className="text-sm text-[#7BAEC8] text-center py-6">至少需要 2 筆體重紀錄</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0F0F8" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7BAEC8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#7BAEC8' }} domain={['auto', 'auto']} />
              <Tooltip formatter={v => [`${v} kg`, '體重']} contentStyle={{ borderRadius: 12, border: '1px solid #B0D8EE', fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#4AAFDC" strokeWidth={2.5} dot={{ fill: '#4AAFDC', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
