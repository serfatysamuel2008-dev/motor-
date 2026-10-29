import { useStore, ENVIRONMENTS } from '../store'

// Fixed backdrop behind every section. Each environment is its own layer; the active one
// fades in while a copper scan line cuts across the screen to mark the change of set.
export default function EnvBackdrop() {
  const env = useStore((s) => s.env)
  return (
    <div className="env" aria-hidden="true">
      {Object.keys(ENVIRONMENTS).map((key) => (
        <div key={key} className={`env__layer env__layer--${key}${env === key ? ' is-active' : ''}`} />
      ))}
      <div className="env__grain" />
      <div key={env} className="env__cut" />
    </div>
  )
}
