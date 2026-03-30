import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2 } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const COLORS = { food: '#4AAFDC', medical: '#F87171', supplies: '#34D399', other: '#A78BFA' }

export default function Expenses() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return
    await deleteDoc(doc(db, 'expenses', id))
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">花費記帳</h1>
        <button
          onClick={() => navigate('/expenses/new')}
          className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="💰"
          title="還沒有花費紀錄"
          description="記錄嬛嬛的每一筆開銷"
          action={
            <button
              onClick={() => navigate('/expenses/new')}
              className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer"
            >
              新增花費
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <Card key={exp.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[exp.category] || '#7BAEC8' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A4F6E] truncate">{exp.name}</p>
                <p className="text-xs text-[#7BAEC8]">{CATEGORIES[exp.category]} · {exp.date}</p>
                {exp.note && <p className="text-xs text-[#7BAEC8] truncate">{exp.note}</p>}
              </div>
              <p className="font-['Caveat'] text-lg font-bold text-[#3A7EA0]">${exp.amount?.toLocaleString()}</p>
              <button onClick={() => handleDelete(exp.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer ml-1">
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
