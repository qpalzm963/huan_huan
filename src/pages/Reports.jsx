import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = {
  food:     '#FFA877',
  medical:  '#7FCCA6',
  supplies: '#B594D9',
  other:    '#7FB3DB',
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
    background: '#FFFFFF', borderRadius: 22, padding: 16, marginBottom: 12,
    border: '2px solid #3D2A2A',
    boxShadow: '0 3px 0 #3D2A2A',
  }

  if (loading) return (
    <div style={{ padding: 16 }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 160, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 22, marginBottom: 12, opacity: 0.6 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '4px 14px 16px' }}>
      {/* Headline */}
      <div style={{ padding: '6px 4px 14px' }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>year report ♡</div>
        <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 26, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 2 }}>
          報表概覽
        </div>
      </div>

      {/* Total */}
      <div style={{
        ...card, background: '#E0CFF2',
        position: 'relative',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', right: 16, top: 14, transform: 'rotate(15deg)' }}>
          <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" fill="#F5C04D" />
        </svg>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 600, color: '#3D2A2A' }}>累計總花費 ♡</div>
        <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 52, lineHeight: 0.95, fontWeight: 700, color: '#3D2A2A', letterSpacing: '-0.03em', marginTop: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 16, fontWeight: 500 }}>NT$</span>
          {totalSpend.toLocaleString()}
        </div>
      </div>

      {/* Monthly trend */}
      <div style={card}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>monthly ♡</div>
        <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A', marginTop: 2 }}>花費走勢</div>
        {monthlyData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#C4A8A8', padding: '20px 0', fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 600 }}>尚無資料</p>
        ) : (
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#F5E6E0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7A5C5C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7A5C5C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => [`$${v}`, CATEGORIES[name] || name]} contentStyle={{ borderRadius: 12, border: '2px solid #3D2A2A', fontSize: 12, fontFamily: 'Nunito' }} />
                {Object.keys(CATEGORIES).map(cat => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={cat === 'other' ? [6, 6, 0, 0] : 0} stroke="#3D2A2A" strokeWidth={1.5} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div style={card}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>by category ♡</div>
        <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A', marginTop: 2 }}>分類佔比</div>
        <div style={{ marginTop: 12 }}>
          {catTotals.filter(c => c.total > 0).sort((a,b) => b.total - a.total).map(({ cat, label, total }) => {
            const pct = totalSpend > 0 ? Math.round(total / totalSpend * 100) : 0
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 600, color: '#3D2A2A' }}>{label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 11, color: '#7A5C5C' }}>${total.toLocaleString()} <span style={{ color: '#C4A8A8', marginLeft: 4 }}>{pct}%</span></span>
                </div>
                <div style={{ height: 8, background: '#FFEFE0', borderRadius: 999, overflow: 'hidden', border: '1.5px solid #3D2A2A' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: CAT_COLORS[cat], transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}
          {catTotals.every(c => c.total === 0) && <p style={{ textAlign: 'center', color: '#C4A8A8', padding: '10px 0', fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 600 }}>尚無花費資料</p>}
        </div>
      </div>

      {/* Weight */}
      <div style={card}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>weight ♡</div>
        <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A', marginTop: 2 }}>體重曲線</div>
        {weightData.length < 2 ? (
          <p style={{ textAlign: 'center', color: '#C4A8A8', padding: '20px 0', fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 600 }}>至少需要 2 筆紀錄</p>
        ) : (
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#F5E6E0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7A5C5C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7A5C5C', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip formatter={v => [`${v} kg`, '體重']} contentStyle={{ borderRadius: 12, border: '2px solid #3D2A2A', fontSize: 12, fontFamily: 'Nunito' }} />
                <Line type="monotone" dataKey="weight" stroke="#FF92AE" strokeWidth={3} dot={{ fill: '#FF92AE', r: 5, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
