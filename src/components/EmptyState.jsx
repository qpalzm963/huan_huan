export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <p className="font-display text-xl mb-1" style={{ color: '#3A2E2E', fontWeight: 500 }}>{title}</p>
      {description && <p className="text-sm mb-4" style={{ color: '#B5A3A3' }}>{description}</p>}
      {action}
    </div>
  )
}
