// Small animated schematics for the component sheets. One is mounted at a time, so a
// per-frame React render of a few SVG nodes is cheap and keeps the code declarative.
import { useEffect, useState } from 'react'
import { pistonDistance, strokeOf } from '../three/engineSim'
import { prefersReducedMotion } from '../store'

function useTime(speed = 1) {
  const [t, setT] = useState(0.6)
  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf
    const start = performance.now()
    const loop = (now) => {
      setT(((now - start) / 1000) * speed)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [speed])
  return t
}

const Frame = ({ children, label }) => (
  <svg className="diagram" viewBox="0 0 320 200" role="img" aria-label={label}>
    <defs>
      <pattern id="dgrid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0H0V16" className="diagram__grid" />
      </pattern>
    </defs>
    <rect width="320" height="200" fill="url(#dgrid)" />
    {children}
  </svg>
)

function PistonDiagram({ cycle }) {
  const t = useTime(0.8)
  const theta = t * Math.PI * 2
  const r = 26, l = 70, cx = 110, cy = 150
  const s = pistonDistance(theta, 0, r, l)
  const px = cx + r * Math.sin(theta), py = cy - r * Math.cos(theta)
  const pinY = cy - s
  const phase = ((theta % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI)
  const stroke = strokeOf(phase)
  const fire = stroke === 'Combustion' ? Math.max(0, 1 - (phase / Math.PI) * 1.4) : 0
  return (
    <Frame label="Cycle bielle-manivelle">
      <rect x={cx - 34} y={20} width={68} height={100} className="d-wall" />
      <rect x={cx - 30} y={22} width={60} height={pinY - 36} className="d-fire" style={{ opacity: fire }} />
      <rect x={cx - 30} y={pinY - 16} width={60} height={30} className="d-piston" />
      <line x1={px} y1={py} x2={cx} y2={pinY} className="d-rod" />
      <circle cx={cx} cy={cy} r={r + 10} className="d-web" />
      <circle cx={px} cy={py} r={5} className="d-pin" />
      <circle cx={cx} cy={pinY} r={4} className="d-pin" />
      <circle cx={cx} cy={cy} r={3} className="d-axis" />
      {cycle ? (
        ['Admission', 'Compression', 'Combustion', 'Échappement'].map((name, i) => (
          <text key={name} x={200} y={56 + i * 28} className={`d-label${name === stroke ? ' is-on' : ''}`}>
            {String(i + 1).padStart(2, '0')} {name}
          </text>
        ))
      ) : (
        <>
          <text x={200} y={60} className="d-label">Mouvement alternatif</text>
          <text x={200} y={78} className="d-label is-on">{stroke}</text>
          <text x={200} y={150} className="d-label">↻ vilebrequin</text>
        </>
      )}
    </Frame>
  )
}

function CrankDiagram() {
  const t = useTime(0.5)
  const a = t * Math.PI * 2
  const cx = 120, cy = 100, r = 40
  const px = cx + r * Math.sin(a), py = cy - r * Math.cos(a)
  return (
    <Frame label="Rotation du vilebrequin">
      <circle cx={cx} cy={cy} r={62} className="d-web" />
      <path d={`M ${cx} ${cy} m -62 0 a 62 62 0 0 0 124 0`} className="d-counter" transform={`rotate(${(a * 180) / Math.PI} ${cx} ${cy})`} />
      <line x1={cx} y1={cy} x2={px} y2={py} className="d-rod" />
      <circle cx={px} cy={py} r={9} className="d-pin" />
      <circle cx={cx} cy={cy} r={6} className="d-axis" />
      <line x1={px} y1={py} x2={cx} y2={cy - pistonDistance(a, 0, r, 110)} className="d-rod d-rod--ghost" />
      <text x={210} y={70} className="d-label">Va-et-vient</text>
      <text x={210} y={90} className="d-label">↓</text>
      <text x={210} y={110} className="d-label is-on">Rotation</text>
    </Frame>
  )
}

function DrivetrainDiagram() {
  const t = useTime(1)
  const path = 'M40 120 L90 120 M90 120 L150 92 M150 92 L210 120 M210 120 C240 150 270 150 286 120'
  return (
    <Frame label="Parcours de la puissance">
      <path d={path} className="d-flow-base" />
      <path d={path} className="d-flow" style={{ strokeDashoffset: -t * 60 }} />
      {[
        [40, 120, 18, 'Vilebrequin'],
        [90, 120, 14, 'Primaire'],
        [150, 92, 20, 'Embrayage'],
        [210, 120, 16, 'Boîte'],
        [286, 120, 26, 'Roue'],
      ].map(([x, y, r, label]) => (
        <g key={label}>
          <circle cx={x} cy={y} r={r} className="d-web" />
          <line x1={x} y1={y} x2={x + r * Math.cos(t * 3)} y2={y + r * Math.sin(t * 3)} className="d-spoke" />
          <text x={x} y={y + r + 18} textAnchor="middle" className="d-label d-label--sm">{label}</text>
        </g>
      ))}
    </Frame>
  )
}

function ExhaustDiagram() {
  const t = useTime(1)
  const path = 'M40 60 C70 60 80 130 130 130 L210 120'
  return (
    <Frame label="Parcours des gaz">
      <rect x={20} y={40} width={40} height={36} className="d-wall" />
      <text x={40} y={32} textAnchor="middle" className="d-label d-label--sm">Culasse</text>
      <path d={path} className="d-pipe" />
      <path d={path} className="d-gas" style={{ strokeDashoffset: -t * 90 }} />
      <rect x={210} y={104} width={84} height={32} rx={14} className="d-muffler" />
      <path d="M296 120 h18" className="d-gas" style={{ strokeDashoffset: -t * 90 }} />
      <text x={252} y={160} textAnchor="middle" className="d-label d-label--sm">Silencieux</text>
      <text x={130} y={170} textAnchor="middle" className="d-label d-label--sm">Collecteur</text>
    </Frame>
  )
}

function SuspensionDiagram() {
  const t = useTime(1)
  const bump = Math.max(0, Math.sin(t * 2.4)) ** 3
  const travel = bump * 26
  const coils = 7
  const top = 40, bottom = 130 - travel
  const pts = Array.from({ length: coils * 2 + 1 }, (_, i) => `${i % 2 ? 175 : 145},${top + ((bottom - top) * i) / (coils * 2)}`).join(' ')
  return (
    <Frame label="Débattement">
      <rect x={140} y={28} width={40} height={10} className="d-piston" />
      <polyline points={pts} className="d-spring" />
      <circle cx={160} cy={bottom + 34} r={30} className="d-web" />
      <path d={`M0 ${172} L120 172 Q160 ${172 - bump * 26} 200 172 L320 172`} className="d-ground" />
      <text x={230} y={60} className="d-label">Débattement</text>
      <text x={230} y={80} className="d-label is-on">{Math.round(bump * 100)} %</text>
    </Frame>
  )
}

function BrakeDiagram() {
  const t = useTime(1)
  const cycle = (t % 3) / 3
  const clamp = cycle > 0.55 && cycle < 0.9
  const rot = t * 360 * (clamp ? 0.25 : 1)
  return (
    <Frame label="Disque et étrier">
      <g transform={`rotate(${rot} 130 100)`}>
        <circle cx={130} cy={100} r={70} className="d-disc" />
        <circle cx={130} cy={100} r={38} className="d-web" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={130 + 55 * Math.cos((i / 12) * Math.PI * 2)} cy={100 + 55 * Math.sin((i / 12) * Math.PI * 2)} r={3} className="d-hole" />
        ))}
      </g>
      <rect x={186} y={64} width={34} height={72} rx={8} className={`d-caliper${clamp ? ' is-on' : ''}`} />
      <rect x={clamp ? 192 : 198} y={74} width={6} height={52} className="d-pad" />
      <text x={236} y={84} className="d-label">Étrier</text>
      <text x={236} y={104} className={`d-label${clamp ? ' is-on' : ''}`}>{clamp ? 'Serrage' : 'Libre'}</text>
      <text x={236} y={124} className="d-label d-label--sm">{clamp ? 'Énergie → chaleur' : ''}</text>
    </Frame>
  )
}

