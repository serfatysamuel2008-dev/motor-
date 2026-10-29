import { createContext, useContext } from 'react'
import { CYL_ANGLE } from '../data/parts'

export const IDLE_RPM = 900
export const REDLINE = 8000
// The animation runs 25× slower than the displayed rpm, so every stroke stays readable.
export const SLOWMO = 25

const TAU = Math.PI * 2
const deg = (d) => (d * Math.PI) / 180

// Single shared crankpin, cylinders at ±30° from vertical. A piston sits at TDC when the
// crank angle equals its cylinder angle. Firing: front at 30°, rear 300° later (300/420 spacing).
export const CYLINDERS = [
  { id: 'front', angle: CYL_ANGLE, fireAt: deg(30) },
  { id: 'rear', angle: -CYL_ANGLE, fireAt: deg(330) },
]

/** Distance from crank centre to piston pin along the cylinder axis (slider-crank). */
export function pistonDistance(theta, cylAngle, r, l) {
  const a = theta - cylAngle
  const s = r * Math.sin(a)
  return r * Math.cos(a) + Math.sqrt(l * l - s * s)
}

/** Crankpin offset from crank centre (theta measured clockwise from vertical, in the XY plane). */
export function crankpin(theta, r) {
  return [r * Math.sin(theta), r * Math.cos(theta)]
}

/** Position in the 720° four-stroke cycle of a cylinder, 0 = ignition at TDC. */
export function cyclePhase(theta, fireAt) {
  return (((theta - fireAt) % (2 * TAU)) + 2 * TAU) % (2 * TAU)
}

const bump = (phase, start, dur) => {
  const a = phase - start
  return a > 0 && a < dur ? Math.sin((Math.PI * a) / dur) : 0
}
export const exhaustLift = (phase) => bump(phase, deg(160), deg(220))
export const intakeLift = (phase) => bump(phase, deg(340), deg(220))
export const flash = (phase) => (phase < deg(140) ? Math.exp(-phase / deg(35)) : 0)

export const STROKES = ['Combustion', 'Échappement', 'Admission', 'Compression']
export const strokeOf = (phase) => STROKES[Math.floor(phase / Math.PI) % 4]

export function createEngineSim() {
  const sim = {
    state: 'off', // off | idle | rev
    rpm: 0,
    theta: deg(30),
    throttle: 0, // extra rpm requested by the slider while running
    listeners: new Set(),
    setState(state) {
      sim.state = state
      sim.listeners.forEach((fn) => fn(state))
    },
    subscribe(fn) {
      sim.listeners.add(fn)
      return () => sim.listeners.delete(fn)
    },
    start() { if (sim.state === 'off') sim.setState('idle') },
    stop() { sim.throttle = 0; sim.setState('off') },
    rev() { if (sim.state !== 'off') sim.setState('rev') },
    update(dt) {
      dt = Math.min(dt, 0.05)
      let target = 0
      let rate = 1.4
      if (sim.state === 'idle') {
        target = IDLE_RPM + sim.throttle
        rate = sim.rpm < IDLE_RPM * 0.7 ? 1.8 : 2.2 // starter cranks it up progressively
      } else if (sim.state === 'rev') {
        target = 7200
        rate = 7
        if (sim.rpm > 6800) sim.setState('idle') // then falls back slowly
      }
      if (sim.state === 'idle' && sim.rpm > target + 200) rate = 1.1
      sim.rpm += (target - sim.rpm) * Math.min(1, dt * rate)
      if (sim.state === 'off' && sim.rpm < 4) sim.rpm = 0
      sim.theta += ((sim.rpm / 60) * TAU * dt) / SLOWMO
    },
  }
  return sim
}

export const globalEngine = createEngineSim()
export const EngineContext = createContext(globalEngine)
export const useEngine = () => useContext(EngineContext)

// The shared engine is advanced by one rAF loop, whatever the number of canvases reading it.
let ticking = false
export function ensureEngineTicker() {
  if (ticking || typeof requestAnimationFrame === 'undefined') return
  ticking = true
  let last = performance.now()
  const loop = (now) => {
    globalEngine.update((now - last) / 1000)
    last = now
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}
