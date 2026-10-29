// Cut-away 60° V-twin for the engine section. Simplified to a single shared crankpin, but
// every moving part follows the real slider-crank relation: nothing is randomly animated.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Edges } from '@react-three/drei'
import { M } from './materials'
import { Gear, placeBetween } from './Procedural'
import { useEngine, CYLINDERS, pistonDistance, crankpin, cyclePhase, exhaustLift, intakeLift, flash, REDLINE } from './engineSim'

const R = 0.32 // crank throw
const L = 1.25 // rod length — long enough that the two pistons clear each other at BDC
const BORE = 0.42
const DECK = R + L + 0.36 // top of barrel along the axis
const PISTON_H = 0.4
const PIN = 0.12 // piston pin sits below the piston centre
const BARREL_START = 0.9

const ax = (a) => new THREE.Vector2(Math.sin(a), Math.cos(a))

const glassMat = new THREE.MeshPhysicalMaterial({ color: '#8d949b', metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })
const flameMat = new THREE.MeshBasicMaterial({ color: '#ff7518', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })

function CylinderAssembly({ cyl, cutaway, sparks }) {
  const engine = useEngine()
  const piston = useRef()
  const valves = useRef([])
  const cams = useRef([])
  const flame = useRef()
  const light = useRef()
  const flameMaterial = useMemo(() => flameMat.clone(), [])
  const u = ax(cyl.angle)
  const headH = 0.42

  useFrame(() => {
    const s = pistonDistance(engine.theta, cyl.angle, R, L)
    if (piston.current) piston.current.position.y = s + PIN
    const phase = cyclePhase(engine.theta, cyl.fireAt)
    const lifts = [intakeLift(phase), exhaustLift(phase)]
    valves.current.forEach((v, i) => v && (v.position.y = DECK + 0.2 - lifts[i] * 0.09))
    cams.current.forEach((c, i) => c && (c.rotation.z = -(engine.theta - cyl.fireAt) / 2 + i * 1.3))
    const f = engine.rpm > 50 ? flash(phase) : 0
    flameMaterial.opacity = f * 0.85
    if (flame.current) {
      const crown = s + PIN + PISTON_H / 2
      flame.current.position.y = (crown + DECK + 0.08) / 2
      flame.current.scale.y = Math.max(0.01, DECK + 0.08 - crown)
    }
    if (light.current) light.current.intensity = f * 9 * sparks
  })

  return (
    <group rotation={[0, 0, -cyl.angle]}>
      {/* barrel */}
      <mesh material={cutaway ? glassMat : M.satin} position={[0, (BARREL_START + DECK) / 2, 0]}>
        <cylinderGeometry args={[BORE + 0.06, BORE + 0.08, DECK - BARREL_START, 48, 1, cutaway]} />
        {cutaway && <Edges color="#777b80" threshold={30} />}
      </mesh>
      {[0.35, 0.55, 0.75, 0.95].map((t) => (
        <mesh key={t} material={M.graphite} position={[0, BARREL_START + (DECK - BARREL_START) * t, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[BORE + 0.085, 0.012, 6, 64]} />
        </mesh>
      ))}

      {/* head */}
      <group position={[0, DECK + headH / 2, 0]}>
        <RoundedBox args={[1.1, headH, 1.0]} radius={0.06} material={cutaway ? glassMat : M.satin}>
          {cutaway && <Edges color="#b77743" threshold={20} />}
        </RoundedBox>
        <RoundedBox args={[0.92, headH * 0.8, 0.05]} radius={0.02} position={[0, 0, 0.52]} material={M.copper} visible={!cutaway} />
        {/* camshafts */}
        {[-0.24, 0.24].map((x, i) => (
          <group key={x} position={[x, headH * 0.18, 0]} ref={(el) => (cams.current[i] = el)}>
            <mesh material={M.chrome} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 1.0, 12]} />
            </mesh>
            {[-0.18, 0.18].map((z) => (
              <mesh key={z} material={M.copper} position={[0, 0.03, z]} scale={[1, 1.5, 1]}>
                <cylinderGeometry args={[0.07, 0.07, 0.07, 20]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* spark plug */}
        <mesh material={M.chrome} position={[0, headH * 0.3, 0.2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.3, 12]} />
        </mesh>
      </group>

      {/* valves: intake (front) / exhaust (back) */}
      {[-0.18, 0.18].map((x, i) => (
        <group key={x} position={[x, DECK + 0.2, 0]} ref={(el) => (valves.current[i] = el)}>
          <mesh material={i ? M.copper : M.chrome} position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.42, 10]} />
          </mesh>
          <mesh material={i ? M.copper : M.chrome} position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.13, 0.04, 0.04, 24]} />
          </mesh>
        </group>
      ))}

      {/* piston */}
      <group ref={piston}>
        <mesh material={M.brushed}>
          <cylinderGeometry args={[BORE, BORE, PISTON_H, 48]} />
        </mesh>
        {[0.16, 0.12, 0.08].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[BORE + 0.002, 0.008, 6, 64]} />
            <meshStandardMaterial color="#111214" />
          </mesh>
        ))}
        <mesh material={M.chrome} position={[0, -PIN, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 16]} />
        </mesh>
      </group>

      {/* combustion */}
      <mesh ref={flame} material={flameMaterial}>
        <cylinderGeometry args={[BORE * 0.92, BORE * 0.92, 1, 32]} />
      </mesh>
      <pointLight ref={light} position={[0, DECK - 0.05, 0.3]} color="#ff7518" distance={3.5} intensity={0} />
    </group>
  )
}

