// Procedural stand-in for a real motorcycle model. Every part is a separate object so the
// explode view, highlights and focus all work the same way they will with a GLB.
// This is a demonstration mock-up calibrated on the photo's proportions, not a replica.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useMat } from './partContext'
import { useEngine, pistonDistance, crankpin, CYLINDERS } from './engineSim'
import { useMotion } from './motion'
import { CRANK_CENTER } from '../data/parts'

const UP = new THREE.Vector3(0, 1, 0)
const C = CRANK_CENTER
const CRANK_R = 0.045
const ROD_L = 0.16

const axis = (angle) => [Math.sin(angle), Math.cos(angle)]
const along = (angle, d, z = 0) => {
  const [ux, uy] = axis(angle)
  return [C[0] + ux * d, C[1] + uy * d, z]
}

export function placeBetween(obj, a, b) {
  const va = a.isVector3 ? a : new THREE.Vector3(...a)
  const vb = b.isVector3 ? b : new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const len = dir.length()
  obj.position.copy(va).addScaledVector(dir, 0.5)
  obj.quaternion.setFromUnitVectors(UP, dir.normalize())
  obj.scale.set(1, len, 1)
}

export function Rod({ from, to, radius = 0.02, material, segments = 12 }) {
  const ref = useRef()
  const setRef = (m) => {
    ref.current = m
    if (m) placeBetween(m, from, to)
  }
  return (
    <mesh ref={setRef} material={material} castShadow>
      <cylinderGeometry args={[radius, radius, 1, segments]} />
    </mesh>
  )
}

export function Tube({ points, radius = 0.02, material, closed = false, segments = 64 }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed)
    return new THREE.TubeGeometry(curve, segments, radius, 10, closed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), radius, closed, segments])
  return <mesh geometry={geo} material={material} castShadow />
}

export function Gear({ radius = 0.06, teeth = 18, depth = 0.02, material, toothMaterial, ...props }) {
  const items = useMemo(() => Array.from({ length: teeth }, (_, i) => (i / teeth) * Math.PI * 2), [teeth])
  const tooth = radius * 0.18
  return (
    <group {...props}>
      <mesh material={material} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, depth, 32]} />
      </mesh>
      {items.map((a) => (
        <mesh key={a} material={toothMaterial || material} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[tooth * 1.6, tooth * 1.1, depth]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------- wheels */

function Wheel({ x, front }) {
  const m = useMat()
  const motion = useMotion()
  const spin = useRef()
  useFrame(() => {
    if (spin.current) spin.current.rotation.z = -motion.wheelAngle
  })
  const spokes = useMemo(() => Array.from({ length: front ? 6 : 5 }, (_, i) => (i / (front ? 6 : 5)) * Math.PI * 2), [front])
  return (
    <group position={[x, 0.32, 0]}>
      <group ref={spin}>
        <mesh material={m.rubber} scale={[1, 1, front ? 1.15 : 1.35]} castShadow>
          <torusGeometry args={[0.255, 0.075, 22, 72]} />
        </mesh>
        <mesh material={m.graphite}>
          <torusGeometry args={[0.2, 0.018, 10, 64]} />
        </mesh>
        {spokes.map((a) => (
          <mesh key={a} material={m.satin} position={[Math.cos(a) * 0.125, Math.sin(a) * 0.125, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.16, 0.026, 0.03]} />
          </mesh>
        ))}
        <mesh material={m.brushed} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.15, 20]} />
        </mesh>
        {/* brake disc on the visible side */}
        <mesh material={m.brushed} position={[0, 0, 0.08]}>
          <ringGeometry args={[front ? 0.1 : 0.075, front ? 0.165 : 0.125, 56]} />
        </mesh>
        <mesh material={m.brushed} position={[0, 0, 0.078]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[front ? 0.1 : 0.075, front ? 0.165 : 0.125, 56]} />
        </mesh>
        {!front && (
          <mesh material={m.brushed} position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.03, 48]} />
          </mesh>
        )}
      </group>
      {/* caliper does not spin */}
      <group position={front ? [-0.11, 0.11, 0.09] : [0.02, -0.12, 0.09]} rotation={[0, 0, front ? 0.8 : -0.1]}>
        <RoundedBox args={[0.05, 0.11, 0.035]} radius={0.01} material={m.graphite} />
        <mesh material={m.copper} position={[0, 0, 0.02]}>
          <boxGeometry args={[0.03, 0.07, 0.004]} />
        </mesh>
      </group>
    </group>
  )
}