function WheelDiagram() {
  const t = useTime(1)
  const rot = t * 120
  return (
    <Frame label="Roue et contact au sol">
      <g transform={`rotate(${rot} 160 96)`}>
        <circle cx={160} cy={96} r={70} className="d-tyre" />
        <circle cx={160} cy={96} r={50} className="d-web" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return <line key={i} x1={160} y1={96} x2={160 + 50 * Math.cos(a)} y2={96 + 50 * Math.sin(a)} className="d-spoke" />
        })}
      </g>
      <path d="M0 172 L320 172" className="d-ground" />
      <rect x={146} y={164} width={28} height={8} className="d-patch" />
      <path d={`M0 186 L320 186`} className="d-flow" style={{ strokeDashoffset: t * 80 }} />
      <text x={190} y={160} className="d-label d-label--sm">Surface de contact</text>
    </Frame>
  )
}

function FrameDiagram() {
  const t = useTime(1)
  const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.6))
  return (
    <Frame label="Répartition des efforts">
      <path d="M250 50 L170 70 L80 76 L60 120 M250 50 L230 140 L150 150 L90 130 L60 120 L30 136" className="d-frame" />
      <circle cx={250} cy={50} r={6} className="d-pin" />
      <circle cx={60} cy={120} r={6} className="d-pin" />
      {[[170, 70], [120, 74], [190, 146]].map(([x, y], i) => (
        <g key={i} style={{ opacity: pulse }}>
          <line x1={x} y1={y - 34} x2={x} y2={y - 8} className="d-load" />
          <path d={`M${x - 5} ${y - 14} L${x} ${y - 6} L${x + 5} ${y - 14}`} className="d-load" />
        </g>
      ))}
      <text x={252} y={36} className="d-label d-label--sm" textAnchor="middle">Direction</text>
      <text x={60} y={150} className="d-label d-label--sm" textAnchor="middle">Pivot</text>
    </Frame>
  )
}

