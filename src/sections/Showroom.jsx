import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { gsap } from 'gsap'
import BikeModel from '../three/BikeModel'
import { StudioEnvironment, StudioLights, Floor } from '../three/Studio'
import { PART_BY_ID, PART_TO_SHEET, SHOWROOM_HOTSPOTS } from '../data/parts'
import { SHEET_BY_ID } from '../data/sheets'
import { useStore, prefersReducedMotion } from '../store'
import { useInView, useMountWhenNear } from '../ui/useInView'
import { scrollToId } from '../ui/Nav'

const HOME = { pos: [2.3, 1.15, 2.9], target: [0, 0.55, 0] }

function CameraRig({ resetSignal, autoRotate }) {
  const controls = useRef()
  const { camera } = useThree()
  const selected = useStore((s) => s.selected)

  const flyTo = (pos, target) => {
    const c = controls.current
    if (!c) return
    gsap.killTweensOf([camera.position, c.target])
    const d = prefersReducedMotion() ? 0 : 1.4
    gsap.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: d, ease: 'power3.inOut' })
    gsap.to(c.target, { x: target[0], y: target[1], z: target[2], duration: d, ease: 'power3.inOut', onUpdate: () => c.update() })
  }

  useEffect(() => {
    if (!selected) return
    const a = PART_BY_ID[selected].anchor
    // Approach from the visible side, slightly above, keeping the current azimuth sign.
    const side = camera.position.x >= 0 ? 1 : -1
    flyTo([a[0] + 0.55 * side, a[1] + 0.25, a[2] + 0.95], a)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    if (resetSignal) flyTo(HOME.pos, HOME.target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={HOME.target}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={0.7}
      maxDistance={5}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.04}
      autoRotate={autoRotate && !selected}
      autoRotateSpeed={0.55}
    />
  )
}

function Hotspots() {
  const selected = useStore((s) => s.selected)
  return SHOWROOM_HOTSPOTS.map((id) => {
    const p = PART_BY_ID[id]
    return (
      <Html key={id} position={p.anchor} center zIndexRange={[30, 0]}>
        <button
          className={`hotspot${selected === id ? ' is-active' : ''}`}
          // Html lives inside the canvas container: stop the event before R3F reads it as a miss.
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            useStore.getState().setSelected(selected === id ? null : id)
          }}
          onPointerEnter={() => useStore.getState().setHovered(id)}
          onPointerLeave={() => useStore.getState().setHovered(null)}
          aria-label={p.label}
        >
          <span className="hotspot__ring" />
          <span className="hotspot__tip">{p.label}</span>
        </button>
      </Html>
    )
  })
}

export default function Showroom() {
  const wrap = useRef()
  const inView = useInView(wrap)
  const near = useMountWhenNear(wrap)
  const selected = useStore((s) => s.selected)
  const [reset, setReset] = useState(0)
  const [autoRotate, setAutoRotate] = useState(() => !prefersReducedMotion())

  const part = selected && PART_BY_ID[selected]
  const sheet = part && SHEET_BY_ID[PART_TO_SHEET[selected]]

  const resetView = () => {
    useStore.getState().setSelected(null)
    setReset((n) => n + 1)
  }
  const openSheet = () => {
    useStore.getState().setSheet(PART_TO_SHEET[selected])
    scrollToId('components')
  }

  return (
    <section id="showroom" data-env="lab" className="section showroom" ref={wrap}>
      <header className="section__head">
        <p className="eyebrow"><span>02</span> La machine</p>
        <h2 className="section__title">Turn it.<br />Get closer.</h2>
        <p className="section__lead">
          Faites pivoter la moto, zoomez, puis touchez un point pour amener la caméra sur la pièce.
        </p>
      </header>

      <div className="stage stage--showroom">
        {near && (
        <Canvas
          frameloop={inView ? 'always' : 'never'}
          dpr={[1, 1.75]}
          shadows
          camera={{ position: HOME.pos, fov: 32, near: 0.05, far: 50 }}
          gl={{ antialias: true, alpha: true }}
          onPointerMissed={() => useStore.getState().setSelected(null)}
        >
          <StudioEnvironment />
          <StudioLights />
          <BikeModel interactive onSelect={(id) => useStore.getState().setSelected(id)} />
          <Hotspots />
          <Floor />
          <CameraRig resetSignal={reset} autoRotate={autoRotate} />
        </Canvas>
        )}

        <p className="demo-badge">Maquette 3D procédurale — démonstration, proportions calées sur la photo</p>

        <div className="toolbar" role="toolbar" aria-label="Contrôles de la vue">
          <button className="chip" onClick={resetView}>Réinitialiser la vue</button>
          <button className="chip" aria-pressed={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
            Rotation auto {autoRotate ? 'on' : 'off'}
          </button>
        </div>

        <aside className={`peek${part ? ' is-open' : ''}`} aria-live="polite">
          {part && (
            <>
              <p className="peek__num">{String(part.order + 1).padStart(2, '0')} / 16</p>
              <h3 className="peek__title">{part.label}</h3>
              <p className="peek__text">{sheet?.lead}</p>
              <div className="peek__actions">
                <button className="btn btn--primary btn--sm" onClick={openSheet}>Ouvrir la fiche</button>
                <button className="btn btn--ghost btn--sm" onClick={resetView}>Fermer</button>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

