import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import BikeModel from '../three/BikeModel'
import { StudioEnvironment, StudioLights, Floor } from '../three/Studio'
import { EngineContext, createEngineSim, SLOWMO } from '../three/engineSim'
import { MotionContext, createMotion } from '../three/motion'
import { useInView, useMountWhenNear } from '../ui/useInView'
import { prefersReducedMotion } from '../store'

const CUT = 0.6 // scroll position where the set changes to the night tunnel

// Camera script: [progress, position, look-at, fov]
const KEYS = [
  [0.0, [0.55, 0.62, 1.05], [-0.05, 0.5, 0.1], 34],
  [0.14, [0.38, 0.6, 0.82], [-0.05, 0.52, 0.1], 34],
  [0.28, [-1.3, 0.66, 0.62], [-0.78, 0.58, 0.18], 30],
  [0.4, [0.05, 0.16, 1.35], [-0.2, 0.32, 0], 36],
  [0.53, [3.1, 1.25, 3.9], [0, 0.5, 0], 30],
  [0.62, [1.7, 0.55, 2.3], [0.2, 0.5, 0], 48],
  [0.8, [2.5, 0.32, 1.25], [0, 0.55, 0], 54],
  [0.93, [2.3, 1.15, 2.9], [0, 0.55, 0], 32],
  [1.0, [2.3, 1.15, 2.9], [0, 0.55, 0], 32],
]

const CAPTIONS = [
  [0.0, 0.12, '01', 'Au repos, le moteur respire au ralenti.'],
  [0.12, 0.26, '02', 'Le régime grimpe.'],
  [0.26, 0.38, '03', 'Les gaz chauds quittent les silencieux.'],
  [0.38, 0.5, '04', 'La courroie entraîne la roue arrière.'],
  [0.5, 0.6, '05', 'Recul.'],
  [0.6, 0.86, '06', 'Night ride.'],
  [0.88, 1.01, '07', 'Retour au calme.'],
]

const smooth = (t) => t * t * (3 - 2 * t)
const clamp01 = (t) => Math.min(1, Math.max(0, t))
const band = (p, a, b) => clamp01((p - a) / (b - a))

function sample(p) {
  let i = 0
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++
  const [p0, a0, l0, f0] = KEYS[i]
  const [p1, a1, l1, f1] = KEYS[i + 1]
  const t = smooth(band(p, p0, p1))
  const mix = (x, y) => x.map((v, k) => v + (y[k] - v) * t)
  return { pos: mix(a0, a1), look: mix(l0, l1), fov: f0 + (f1 - f0) * t }
}

function rpmAt(p) {
  if (p < 0.1) return 900
  if (p < 0.3) return 900 + smooth(band(p, 0.1, 0.3)) * 5800
  if (p < CUT) return 6700 - band(p, 0.3, CUT) * 1200
  if (p < 0.86) {
    const g = ((p - CUT) / (0.86 - CUT)) * 3 // three upshifts through the tunnel
    return 5200 + (g % 1) * 2300
  }
  return 900 + (1 - smooth(band(p, 0.86, 0.97))) * 4000
}

function wheelSpeedAt(p) {
  if (p < 0.38) return 0
  if (p < 0.5) return smooth(band(p, 0.38, 0.5)) * 9
  if (p < CUT) return 9
  if (p < 0.86) return 9 + smooth(band(p, CUT, 0.66)) * 26
  return 35 * (1 - smooth(band(p, 0.86, 0.97)))
}

