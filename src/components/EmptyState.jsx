export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <p className="font-['Caveat'] text-xl font-semibold text-[#1A4F6E] mb-1">{title}</p>
      {description && <p className="text-sm text-[#7BAEC8] mb-4">{description}</p>}
      {action}
    </div>
  )
}
