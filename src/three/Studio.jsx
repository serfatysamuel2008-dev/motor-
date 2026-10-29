import { Environment, Lightformer, ContactShadows } from '@react-three/drei'

// Reflections come from in-scene light panels rather than a downloaded HDR, so the scene
// works offline and the reflections match the art direction (cold steel key, copper rim).
export function StudioEnvironment({ copper = 1, intensity = 1 }) {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#050505']} />
      <Lightformer form="rect" intensity={2.4 * intensity} color="#f1f0ec" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
      <Lightformer form="rect" intensity={1.6 * intensity} color="#c4c7cb" position={[-5, 1.2, 2]} rotation-y={Math.PI / 2} scale={[6, 0.6, 1]} />
      <Lightformer form="rect" intensity={1.2 * intensity} color="#c4c7cb" position={[5, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[6, 0.4, 1]} />
      <Lightformer form="rect" intensity={2.2 * copper} color="#b77743" position={[0, 1, -5]} scale={[10, 1.4, 1]} />
      <Lightformer form="ring" intensity={1.4 * copper} color="#ff7518" position={[3, 2, 4]} scale={1.4} />
    </Environment>
  )
}

export function StudioLights({ copper = 1 }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#f1f0ec" castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[-3, 2.5, -2]} angle={0.5} penumbra={0.8} intensity={30 * copper} color="#b77743" />
      <pointLight position={[0.2, 0.5, 1.2]} intensity={1.2 * copper} distance={2.5} color="#ff7518" />
    </>
  )
}

export function Floor({ opacity = 0.65 }) {
  return <ContactShadows position={[0, 0, 0]} opacity={opacity} scale={4} blur={2.4} far={1.2} resolution={512} color="#000000" />
}