function Tunnel({ progress, worldSpeed }) {
  const group = useRef()
  const ceiling = useRef()
  const walls = useRef()
  const lines = useRef()
  const dashes = useRef()
  const RINGS = 26
  const SPACING = 2.4
  const LEN = RINGS * SPACING
  const LINES = 140
  const DASHES = 24

  const seeds = useMemo(
    () =>
      Array.from({ length: LINES }, () => {
        const side = Math.random() < 0.5 ? -1 : 1
        return { x: Math.random() * LEN - LEN / 2, y: 0.1 + Math.random() * 2.4, z: side * (0.9 + Math.random() * 2.2), len: 0.6 + Math.random() * 3 }
      }),
    []
  )
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const offset = useRef(0)
  const lineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f1f0ec', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), [])

  useFrame((_, dt) => {
    const p = progress.current
    const on = p >= CUT && p < 0.95
    group.current.visible = on
    if (!on) return
    offset.current = (offset.current + worldSpeed.current * dt) % LEN
    const fade = 1 - band(p, 0.86, 0.94)
    for (let i = 0; i < RINGS; i++) {
      const x = ((i * SPACING - offset.current + LEN) % LEN) - LEN / 2
      tmp.position.set(x, 3.0, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix()
      ceiling.current.setMatrixAt(i, tmp.matrix)
      tmp.position.set(x, 0.12, -3.6); tmp.updateMatrix(); walls.current.setMatrixAt(i * 2, tmp.matrix)
      tmp.position.set(x, 0.12, 3.6); tmp.updateMatrix(); walls.current.setMatrixAt(i * 2 + 1, tmp.matrix)
    }
    ceiling.current.instanceMatrix.needsUpdate = true
    walls.current.instanceMatrix.needsUpdate = true
    const stretch = Math.min(1, worldSpeed.current / 25)
    seeds.forEach((s, i) => {
      const x = ((s.x - offset.current * 1.6) % LEN + LEN) % LEN - LEN / 2
      tmp.position.set(x, s.y, s.z)
      tmp.scale.set(s.len * (0.3 + stretch * 1.5), 1, 1)
      tmp.updateMatrix()
      lines.current.setMatrixAt(i, tmp.matrix)
    })
    lines.current.instanceMatrix.needsUpdate = true
    lineMat.opacity = 0.55 * stretch * fade
    for (let i = 0; i < DASHES; i++) {
      tmp.position.set(((i * 2.5 - offset.current + LEN) % (DASHES * 2.5)) - (DASHES * 2.5) / 2, 0.003, -0.6)
      tmp.scale.set(1, 1, 1)
      tmp.updateMatrix()
      dashes.current.setMatrixAt(i, tmp.matrix)
    }
    dashes.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[LEN, 8]} />
        <meshStandardMaterial color="#08090a" metalness={0.15} roughness={0.55} envMapIntensity={0.2} />
      </mesh>
      <instancedMesh ref={ceiling} args={[null, null, RINGS]} frustumCulled={false}>
        <boxGeometry args={[0.07, 0.02, 3.4]} />
        <meshBasicMaterial color="#f1f0ec" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={walls} args={[null, null, RINGS * 2]} frustumCulled={false}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
        <meshBasicMaterial color="#ff7518" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={lines} args={[null, null, LINES]} material={lineMat} frustumCulled={false}>
        <boxGeometry args={[1, 0.006, 0.006]} />
      </instancedMesh>
      <instancedMesh ref={dashes} args={[null, null, DASHES]} frustumCulled={false}>
        <boxGeometry args={[1.1, 0.002, 0.06]} />
        <meshBasicMaterial color="#c4c7cb" />
      </instancedMesh>
      <pointLight position={[0, 2.6, 0]} intensity={8} distance={6} color="#f1f0ec" />
    </group>
  )
}

function StudioSet({ progress }) {
  const group = useRef()
  useFrame(() => {
    const p = progress.current
    group.current.visible = p < CUT || p >= 0.88
  })
  return (
    <group ref={group}>
      <Floor opacity={0.6} />
    </group>
  )
}

function Director({ progress, engine, motion, worldSpeed, dof, bloom }) {
  const { camera } = useThree()
  const smoothP = useRef(0)
  const look = useMemo(() => new THREE.Vector3(), [])
  const reduced = useMemo(prefersReducedMotion, [])

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.05)
    const gap = progress.target - smoothP.current
    // Ease normal scrolling, but jump straight there after a long jump (nav link, refresh).
    smoothP.current = Math.abs(gap) > 0.2 ? progress.target : smoothP.current + gap * Math.min(1, dt * 5)
    const p = (progress.current = smoothP.current)

    engine.rpm = rpmAt(p)
    engine.theta += ((engine.rpm / 60) * Math.PI * 2 * dt) / SLOWMO
    const ws = wheelSpeedAt(p)
    motion.wheelAngle += ws * dt
    motion.heat = band(p, 0.18, 0.34) * (1 - band(p, 0.86, 0.98)) * (p > CUT ? 0.7 : 1)
    worldSpeed.current = p >= CUT && p < 0.95 ? ws * 0.75 : 0

    const { pos, look: l, fov } = sample(p)
    const shake = !reduced && p > CUT && p < 0.86 ? 0.008 : 0
    const t = clock.elapsedTime
    camera.position.set(pos[0] + Math.sin(t * 31) * shake, pos[1] + Math.sin(t * 43) * shake, pos[2])
    look.set(...l)
    camera.lookAt(look)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    const tunnel = p > CUT && p < 0.9 ? 1 : 0
    if (dof.current) dof.current.bokehScale = 0.4 + tunnel * 2.2 + band(p, 0.24, 0.28) * (1 - band(p, 0.34, 0.38)) * 2
    if (bloom.current) bloom.current.intensity = 0.35 + tunnel * 1.1 + motion.heat * 0.5
  })
  return null
}