export function FrontWheel() {
  return <Wheel x={0.75} front />
}

export function RearWheel() {
  const m = useMat()
  const belt = useMemo(() => {
    const pts = []
    const front = [-0.2, 0.33], rear = [-0.75, 0.32]
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI / 2 - (i / 8) * Math.PI // front sprocket, right half
      pts.push([front[0] + Math.cos(a) * 0.05, front[1] + Math.sin(a) * 0.05, -0.1])
    }
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 - (i / 12) * Math.PI // rear pulley, left half
      pts.push([rear[0] + Math.cos(a) * 0.175, rear[1] + Math.sin(a) * 0.175, -0.1])
    }
    return pts
  }, [])
  return (
    <group>
      <Wheel x={-0.75} />
      <Tube points={belt} radius={0.012} material={m.satin} closed segments={120} />
    </group>
  )
}

/* ---------------------------------------------------------------- chassis */

const AXLE = new THREE.Vector3(0.75, 0.32, 0)
const HEAD = new THREE.Vector3(0.47, 1.0, 0)
const forkAt = (t, z) => AXLE.clone().lerp(HEAD, t).setZ(z)

export function Fork() {
  const m = useMat()
  const rake = Math.atan2(HEAD.x - AXLE.x, HEAD.y - AXLE.y)
  return (
    <group>
      {[-0.12, 0.12].map((z) => (
        <group key={z}>
          <Rod from={forkAt(0, z)} to={forkAt(0.36, z)} radius={0.021} material={m.chrome} />
          <Rod from={forkAt(0.3, z)} to={forkAt(1, z)} radius={0.034} material={m.satin} />
          <mesh material={m.copper} position={forkAt(0.33, z)} rotation={[0, 0, -rake]}>
            <cylinderGeometry args={[0.036, 0.036, 0.012, 16]} />
          </mesh>
        </group>
      ))}
      {[0.8, 0.98].map((t) => (
        <mesh key={t} material={m.graphite} position={forkAt(t, 0)} rotation={[0, 0, -rake]}>
          <boxGeometry args={[0.09, 0.035, 0.32]} />
        </mesh>
      ))}
      {/* short front fender */}
      <mesh material={m.paint} position={[0.75, 0.32, 0]} rotation={[0, 0, 0.55]} scale={[1, 1, 4]}>
        <torusGeometry args={[0.36, 0.022, 8, 32, 1.25]} />
      </mesh>
      <mesh material={m.amber} position={forkAt(0.5, 0.17)}>
        <sphereGeometry args={[0.012, 10, 10]} />
      </mesh>
    </group>
  )
}

export function Handlebar() {
  const m = useMat()
  const bar = [[0.35, 1.05, -0.34], [0.39, 1.04, -0.2], [0.42, 1.02, 0], [0.39, 1.04, 0.2], [0.35, 1.05, 0.34]]
  return (
    <group>
      <Tube points={bar} radius={0.014} material={m.satin} />
      {[-0.32, 0.32].map((z) => (
        <group key={z}>
          <mesh material={m.rubber} position={[0.355, 1.05, z + Math.sign(z) * 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 14]} />
          </mesh>
          <Rod from={[0.37, 1.05, z * 0.85]} to={[0.33, 1.16, z * 1.1]} radius={0.007} material={m.satin} />
          <mesh material={m.chrome} position={[0.33, 1.18, z * 1.12]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.012, 28]} />
          </mesh>
          <mesh material={m.graphite} position={[0.4, 1.03, z * 0.65]}>
            <boxGeometry args={[0.05, 0.035, 0.05]} />
          </mesh>
        </group>
      ))}
      <mesh material={m.graphite} position={[0.45, 1.08, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 28]} />
      </mesh>
      {/* headlight */}
      <group position={[0.585, 0.87, 0]}>
        <mesh material={m.satin} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.085, 0.07, 0.09, 32]} />
        </mesh>
        <mesh material={m.lens} position={[0.046, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.075, 32]} />
        </mesh>
      </group>
    </group>
  )
}

export function Tank() {
  const m = useMat()
  return (
    <group>
      <mesh material={m.paint} position={[0.08, 0.9, 0]} rotation={[0, 0, 0.12]} scale={[0.31, 0.12, 0.165]} castShadow>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>
      <mesh material={m.copper} position={[0.1, 0.9, 0]} rotation={[0, 0, 0.12]} scale={[0.25, 0.04, 0.168]}>
        <sphereGeometry args={[1, 40, 8, 0, Math.PI * 2, 1.45, 0.06]} />
      </mesh>
      <mesh material={m.chrome} position={[0.17, 1.02, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 24]} />
      </mesh>
    </group>
  )
}

