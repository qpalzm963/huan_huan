import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

export default function PhotosNew() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增照片" />
      <div className="p-4">
        <EmptyState
          icon="📷"
          title="照片功能即將推出"
          description="升級 Firebase 方案後即可啟用照片上傳"
        />
      </div>
    </div>
  )
}
