export default function NavIcon({ k, color = 'currentColor' }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (k) {
    case 'home':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M4 11.5 L12 5 L20 11.5 V19 a1.2 1.2 0 0 1 -1.2 1.2 H5.2 A1.2 1.2 0 0 1 4 19 Z" {...s} />
          <path d="M10 20.2 V14.5 a1 1 0 0 1 1 -1 H13 a1 1 0 0 1 1 1 V20.2" {...s} />
          <path d="M16 6.5 c0 -.8 .6 -1.4 1.3 -1.4 .6 0 1 .4 1.2 .8 .2 -.4 .6 -.8 1.2 -.8 .7 0 1.3 .6 1.3 1.4 0 1.2 -2.5 2.5 -2.5 2.5 s-2.5 -1.3 -2.5 -2.5 Z" fill={color} stroke="none" />
          <circle cx="12" cy="3.6" r="0.8" fill={color} />
        </svg>
      )
    case 'brand':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M12.5 3.5 L20 11 a1.4 1.4 0 0 1 0 2 L13 20 a1.4 1.4 0 0 1 -2 0 L3.5 12.5 V5 a1.5 1.5 0 0 1 1.5 -1.5 Z" {...s} />
          <circle cx="7.5" cy="7.5" r="1.4" {...s} />
          <path d="M14 15.5 c .5 -.5 1.4 -.5 1.9 0 .3 .3 .3 .8 0 1.1 l -1 1" {...s} />
        </svg>
      )
    case 'spend':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M4 8 a2 2 0 0 1 2 -2 H17 a1.5 1.5 0 0 1 1.5 1.5 V9 H20 a1 1 0 0 1 1 1 V18 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 Z" {...s} />
          <circle cx="17" cy="14" r="1.4" fill={color} stroke="none" />
          <path d="M6 6 V5 a1 1 0 0 1 1 -1 H15" {...s} />
          <path d="M8 11 q2 -1 4 0" {...s} />
        </svg>
      )
    case 'health':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M12 19.5 s -7 -4 -7 -9 a3.7 3.7 0 0 1 7 -1.5 a3.7 3.7 0 0 1 7 1.5 c0 5 -7 9 -7 9 Z" {...s} />
          <path d="M7.5 12 H10 L11 10 L13 14 L14 12 H16.5" {...s} />
        </svg>
      )
    case 'list':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M4 9 H20 L18.5 19 a1.5 1.5 0 0 1 -1.5 1.3 H7 a1.5 1.5 0 0 1 -1.5 -1.3 Z" {...s} />
          <path d="M8 9 V7.5 a4 4 0 0 1 8 0 V9" {...s} />
          <path d="M10 6 c -1 -1 -1 -2.4 0 -2.4 .8 0 1 .7 1 1.2 .2 -.4 .4 -1 1 -1 1 0 1 1.4 0 2.4" fill={color} stroke="none" />
          <circle cx="9" cy="14" r="0.9" fill={color} />
          <circle cx="15" cy="14" r="0.9" fill={color} />
        </svg>
      )
    default:
      return null
  }
}
