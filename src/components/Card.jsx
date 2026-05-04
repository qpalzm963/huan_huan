export default function Card({ children, className = '', onClick, style }) {
  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer active:translate-y-[1px] transition-transform' : ''} ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '2px solid #3D2A2A',
        boxShadow: '0 3px 0 #3D2A2A',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
