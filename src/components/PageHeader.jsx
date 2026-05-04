import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, action }) {
  const navigate = useNavigate()
  return (
    <header
      className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between"
      style={{ background: 'rgba(255,249,242,0.9)', backdropFilter: 'blur(12px)' }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#FFFFFF', border: '2px solid #3D2A2A', borderRadius: 999,
          padding: '5px 12px',
          fontFamily: "'Fredoka', system-ui", fontSize: 12, fontWeight: 600,
          color: '#3D2A2A', cursor: 'pointer',
          boxShadow: '0 2px 0 #3D2A2A',
        }}
      >
        <ArrowLeft size={14} />
        返回
      </button>
      <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600, color: '#3D2A2A' }}>{title}</span>
      <div className="w-16 flex justify-end">{action}</div>
    </header>
  )
}
