import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import VTwin from '../three/VTwin'
import { StudioEnvironment } from '../three/Studio'
import { globalEngine, IDLE_RPM, REDLINE, SLOWMO, CYLINDERS, cyclePhase, strokeOf, flash } from '../three/engineSim'
import { useInView, useMountWhenNear } from '../ui/useInView'

const SWEEP = 240
const rpmToDeg = (rpm) => -SWEEP / 2 + (Math.min(rpm, REDLINE) / REDLINE) * SWEEP

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
function arc(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from)
  const [x2, y2] = polar(cx, cy, r, to)
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
}

function useEngineState() {
  const [state, setState] = useState(globalEngine.state)
  useEffect(() => globalEngine.subscribe(setState), [])
  return state
}

// Live read-outs are written straight to the DOM from one rAF loop: no React render per frame.
function Telemetry() {
  const needle = useRef()
  const value = useRef()
  const strokes = useRef([])
  const pulses = useRef([])
  useEffect(() => {
    let raf
    const loop = () => {
      const e = globalEngine
      needle.current?.setAttribute('transform', `rotate(${rpmToDeg(e.rpm)} 100 100)`)
      if (value.current) value.current.textContent = String(Math.round(e.rpm / 10) * 10).padStart(4, '0')
      CYLINDERS.forEach((c, i) => {
        const ph = cyclePhase(e.theta, c.fireAt)
        if (strokes.current[i]) strokes.current[i].textContent = e.rpm > 20 ? strokeOf(ph) : '—'
        if (pulses.current[i]) pulses.current[i].style.opacity = e.rpm > 50 ? 0.15 + flash(ph) * 0.85 : 0.15
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const ticks = Array.from({ length: 9 }, (_, i) => i)
  return (
    <div className="telemetry">
      <svg className="tach" viewBox="0 0 200 170" role="img" aria-label="Compte-tours">
        <path d={arc(100, 100, 80, -SWEEP / 2, SWEEP / 2)} className="tach__track" />
        <path d={arc(100, 100, 80, rpmToDeg(7000), SWEEP / 2)} className="tach__red" />
        {ticks.map((i) => {
          const d = rpmToDeg(i * 1000)
          const [x1, y1] = polar(100, 100, 72, d)
          const [x2, y2] = polar(100, 100, 84, d)
          const [tx, ty] = polar(100, 100, 60, d)
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="tach__tick" />
              <text x={tx} y={ty + 4} className="tach__num">{i}</text>
            </g>
          )
        })}
        <g ref={needle} transform={`rotate(${rpmToDeg(0)} 100 100)`}>
          <line x1="100" y1="108" x2="100" y2="28" className="tach__needle" />
        </g>
        <circle cx="100" cy="100" r="5" className="tach__hub" />
        <text x="100" y="140" className="tach__value" ref={value}>0000</text>
        <text x="100" y="156" className="tach__unit">tr/min</text>
      </svg>
      <ul className="strokes">
        {CYLINDERS.map((c, i) => (
          <li key={c.id}>
            <span className="strokes__pulse" ref={(el) => (pulses.current[i] = el)} />
            <span className="strokes__cyl">{c.id === 'front' ? 'Cylindre avant' : 'Cylindre arrière'}</span>
            <span className="strokes__stroke" ref={(el) => (strokes.current[i] = el)}>—</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function useEngineSound(enabled) {
  const [available, setAvailable] = useState(false)
  const audio = useRef()
  useEffect(() => {
    fetch('/audio/engine.mp3', { method: 'HEAD' })
      .then((r) => setAvailable(r.ok && (r.headers.get('content-type') || '').startsWith('audio')))
      .catch(() => setAvailable(false))
  }, [])
  useEffect(() => {
    if (!available || !enabled) return
    const a = (audio.current ||= Object.assign(new Audio('/audio/engine.mp3'), { loop: true, preservesPitch: false }))
    a.play().catch(() => {})
    let raf
    const loop = () => {
      a.volume = globalEngine.rpm > 30 ? 0.6 : 0
      a.playbackRate = Math.min(4, 0.5 + globalEngine.rpm / 3000)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => (cancelAnimationFrame(raf), a.pause())
  }, [available, enabled])
  return available
}

export default function Engine() {
  const wrap = useRef()
  const inView = useInView(wrap)
  const near = useMountWhenNear(wrap)
  const state = useEngineState()
  const [cutaway, setCutaway] = useState(true)
  const [throttle, setThrottle] = useState(0)
  const [sound, setSound] = useState(false)
  const soundAvailable = useEngineSound(sound)

  useEffect(() => {
    globalEngine.throttle = throttle
  }, [throttle])

  const setMode = (m) => {
    if (m === 'off') {
      setThrottle(0)
      globalEngine.stop()
    } else if (m === 'idle') {
      globalEngine.start()
      if (globalEngine.state === 'rev') globalEngine.setState('idle')
    } else {
      globalEngine.start()
      globalEngine.rev()
    }
  }

  return (
    <section id="engine" data-env="chamber" className="section engine" ref={wrap}>
      <header className="section__head">
        <p className="eyebrow"><span>04</span> Bicylindre en V · vue en coupe</p>
        <h2 className="section__title">The heart<br />of the beast.</h2>
        <p className="section__lead">
          Démarrez, laissez tourner au ralenti, puis donnez un coup d’accélérateur. Chaque piston suit sa bielle, chaque
          bielle suit le vilebrequin.
        </p>
      </header>

      <div className="engine__grid">
        <div className="stage stage--engine">
          {near && (
          <Canvas
            frameloop={inView ? 'always' : 'never'}
            dpr={[1, 1.75]}
            camera={{ position: [2.6, 1.9, 7.2], fov: 34, near: 0.1, far: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <StudioEnvironment copper={1.3} intensity={0.9} />
            <ambientLight intensity={0.2} />
            <directionalLight position={[3, 5, 4]} intensity={1.6} />
            <spotLight position={[-4, 3, 2]} angle={0.6} penumbra={0.8} intensity={40} color="#b77743" />
            <VTwin cutaway={cutaway} position={[0, -0.75, 0]} />
            <OrbitControls target={[0, 0.45, 0]} enablePan={false} minDistance={3} maxDistance={9} minPolarAngle={0.5} maxPolarAngle={Math.PI / 2 + 0.2} />
          </Canvas>
          )}
          <p className="demo-badge">Mécanisme simplifié à maneton commun · animation ralentie {SLOWMO}×</p>
        </div>

        <div className="engine__panel">
          <Telemetry />

          <div className="segmented" role="radiogroup" aria-label="État du moteur">
            {[
              ['off', 'Engine off'],
              ['idle', 'Idle'],
              ['rev', 'Rev'],
            ].map(([k, label]) => (
              <button key={k} role="radio" aria-checked={state === k} className={`segmented__btn${state === k ? ' is-on' : ''}`} onClick={() => setMode(k)}>
                {label}
              </button>
            ))}
          </div>

          {state === 'off' && (
            <button className="btn btn--primary btn--block" onClick={() => setMode('idle')}>
              <span className="btn__ignite" /> Start engine
            </button>
          )}

          <label className="slider">
            <span className="slider__label">Accélérateur</span>
            <input
              type="range"
              min="0"
              max={REDLINE - IDLE_RPM - 1000}
              step="50"
              value={throttle}
              disabled={state === 'off'}
              onChange={(e) => setThrottle(+e.target.value)}
            />
            <span className="slider__value">+{String(throttle).padStart(4, '0')}</span>
          </label>

          <div className="engine__toggles">
            <button className="chip" aria-pressed={cutaway} onClick={() => setCutaway((v) => !v)}>
              {cutaway ? 'Vue en coupe' : 'Vue pleine'}
            </button>
            <button
              className="chip"
              aria-pressed={sound}
              disabled={!soundAvailable}
              onClick={() => setSound((v) => !v)}
              title={soundAvailable ? '' : 'Aucun fichier audio moteur fourni (public/audio/engine.mp3)'}
            >
              Son {soundAvailable ? (sound ? 'on' : 'off') : 'indisponible'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
