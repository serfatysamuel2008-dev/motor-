import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { PARTS, partProgress } from '../data/parts'
import { useStore } from '../store'
import { PROCEDURAL } from './Procedural'
import { PartMaterialContext, clonePalette } from './partContext'
import { HIGHLIGHT } from './materials'
import { MODEL_URL } from './config'

const zero = () => 0

function ExplodablePart({ part, getExplode, interactive, showLabels, onSelect, cloneMaterials, children }) {
  const group = useRef()
  const label = useRef()
  const glow = useRef(0)
  const mats = useRef([])
  const palette = useMemo(clonePalette, [])

  useLayoutEffect(() => {
    const seen = new Set()
    group.current.traverse((o) => {
      if (!o.isMesh || !o.material) return
      if (cloneMaterials && !o.userData.cloned) {
        o.material = o.material.clone()
        o.userData.cloned = true
      }
      const mat = o.material
      if (!seen.has(mat) && mat.emissive && mat.emissive.getHex() === 0 && !mat.transparent) {
        seen.add(mat)
        mat.emissive.copy(HIGHLIGHT)
        mat.emissiveIntensity = 0
      }
    })
    mats.current = [...seen]
  }, [cloneMaterials])

  useFrame((_, dt) => {
    const k = partProgress(part.order, getExplode())
    const [ex, ey, ez] = part.explode
    group.current.position.set(ex * k, ey * k, ez * k)

    const { hovered, selected } = useStore.getState()
    const target = hovered === part.id ? 0.55 : selected === part.id ? 0.35 : 0
    glow.current += (target - glow.current) * Math.min(1, dt * 8)
    if (glow.current > 0.001 || target === 0) mats.current.forEach((m) => (m.emissiveIntensity = glow.current))

    if (label.current) {
      const o = showLabels ? Math.min(1, Math.max(0, (k - 0.35) / 0.35)) : 0
      label.current.style.opacity = o
      label.current.style.visibility = o > 0.01 ? 'visible' : 'hidden'
    }
  })

  const events = interactive
    ? {
        onPointerOver: (e) => {
          e.stopPropagation()
          useStore.getState().setHovered(part.id)
          document.body.style.cursor = 'pointer'
        },
        onPointerOut: () => {
          if (useStore.getState().hovered === part.id) useStore.getState().setHovered(null)
          document.body.style.cursor = ''
        },
        onClick: (e) => {
          e.stopPropagation()
          onSelect?.(part.id)
        },
      }
    : {}

  return (
    <PartMaterialContext.Provider value={palette}>
      <group ref={group} name={part.id} {...events}>
        {children}
        {showLabels && (
          <Html position={part.anchor} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div ref={label} className="part-label" style={{ opacity: 0, visibility: 'hidden' }}>
              <span className="part-label__dot" />
              <span className="part-label__num">{String(part.order + 1).padStart(2, '0')}</span>
              {part.label}
            </div>
          </Html>
        )}
      </group>
    </PartMaterialContext.Provider>
  )
}

function ProceduralBike(props) {
  return PARTS.map((part) => {
    const Comp = PROCEDURAL[part.id]
    return (
      <ExplodablePart key={part.id} part={part} {...props}>
        <Comp />
      </ExplodablePart>
    )
  })
}

// Real model path: nodes named after part ids replace their procedural stand-ins.
function GLBBike(props) {
  const { scene } = useGLTF(MODEL_URL)
  return PARTS.map((part) => {
    const node = scene.getObjectByName(part.id)
    const Comp = PROCEDURAL[part.id]
    return (
      <ExplodablePart key={part.id} part={part} cloneMaterials={!!node} {...props}>
        {node ? <primitive object={node.clone(true)} /> : <Comp />}
      </ExplodablePart>
    )
  })
}

/**
 * The motorcycle as 16 separable parts.
 * @param getExplode function returning the current explode amount 0..1 (read every frame)
 */
export default function BikeModel({ getExplode = zero, interactive = false, showLabels = false, onSelect, ...rest }) {
  const props = { getExplode, interactive, showLabels, onSelect }
  return (
    <group {...rest}>
      {MODEL_URL ? (
        <Suspense fallback={<ProceduralBike {...props} />}>
          <GLBBike {...props} />
        </Suspense>
      ) : (
        <ProceduralBike {...props} />
      )}
    </group>
  )
}
