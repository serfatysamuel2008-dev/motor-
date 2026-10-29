import { useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import BikeModel from '../three/BikeModel'
import { StudioEnvironment, StudioLights, Floor } from '../three/Studio'
import { useStore, prefersReducedMotion } from '../store'
import { useInView, useMountWhenNear } from '../ui/useInView'

// Scroll progress → explode amount: hold assembled at the start, fully exploded at the end.
const fromScroll = (p) => Math.min(1, Math.max(0, (p - 0.08) / 0.78))

const CAM_A = new THREE.Vector3(-0.1, 0.85, 4.3) // assembled: near-profile, like the photo
const CAM_B = new THREE.Vector3(2.6, 2.1, 5.4) // exploded: three-quarter to read the depth
const LOOK_A = new THREE.Vector3(-0.55, 0.5, 0)
const LOOK_B = new THREE.Vector3(-0.75, 0.55, 0.45)

function ExplodeRig({ value }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3())
  useFrame((_, dt) => {
    const target = useStore.getState().explode
    value.current += (target - value.current) * Math.min(1, dt * 6)
    const k = value.current
    const aspect = size.width / size.height
    const fit = aspect < 1 ? 1.7 : aspect < 1.4 ? 1.2 : 1
    camera.position.lerpVectors(CAM_A, CAM_B, k).multiplyScalar(fit)
    look.current.lerpVectors(LOOK_A, LOOK_B, k)
    // On narrow screens the title is not beside the bike, so centre it.
    if (aspect < 1.2) look.current.x += 0.5
    if (aspect < 1.2) camera.position.x += 0.5
    camera.lookAt(look.current)
  })
  return null
}

let tween
const animateTo = (v, duration = 2.2) => {
  tween?.kill()
  const s = useStore.getState()
  s.setExplodePaused(false)
  s.setExplodeMode('manual')
  const proxy = { v: s.explode }
  tween = gsap.to(proxy, {
    v,
    duration: prefersReducedMotion() ? 0 : duration,
    ease: 'power2.inOut',
    onUpdate: () => useStore.getState().setExplode(proxy.v),
  })
}

function Controls({ scrollProgress }) {
  const explode = useStore((s) => s.explode)
  const mode = useStore((s) => s.explodeMode)
  const paused = useStore((s) => s.explodePaused)
  const s = useStore.getState()

  const togglePause = () => {
    tween?.pause()
    s.setExplodePaused(!paused)
    if (paused) tween?.resume()
  }
  const backToScroll = () => {
    animateTo(fromScroll(scrollProgress.current), 0.8)
    tween.eventCallback('onComplete', () => useStore.getState().setExplodeMode('scroll'))
  }

  return (
    <div className="explode-controls" role="group" aria-label="Contrôles de la vue éclatée">
      <div className="explode-controls__row">
        <button className="btn btn--primary btn--sm" onClick={() => animateTo(1)}>Explode</button>
        <button className="btn btn--ghost btn--sm" onClick={() => animateTo(0)}>Reassemble</button>
        <button className="chip" aria-pressed={paused} onClick={togglePause}>{paused ? 'Reprendre' : 'Pause'}</button>
        <button className="chip" onClick={() => animateTo(0, 1.2)}>Vue complète</button>
      </div>
      <label className="slider">
        <span className="slider__label">Séparation</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(explode * 100)}
          onChange={(e) => {
            tween?.kill()
            s.setExplodeMode('manual')
            s.setExplodePaused(false)
            s.setExplode(e.target.value / 100)
          }}
        />
        <span className="slider__value">{String(Math.round(explode * 100)).padStart(3, '0')}%</span>
      </label>
      <p className="explode-controls__mode">
        {paused ? 'En pause' : mode === 'scroll' ? 'Piloté par le défilement' : 'Pilotage manuel'}
        {(mode === 'manual' || paused) && (
          <button className="link" onClick={backToScroll}>Rendre au défilement</button>
        )}
      </p>
    </div>
  )
}

export default function Explode() {
  const wrap = useRef()
  const inView = useInView(wrap, '0%')
  const near = useMountWhenNear(wrap)
  const value = useRef(0)
  const scrollProgress = useRef(0)

  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: wrap.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollProgress.current = self.progress
        const s = useStore.getState()
        if (s.explodeMode === 'scroll' && !s.explodePaused) s.setExplode(fromScroll(self.progress))
      },
    })
    return () => st.kill()
  }, [])

  useEffect(() => () => tween?.kill(), [])

  return (
    <section id="explode" data-env="blueprint" className="explode" ref={wrap}>
      <div className="explode__sticky">
        <header className="section__head section__head--overlay">
          <p className="eyebrow"><span>03</span> Vue éclatée · 16 sous-ensembles</p>
          <h2 className="section__title">Every part<br />has a purpose.</h2>
          <p className="section__lead">Descendez : la moto se désassemble sur ses axes de montage.</p>
        </header>

        <div className="stage stage--explode">
          {near && (
          <Canvas
            frameloop={inView ? 'always' : 'never'}
            dpr={[1, 1.75]}
            shadows
            camera={{ position: CAM_A.toArray(), fov: 34, near: 0.05, far: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <StudioEnvironment copper={0.7} />
            <StudioLights copper={0.8} />
            <BikeModel getExplode={() => value.current} showLabels />
            <Floor opacity={0.5} />
            <ExplodeRig value={value} />
          </Canvas>
          )}
          <p className="demo-badge">Démonstration : pièces simplifiées, séparées comme des objets 3D distincts</p>
        </div>

        <Controls scrollProgress={scrollProgress} />
      </div>
    </section>
  )
}
