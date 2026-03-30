import EmptyState from '../components/EmptyState'
import { useNavigate } from 'react-router-dom'

export default function Photos() {
  return (
    <div className="p-4">
      <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E] mb-4">照片日記</h1>
      <EmptyState
        icon="📷"
        title="照片功能即將推出"
        description="升級 Firebase 方案後即可啟用照片上傳"
      />
    </div>
  )
}
