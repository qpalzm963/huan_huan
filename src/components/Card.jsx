export default function Card({ children, className = '', onClick, style }) {
  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: 22,
        boxShadow: '0 6px 20px rgba(58,46,46,0.06), 0 1px 3px rgba(58,46,46,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
