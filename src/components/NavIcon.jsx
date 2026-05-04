export default function NavIcon({ k, color = 'currentColor', active = false }) {
  const fill = active ? '#fff' : 'none'
  const stroke = active ? '#fff' : color
  const s = { fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (k) {
    case 'home':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M4 12 L12 5 L20 12 V19 a1 1 0 0 1 -1 1 H5 a1 1 0 0 1 -1 -1 Z" fill={fill} {...s} />
          <path d="M10 20 V15 h4 v5" {...s} />
        </svg>
      )
    case 'brand':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M12.5 4 L20 11.5 a1.3 1.3 0 0 1 0 1.8 L13 20.5 a1.3 1.3 0 0 1 -1.8 0 L4 13 V5.5 a1.5 1.5 0 0 1 1.5 -1.5 Z" fill={fill} {...s} />
          <circle cx="7.8" cy="7.8" r="1.2" fill={fill} {...s} />
        </svg>
      )
    case 'spend':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <rect x="4" y="7" width="16" height="12" rx="2.5" fill={fill} {...s} />
          <path d="M4 9 v-1 a2 2 0 0 1 2 -2 H15" {...s} />
          <circle cx="16" cy="13" r="1.4" fill={active ? color : stroke} stroke="none" />
        </svg>
      )
    case 'health':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M12 20 s-7-4-7-9 a3.7 3.7 0 0 1 7-1.5 a3.7 3.7 0 0 1 7 1.5 c0 5-7 9-7 9 z" fill={fill} {...s} />
        </svg>
      )
    case 'list':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M5 9 H19 L17.5 19 a1.2 1.2 0 0 1 -1.2 1 H7.7 a1.2 1.2 0 0 1 -1.2 -1 Z" fill={fill} {...s} />
          <path d="M9 9 V7.5 a3 3 0 0 1 6 0 V9" {...s} />
        </svg>
      )
    default:
      return null
  }
}
