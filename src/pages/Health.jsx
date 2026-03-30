import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2 } from 'lucide-react'

const TABS = ['體重', '疫苗', '看診']
const TYPE_COLORS = { weight: '#4AAFDC', vaccine: '#34D399', visit: '#F87171' }

export default function Health() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const types = ['weight', 'vaccine', 'visit']

  async function load() {
    setLoading(true)
    const q = query(collection(db, 'health'), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return
    await deleteDoc(doc(db, 'health', id))
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const filtered = records.filter(r => r.type === types[tab])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">健康紀錄</h1>
        <button
          onClick={() => navigate('/health/new')}
          className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-[#B0D8EE] rounded-xl p-1 mb-4">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              tab === i ? 'bg-[#B0D8EE] text-[#1A4F6E]' : 'text-[#7BAEC8]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === 0 ? '⚖️' : tab === 1 ? '💉' : '🏥'}
          title={`還沒有${TABS[tab]}紀錄`}
          action={
            <button
              onClick={() => navigate('/health/new')}
              className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer"
            >
              新增紀錄
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[r.type] }} />
              <div className="flex-1 min-w-0">
                {r.type === 'weight' && <p className="text-sm font-semibold text-[#1A4F6E]">{r.weight} kg</p>}
                {r.type === 'vaccine' && <p className="text-sm font-semibold text-[#1A4F6E] truncate">{r.vaccineName}</p>}
                {r.type === 'visit' && <p className="text-sm font-semibold text-[#1A4F6E] truncate">{r.clinic} · {r.reason}</p>}
                <p className="text-xs text-[#7BAEC8]">{r.date}</p>
                {r.note && <p className="text-xs text-[#7BAEC8] truncate">{r.note}</p>}
                {r.type === 'vaccine' && r.nextDate && (
                  <p className="text-xs text-[#34D399]">下次：{r.nextDate}</p>
                )}
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
