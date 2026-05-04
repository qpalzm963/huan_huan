export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>}
      <p style={{ fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600, color: '#3D2A2A', marginBottom: 4 }}>{title}</p>
      {description && <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600, marginBottom: 14 }}>♡ {description}</p>}
      {action}
    </div>
  )
}
