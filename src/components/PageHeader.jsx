import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, action }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-[#B0D8EE] px-4 py-3 flex items-center justify-between">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-[#3A7EA0] text-sm font-medium cursor-pointer"
      >
        <ArrowLeft size={16} />
        返回
      </button>
      <span className="font-['Caveat'] text-xl font-bold text-[#1A4F6E]">{title}</span>
      <div className="w-16 flex justify-end">{action}</div>
    </header>
  )
}
