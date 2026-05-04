import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = {
  food: 'oklch(0.88 0.05 15)',
  medical: 'oklch(0.78 0.06 25)',
  supplies: 'oklch(0.78 0.05 75)',
  other: '#B5A3A3',
}

function monthLabel(s) { const [, m] = s.split('-'); return `${parseInt(m)}月` }

export default function Reports() {
  const [expenses, setExpenses] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [a, b] = await Promise.all([
        getDocs(query(collection(db, 'expenses'), orderBy('date'))),
        getDocs(query(collection(db, 'health'), orderBy('date'))),
      ])
      setExpenses(a.docs.map(d => d.data()))
      setWeights(b.docs.map(d => d.data()).filter(d => d.type === 'weight'))
      setLoading(false)
    }
    load()
  }, [])

  const monthlyData = (() => {
    const map = {}
    expenses.forEach(e => {
      const m = e.date?.slice(0, 7); if (!m) return
      if (!map[m]) map[m] = { month: m, food: 0, medical: 0, supplies: 0, other: 0 }
      map[m][e.category] = (map[m][e.category] || 0) + (e.amount || 0)
    })
    return Object.values(map).slice(-6).map(d => ({ ...d, label: monthLabel(d.month) }))
  })()

  const catTotals = (() => {
    const map = { food: 0, medical: 0, supplies: 0, other: 0 }
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + (e.amount || 0) })
    return Object.entries(map).map(([cat, total]) => ({ cat, label: CATEGORIES[cat], total }))
  })()

  const weightData = weights.slice(-10).map(w => ({ date: w.date?.slice(5), weight: w.weight }))
  const totalSpend = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  const card = {
    background: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 12,
    boxShadow: '0 4px 14px rgba(58,46,46,0.05)',
  }
  const sectionTag = { fontFamily: 'JetBrains Mono', fontSize: 9.5, letterSpacing: '0.14em', color: '#B5A3A3', textTransform: 'uppercase' }
  const sectionTitle = { fontFamily: 'Quicksand', fontSize: 17, color: '#3A2E2E', marginTop: 2, fontWeight: 500 }

  if (loading) return (
    <div style={{ padding: 16 }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 160, background: '#FFFFFF', borderRadius: 24, marginBottom: 12, opacity: 0.6 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '8px 16px 16px' }}>
      {/* Headline */}
      <div style={{ padding: '6px 6px 14px' }}>
        <div style={sectionTag}>SECTION · 報表</div>
        <div style={{ fontFamily: 'Quicksand', fontSize: 26, color: '#3A2E2E', marginTop: 2 }}>
          <span style={{ }}>本月</span> 概覽
        </div>
      </div>

      {/* Total */}
      <div style={{
        ...card,
        background: 'linear-gradient(150deg, oklch(0.88 0.05 15) 0%, oklch(0.94 0.04 20) 100%)',
        boxShadow: '0 10px 30px oklch(0.78 0.06 25 / 0.18)',
      }}>
        <div style={{ ...sectionTag, opacity: 0.7 }}>累計總花費</div>
        <div style={{ fontFamily: 'Quicksand', fontSize: 56, lineHeight: 0.95, color: '#3A2E2E', fontWeight: 400, letterSpacing: '-0.03em', marginTop: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, opacity: 0.6, marginRight: 4 }}>NT$</span>
          {totalSpend.toLocaleString()}
        </div>
      </div>

      {/* Monthly trend */}
      <div style={card}>
        <div style={sectionTag}>MONTHLY · 月趨勢</div>
        <div style={sectionTitle}>花費走勢</div>
        {monthlyData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#B5A3A3', padding: '20px 0', fontSize: 13 }}>尚無資料</p>
        ) : (
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#F0E4E0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#B5A3A3', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#B5A3A3', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => [`$${v}`, CATEGORIES[name] || name]} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, boxShadow: '0 4px 12px rgba(58,46,46,0.1)' }} />
                {Object.keys(CATEGORIES).map(cat => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={cat === 'other' ? [6, 6, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div style={card}>
        <div style={sectionTag}>BREAKDOWN · 分類</div>
        <div style={sectionTitle}>分類佔比</div>
        <div style={{ marginTop: 12 }}>
          {catTotals.filter(c => c.total > 0).sort((a,b) => b.total - a.total).map(({ cat, label, total }) => {
            const pct = totalSpend > 0 ? Math.round(total / totalSpend * 100) : 0
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'Nunito', fontSize: 13, fontWeight: 500, color: '#3A2E2E' }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6E5A5A' }}>${total.toLocaleString()} <span style={{ color: '#B5A3A3', marginLeft: 4 }}>{pct}%</span></span>
                </div>
                <div style={{ height: 6, background: '#FBF6F1', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: CAT_COLORS[cat], transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}
          {catTotals.every(c => c.total === 0) && <p style={{ textAlign: 'center', color: '#B5A3A3', padding: '10px 0', fontSize: 13 }}>尚無花費資料</p>}
        </div>
      </div>

      {/* Weight */}
      <div style={card}>
        <div style={sectionTag}>WEIGHT · 體重</div>
        <div style={sectionTitle}>體重曲線</div>
        {weightData.length < 2 ? (
          <p style={{ textAlign: 'center', color: '#B5A3A3', padding: '20px 0', fontSize: 13 }}>至少需要 2 筆紀錄</p>
        ) : (
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#F0E4E0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#B5A3A3', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#B5A3A3', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip formatter={v => [`${v} kg`, '體重']} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, boxShadow: '0 4px 12px rgba(58,46,46,0.1)' }} />
                <Line type="monotone" dataKey="weight" stroke="oklch(0.78 0.06 25)" strokeWidth={2.5} dot={{ fill: 'oklch(0.78 0.06 25)', r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