function BodyDiagram() {
  const swatches = [
    ['Noir brillant', 'url(#paint)'],
    ['Cuivre', '#b77743'],
    ['Acier brossé', 'url(#brushed)'],
    ['Chrome', 'url(#chrome)'],
  ]
  return (
    <svg className="diagram" viewBox="0 0 320 200" role="img" aria-label="Finitions">
      <defs>
        <linearGradient id="paint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a2b2e" /><stop offset=".35" stopColor="#060606" /><stop offset="1" stopColor="#111214" /></linearGradient>
        <linearGradient id="brushed" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5d6166" /><stop offset=".5" stopColor="#9a9ea3" /><stop offset="1" stopColor="#5d6166" /></linearGradient>
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1f0ec" /><stop offset=".48" stopColor="#777b80" /><stop offset=".52" stopColor="#c4c7cb" /><stop offset="1" stopColor="#3a3c40" /></linearGradient>
      </defs>
      {swatches.map(([name, fill], i) => (
        <g key={name} transform={`translate(${16 + i * 76} 40)`}>
          <rect width="64" height="96" rx="4" fill={fill} className="d-swatch" />
          <text x="0" y="118" className="d-label d-label--sm">{name}</text>
        </g>
      ))}
    </svg>
  )
}

const DIAGRAMS = {
  cycle: () => <PistonDiagram cycle />,
  piston: () => <PistonDiagram />,
  crank: CrankDiagram,
  drivetrain: DrivetrainDiagram,
  exhaust: ExhaustDiagram,
  suspension: SuspensionDiagram,
  brake: BrakeDiagram,
  wheel: WheelDiagram,
  frame: FrameDiagram,
  body: BodyDiagram,
}

export default function Diagram({ type }) {
  const D = DIAGRAMS[type]
  return D ? <D /> : null
}