export function Seat() {
  const m = useMat()
  return (
    <group>
      <RoundedBox args={[0.4, 0.07, 0.25]} radius={0.03} position={[-0.32, 0.8, 0]} rotation={[0, 0, -0.04]} material={m.seat} castShadow />
      <mesh material={m.paint} position={[-0.63, 0.82, 0]} rotation={[0, 0, 0.12]} scale={[0.3, 0.055, 0.12]}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      <mesh material={m.paint} position={[-0.3, 0.74, 0]} scale={[0.25, 0.05, 0.13]}>
        <sphereGeometry args={[1, 24, 12]} />
      </mesh>
      {/* side-mounted plate holder & tail light */}
      <Rod from={[-0.75, 0.32, 0.18]} to={[-1.0, 0.48, 0.2]} radius={0.01} material={m.satin} />
      <mesh material={m.graphite} position={[-1.02, 0.47, 0.2]}>
        <boxGeometry args={[0.04, 0.12, 0.1]} />
      </mesh>
      <mesh material={m.red} position={[-1.045, 0.5, 0.2]}>
        <boxGeometry args={[0.012, 0.03, 0.06]} />
      </mesh>
    </group>
  )
}

export function Frame() {
  const m = useMat()
  const rake = Math.atan2(HEAD.x - AXLE.x, HEAD.y - AXLE.y)
  return (
    <group>
      <mesh material={m.satin} position={forkAt(0.9, 0).setX(0.47)} rotation={[0, 0, -rake]}>
        <cylinderGeometry args={[0.042, 0.042, 0.2, 20]} />
      </mesh>
      {[-0.07, 0.07].map((z) => (
        <group key={z}>
          <Tube points={[[0.45, 0.93, z * 0.5], [0.25, 0.86, z], [-0.05, 0.78, z], [-0.22, 0.7, z], [-0.26, 0.48, z]]} radius={0.022} material={m.satin} />
          <Tube points={[[-0.2, 0.74, z], [-0.45, 0.77, z], [-0.72, 0.8, z * 0.8]]} radius={0.014} material={m.satin} />
          <Tube points={[[0.43, 0.86, z * 0.5], [0.33, 0.6, z * 1.4], [0.22, 0.36, z * 1.6]]} radius={0.018} material={m.satin} />
        </group>
      ))}
      <mesh material={m.brushed} position={[-0.25, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 16]} />
      </mesh>
    </group>
  )
}

export function Swingarm() {
  const m = useMat()
  const spring = useMemo(() => {
    const pts = []
    const a = new THREE.Vector3(-0.4, 0.43, 0), b = new THREE.Vector3(-0.32, 0.68, 0)
    for (let i = 0; i <= 80; i++) {
      const t = i / 80
      const p = a.clone().lerp(b, 0.12 + t * 0.76)
      const ang = t * Math.PI * 2 * 7
      pts.push([p.x + Math.cos(ang) * 0.03, p.y, Math.sin(ang) * 0.03])
    }
    return pts
  }, [])
  return (
    <group>
      {[-0.12, 0.12].map((z) => (
        <group key={z}>
          <Rod from={[-0.25, 0.4, z * 0.8]} to={[-0.75, 0.32, z]} radius={0.026} material={m.satin} />
        </group>
      ))}
      <Rod from={[-0.25, 0.4, -0.1]} to={[-0.25, 0.4, 0.1]} radius={0.03} material={m.graphite} />
      <Rod from={[-0.4, 0.43, 0]} to={[-0.32, 0.68, 0]} radius={0.016} material={m.chrome} />
      <Tube points={spring} radius={0.006} material={m.copper} segments={240} />
    </group>
  )
}

/* ---------------------------------------------------------------- engine */

export function Crankcase() {
  const m = useMat()
  return (
    <group>
      <RoundedBox args={[0.46, 0.28, 0.22]} radius={0.05} position={[-0.04, 0.33, 0]} material={m.satin} castShadow />
      <RoundedBox args={[0.3, 0.06, 0.18]} radius={0.02} position={[-0.02, 0.17, 0]} material={m.graphite} />
      <mesh material={m.graphite} position={[0.2, 0.3, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.03, 0.2, 0.2]} />
      </mesh>
    </group>
  )
}