function Rods() {
  const engine = useEngine()
  const rods = useRef([])
  const bigEnds = useRef([])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const [px, py] = crankpin(engine.theta, R)
    CYLINDERS.forEach((c, i) => {
      const s = pistonDistance(engine.theta, c.angle, R, L)
      const u = ax(c.angle)
      const z = i ? -0.11 : 0.11 // fork-and-blade rods side by side on the pin
      a.set(px, py, z)
      b.set(u.x * s, u.y * s, z)
      if (rods.current[i]) placeBetween(rods.current[i], a, b)
      if (bigEnds.current[i]) bigEnds.current[i].position.set(px, py, z)
    })
  })
  return CYLINDERS.map((c, i) => (
    <group key={c.id}>
      <mesh ref={(el) => (rods.current[i] = el)} material={M.chrome}>
        <boxGeometry args={[0.12, 1, 0.08]} />
      </mesh>
      <mesh ref={(el) => (bigEnds.current[i] = el)} material={M.chrome}>
        <torusGeometry args={[0.1, 0.035, 10, 28]} />
      </mesh>
    </group>
  ))
}

function Crank() {
  const engine = useEngine()
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -engine.theta
  })
  return (
    <group>
      <mesh material={M.brushed} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.6, 20]} />
      </mesh>
      <group ref={ref}>
        {[-0.24, 0.24].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh material={M.chrome} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.46, 0.46, 0.09, 48]} />
            </mesh>
            <mesh material={M.copper} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z > 0 ? 0.05 : -0.05]}>
              <cylinderGeometry args={[0.48, 0.48, 0.012, 48, 1, false, Math.PI / 2, Math.PI]} />
            </mesh>
          </group>
        ))}
        <mesh material={M.copper} position={[0, R, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.48, 20]} />
        </mesh>
        <Gear radius={0.28} teeth={26} depth={0.08} material={M.brushed} position={[0, 0, 0.62]} />
      </group>
    </group>
  )
}

function Case({ cutaway }) {
  return (
    <group position={[0, -0.05, 0]}>
      <RoundedBox args={[2.1, 1.25, 1.3]} radius={0.12} material={cutaway ? glassMat : M.satin}>
        {cutaway && <Edges color="#777b80" threshold={20} />}
      </RoundedBox>
      {/* rear half of the case stays solid so the moving parts read against it */}
      <mesh position={[0, 0, -0.66]} material={M.graphite}>
        <boxGeometry args={[2.0, 1.15, 0.03]} />
      </mesh>
    </group>
  )
}

export default function VTwin({ cutaway = true, ...props }) {
  const engine = useEngine()
  const shake = useRef()
  useFrame(({ clock }) => {
    if (!shake.current) return
    const amp = (engine.rpm / REDLINE) * 0.012 + (engine.rpm > 10 ? 0.002 : 0)
    const t = clock.elapsedTime
    shake.current.position.set(Math.sin(t * 71) * amp, Math.sin(t * 53 + 1) * amp, 0)
    shake.current.rotation.z = Math.sin(t * 37) * amp * 0.4
  })
  return (
    <group {...props}>
      <group ref={shake}>
        <Case cutaway={cutaway} />
        <Crank />
        <Rods />
        {CYLINDERS.map((c) => <CylinderAssembly key={c.id} cyl={c} cutaway={cutaway} sparks={1} />)}
      </group>
    </group>
  )
}