export default function Ride() {
  const wrap = useRef()
  const inView = useInView(wrap, '0%')
  const near = useMountWhenNear(wrap)
  const progress = useRef({ target: 0, current: 0 }).current
  const engine = useMemo(createEngineSim, [])
  const motion = useMemo(createMotion, [])
  const worldSpeed = useRef(0)
  const dof = useRef()
  const bloom = useRef()
  const captions = useRef([])
  const flashEl = useRef()
  const meter = useRef()

  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: wrap.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress
        progress.target = p
        CAPTIONS.forEach(([a, b], i) => {
          const el = captions.current[i]
          if (el) el.classList.toggle('is-on', p >= a && p < b)
        })
        if (flashEl.current) flashEl.current.style.opacity = Math.max(0, 1 - Math.abs(p - CUT - 0.004) / 0.012) * 0.85
        if (meter.current) meter.current.style.transform = `scaleX(${p})`
        wrap.current.classList.toggle('is-night', p >= CUT && p < 0.88)
      },
    })
    return () => st.kill()
  }, [progress])

  return (
    <section id="ride" data-env="ride" className="ride" ref={wrap}>
      <div className="ride__sticky">
        {near && (
        <Canvas
          frameloop={inView ? 'always' : 'never'}
          dpr={[1, 1.5]}
          shadows
          camera={{ position: KEYS[0][1], fov: 34, near: 0.03, far: 80 }}
          gl={{ antialias: false, alpha: true }}
        >
          <color attach="background" args={['#030304']} />
          <fog attach="fog" args={['#050505', 8, 30]} />
          <EngineContext.Provider value={engine}>
            <MotionContext.Provider value={motion}>
              <StudioEnvironment copper={1.1} />
              <StudioLights copper={1.2} />
              <BikeModel />
              <StudioSet progress={progress} />
              <Tunnel progress={progress} worldSpeed={worldSpeed} />
              <Director progress={progress} engine={engine} motion={motion} worldSpeed={worldSpeed} dof={dof} bloom={bloom} />
            </MotionContext.Provider>
          </EngineContext.Provider>
          <EffectComposer multisampling={0}>
            <DepthOfField ref={dof} target={[0, 0.5, 0]} focusRange={1.6} bokehScale={0.5} />
            <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.75} intensity={0.35} />
            <Vignette offset={0.25} darkness={0.75} />
          </EffectComposer>
        </Canvas>
        )}

        <header className="ride__head">
          <p className="eyebrow"><span>05</span> Accélération · rendu temps réel</p>
          <h2 className="section__title section__title--sm">Power,<br />unleashed.</h2>
        </header>

        <ol className="ride__captions">
          {CAPTIONS.map(([, , n, text], i) => (
            <li key={n} ref={(el) => (captions.current[i] = el)} className={i === 0 ? 'is-on' : ''}>
              <span>{n}</span>
              {text}
            </li>
          ))}
        </ol>
        <div className="ride__meter"><span ref={meter} /></div>
        <div className="ride__flash" ref={flashEl} aria-hidden="true" />
      </div>
    </section>
  )
}