function Cylinder({ angle }) {
  const m = useMat()
  return (
    <group position={C} rotation={[0, 0, -angle]}>
      <mesh material={m.satin} position={[0, 0.235, 0]}>
        <cylinderGeometry args={[0.085, 0.09, 0.19, 32]} />
      </mesh>
      {[0.17, 0.21, 0.25, 0.29].map((y) => (
        <mesh key={y} material={m.graphite} position={[0, y, 0]}>
          <cylinderGeometry args={[0.093, 0.093, 0.008, 32]} />
        </mesh>
      ))}
      <RoundedBox args={[0.21, 0.13, 0.22]} radius={0.03} position={[0, 0.395, 0]} material={m.satin} />
      {[0.112, -0.112].map((z) => (
        <RoundedBox key={z} args={[0.18, 0.105, 0.02]} radius={0.008} position={[0, 0.395, z]} material={m.copper} />
      ))}
    </group>
  )
}

export function Cylinders() {
  const m = useMat()
  return (
    <group>
      {CYLINDERS.map((c) => <Cylinder key={c.id} angle={c.angle} />)}
      {/* air box in the V */}
      <group position={[-0.05, 0.66, 0.06]}>
        <mesh material={m.graphite} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.07, 3]} />
        </mesh>
        <mesh material={m.copper} position={[0, 0, 0.037]} rotation={[0, 0, Math.PI / 6]}>
          <ringGeometry args={[0.035, 0.045, 3]} />
        </mesh>
      </group>
    </group>
  )
}

export function Pistons() {
  const m = useMat()
  const engine = useEngine()
  const pistons = useRef([])
  const rods = useRef([])
  const pin = useMemo(() => new THREE.Vector3(), [])
  const end = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const [px, py] = crankpin(engine.theta, CRANK_R)
    CYLINDERS.forEach((c, i) => {
      const s = pistonDistance(engine.theta, c.angle, CRANK_R, ROD_L)
      const [x, y] = along(c.angle, s)
      const p = pistons.current[i], r = rods.current[i]
      if (p) {
        const [ux, uy] = axis(c.angle)
        p.position.set(x + ux * 0.02, y + uy * 0.02, 0)
      }
      if (r) placeBetween(r, pin.set(C[0] + px, C[1] + py, i ? -0.02 : 0.02), end.set(x, y, i ? -0.02 : 0.02))
    })
  })
  return (
    <group>
      {CYLINDERS.map((c, i) => (
        <group key={c.id}>
          <mesh ref={(el) => (pistons.current[i] = el)} material={m.brushed} rotation={[0, 0, -c.angle]}>
            <cylinderGeometry args={[0.075, 0.075, 0.07, 28]} />
          </mesh>
          <mesh ref={(el) => (rods.current[i] = el)} material={m.chrome}>
            <boxGeometry args={[0.024, 1, 0.014]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Crankshaft() {
  const m = useMat()
  const engine = useEngine()
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -engine.theta
  })
  return (
    <group position={C}>
      <mesh material={m.brushed} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
      </mesh>
      <group ref={ref}>
        {[-0.045, 0.045].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh material={m.chrome} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.02, 32]} />
            </mesh>
            <mesh material={m.graphite} position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.072, 0.072, 0.022, 32, 1, false, Math.PI / 2, Math.PI]} />
            </mesh>
          </group>
        ))}
        <mesh material={m.copper} position={[0, CRANK_R, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.1, 16]} />
        </mesh>
        <Gear radius={0.04} teeth={14} depth={0.02} material={m.brushed} position={[0, 0, 0.12]} />
      </group>
    </group>
  )
}

export function Primary() {
  const m = useMat()
  return (
    <group position={[0, 0, 0.14]}>
      <mesh material={m.copper} position={[-0.06, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.035, 40]} />
      </mesh>
      <mesh material={m.copper} position={[0.11, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.035, 40]} />
      </mesh>
      <mesh material={m.copper} position={[0.025, 0.34, 0]}>
        <boxGeometry args={[0.17, 0.17, 0.035]} />
      </mesh>
      <mesh material={m.satin} position={[-0.06, 0.33, 0.02]}>
        <ringGeometry args={[0.055, 0.07, 40]} />
      </mesh>
      <mesh material={m.satin} position={[-0.06, 0.33, 0.019]}>
        <circleGeometry args={[0.05, 40]} />
      </mesh>
    </group>
  )
}

