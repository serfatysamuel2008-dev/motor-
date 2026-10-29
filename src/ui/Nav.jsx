import { useStore, ENVIRONMENTS } from '../store'

export const SECTIONS = [
  ['hero', 'Ouverture'],
  ['showroom', 'La machine'],
  ['explode', 'Vue éclatée'],
  ['engine', 'Moteur'],
  ['ride', 'Accélération'],
  ['components', 'Composants'],
]

export const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })

export default function Nav() {
  const env = useStore((s) => s.env)
  return (
    <header className="nav">
      <a className="nav__mark" href="#hero" onClick={(e) => (e.preventDefault(), scrollToId('hero'))}>
        <span className="nav__mark-hd">H-D</span>
        <span className="nav__mark-sep" />
        Anatomy
      </a>
      <nav className="nav__index" aria-label="Sections">
        {SECTIONS.map(([id, label], i) => (
          <a key={id} href={`#${id}`} onClick={(e) => (e.preventDefault(), scrollToId(id))} title={label}>
            <span className="nav__num">{String(i + 1).padStart(2, '0')}</span>
            <span className="nav__label">{label}</span>
          </a>
        ))}
      </nav>
      <div className="nav__env" aria-live="polite">
        <span className="nav__env-dot" />
        {ENVIRONMENTS[env]}
      </div>
    </header>
  )
}
