import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2 } from 'lucide-react'

export default function Diet() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const q = query(collection(db, 'diet'), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return
    await deleteDoc(doc(db, 'diet', id))
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">飲食日誌</h1>
        <button
          onClick={() => navigate('/diet/new')}
          className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="還沒有飲食紀錄"
          description="記錄嬛嬛今天吃了什麼"
          action={
            <button onClick={() => navigate('/diet/new')} className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer">
              新增紀錄
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <Card key={r.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#7BAEC8] mb-1">{r.date}</p>
                {r.morning && (
                  <p className="text-sm text-[#1A4F6E]">
                    <span className="text-xs font-semibold text-[#4AAFDC] mr-1">早</span>
                    {r.morning}{r.morningAmount ? ` · ${r.morningAmount}g` : ''}
                  </p>
                )}
                {r.evening && (
                  <p className="text-sm text-[#1A4F6E]">
                    <span className="text-xs font-semibold text-[#3A7EA0] mr-1">晚</span>
                    {r.evening}{r.eveningAmount ? ` · ${r.eveningAmount}g` : ''}
                  </p>
                )}
                {r.note && <p className="text-xs text-[#7BAEC8] mt-1 truncate">{r.note}</p>}
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer">
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