export function Clutch() {
  const m = useMat()
  const engine = useEngine()
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -engine.theta * 0.6
  })
  return (
    <group position={[0.11, 0.35, 0.07]} ref={ref}>
      <Gear radius={0.085} teeth={28} depth={0.016} material={m.brushed} position={[0, 0, -0.03]} />
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} material={i % 2 ? m.copper : m.chrome} position={[0, 0, -0.012 + i * 0.008]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.005, 36]} />
        </mesh>
      ))}
    </group>
  )
}

export function Gearbox() {
  const m = useMat()
  const engine = useEngine()
  const a = useRef(), b = useRef()
  useFrame(() => {
    if (a.current) a.current.rotation.z = -engine.theta * 0.6
    if (b.current) b.current.rotation.z = engine.theta * 0.45
  })
  const sizes = [0.028, 0.036, 0.043, 0.05, 0.056, 0.062]
  return (
    <group position={[-0.22, 0.34, 0]}>
      <group ref={a} position={[0.05, 0.03, 0]}>
        <Rod from={[0, 0, -0.1]} to={[0, 0, 0.1]} radius={0.01} material={m.brushed} />
        {sizes.map((r, i) => <Gear key={i} radius={r} teeth={12 + i * 2} depth={0.014} material={i % 2 ? m.graphite : m.brushed} position={[0, 0, -0.075 + i * 0.03]} />)}
      </group>
      <group ref={b} position={[-0.07, -0.03, 0]}>
        <Rod from={[0, 0, -0.1]} to={[0, 0, 0.1]} radius={0.01} material={m.brushed} />
        {[...sizes].reverse().map((r, i) => <Gear key={i} radius={r * 0.9} teeth={12 + (5 - i) * 2} depth={0.014} material={i % 2 ? m.brushed : m.graphite} position={[0, 0, -0.075 + i * 0.03]} />)}
      </group>
    </group>
  )
}

export function Exhaust() {
  const m = useMat()
  const motion = useMotion()
  const glow = useRef([])
  const glowMats = useMemo(
    () => [0, 1].map(() => new THREE.MeshStandardMaterial({ color: '#160800', emissive: '#ff7518', emissiveIntensity: 0 })),
    []
  )
  useFrame(() => {
    glow.current.forEach((g) => g && (g.material.emissiveIntensity = motion.heat * 3))
  })
  const [fx, fy] = along(CYLINDERS[0].angle, 0.36)
  const [rx, ry] = along(CYLINDERS[1].angle, 0.36)
  return (
    <group>
      <Tube points={[[fx + 0.05, fy - 0.05, 0.1], [fx + 0.1, fy - 0.2, 0.16], [0.12, 0.4, 0.2], [-0.15, 0.44, 0.21], [-0.4, 0.5, 0.18]]} radius={0.026} material={m.satin} />
      <Tube points={[[rx - 0.05, ry - 0.03, 0.1], [rx - 0.12, ry - 0.04, 0.17], [-0.4, 0.64, 0.18]]} radius={0.026} material={m.satin} />
      {[[0.66, 0.065], [0.5, 0.07]].map(([y, r], i) => (
        <group key={y} position={[-0.63, y, 0.18]} rotation={[0, 0, Math.PI / 2 + (i ? 0.03 : -0.02)]}>
          <mesh material={m.brushed} castShadow>
            <cylinderGeometry args={[r, r, 0.42, 36]} />
          </mesh>
          <mesh material={m.graphite} position={[0, 0.215, 0]}>
            <cylinderGeometry args={[r * 0.98, r * 0.98, 0.012, 36]} />
          </mesh>
          <mesh
            ref={(el) => (glow.current[i] = el)}
            position={[0, 0.222, 0]}
            material={glowMats[i]}
          >
            <circleGeometry args={[r * 0.6, 24]} />
          </mesh>
        </group>
      ))}
      <mesh material={m.graphite} position={[-0.2, 0.45, 0.235]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.36, 0.06, 0.012]} />
      </mesh>
    </group>
  )
}

export const PROCEDURAL = {
  frontWheel: FrontWheel,
  fork: Fork,
  handlebar: Handlebar,
  tank: Tank,
  seat: Seat,
  frame: Frame,
  crankcase: Crankcase,
  cylinders: Cylinders,
  pistons: Pistons,
  crankshaft: Crankshaft,
  primary: Primary,
  clutch: Clutch,
  gearbox: Gearbox,
  exhaust: Exhaust,
  swingarm: Swingarm,
  rearWheel: RearWheel,
}
