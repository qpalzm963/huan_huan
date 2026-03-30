import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2, CheckCircle2, Circle, ArrowRight } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = { food: '#4AAFDC', medical: '#F87171', supplies: '#34D399', other: '#A78BFA' }

export default function Shopping() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const q = query(collection(db, 'shopping'), orderBy('done'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item) {
    const ref = doc(db, 'shopping', item.id)
    const update = item.done
      ? { done: false, doneAt: null }
      : { done: true, doneAt: Timestamp.now() }
    await updateDoc(ref, update)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...update } : i)
      .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1)))
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return
    await deleteDoc(doc(db, 'shopping', id))
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function transferToExpense(item) {
    navigate('/expenses/new', {
      state: { name: item.name, category: item.category, amount: item.estimatedPrice || '' }
    })
  }

  const pending = items.filter(i => !i.done)
  const done = items.filter(i => i.done)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">購物清單</h1>
        <button
          onClick={() => navigate('/shopping/new')}
          className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="購物清單是空的"
          description="記錄想幫嬛嬛買的東西"
          action={
            <button onClick={() => navigate('/shopping/new')} className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer">
              新增項目
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* 待購買 */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide mb-2">待購買 {pending.length}</p>
              <div className="space-y-2">
                {pending.map(item => (
                  <Card key={item.id} className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => toggleDone(item)} className="text-[#B0D8EE] hover:text-[#4AAFDC] transition-colors cursor-pointer flex-shrink-0">
                      <Circle size={22} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A4F6E] truncate">{item.name}</p>
                      <p className="text-xs text-[#7BAEC8]">
                        {CATEGORIES[item.category] || item.category}
                        {item.estimatedPrice ? ` · 約 $${item.estimatedPrice.toLocaleString()}` : ''}
                      </p>
                      {item.note && <p className="text-xs text-[#7BAEC8] truncate">{item.note}</p>}
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 已購買 */}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide mb-2">已購買 {done.length}</p>
              <div className="space-y-2">
                {done.map(item => (
                  <Card key={item.id} className="px-4 py-3 flex items-center gap-3 opacity-60">
                    <button onClick={() => toggleDone(item)} className="text-[#4AAFDC] cursor-pointer flex-shrink-0">
                      <CheckCircle2 size={22} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A4F6E] truncate line-through">{item.name}</p>
                      <p className="text-xs text-[#7BAEC8]">{CATEGORIES[item.category] || item.category}</p>
                    </div>
                    <button
                      onClick={() => transferToExpense(item)}
                      className="flex items-center gap-1 text-xs text-[#4AAFDC] font-semibold cursor-pointer flex-shrink-0"
                    >
                      記帳 <ArrowRight size={12} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
