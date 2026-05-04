import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, action }) {
  const navigate = useNavigate()
  return (
    <header
      className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between"
      style={{ background: 'rgba(251,246,241,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-medium cursor-pointer"
        style={{ color: '#6E5A5A', background: 'transparent', border: 'none' }}
      >
        <ArrowLeft size={16} />
        返回
      </button>
      <span className="font-display text-lg" style={{ color: '#3A2E2E', fontWeight: 500 }}>{title}</span>
      <div className="w-16 flex justify-end">{action}</div>
    </header>
  )
}
