// 3D part registry. Units ≈ metres, x = forward, y = up, z = bike's left side (towards the viewer).
// Proportions are calibrated on the reference photo (wheelbase ≈ 1.5).
// `explode` is the offset reached at full separation; `order` staggers the motion.

export const CRANK_CENTER = [-0.05, 0.38, 0]
export const CYL_ANGLE = Math.PI / 6 // each cylinder 30° from vertical → 60° V

export const PARTS = [
  { id: 'frontWheel', label: 'Roue avant & frein', anchor: [0.75, 0.32, 0.08], explode: [0.8, -0.05, 0.1], order: 0 },
  { id: 'fork', label: 'Fourche avant', anchor: [0.6, 0.66, 0.11], explode: [0.5, 0.2, 0.45], order: 1 },
  { id: 'handlebar', label: 'Guidon & commandes', anchor: [0.4, 1.04, 0.3], explode: [0.35, 0.6, 0.1], order: 2 },
  { id: 'tank', label: 'Réservoir & carrosserie', anchor: [0.08, 0.92, 0.12], explode: [0.08, 0.7, 0], order: 3 },
  { id: 'seat', label: 'Selle & arrière', anchor: [-0.4, 0.84, 0.1], explode: [-0.4, 0.55, 0], order: 4 },
  { id: 'frame', label: 'Cadre', anchor: [0.2, 0.75, -0.1], explode: [0, 0.2, -0.75], order: 5 },
  { id: 'crankcase', label: 'Bloc moteur', anchor: [-0.05, 0.3, 0.13], explode: [0, -0.22, 0.3], order: 6 },
  { id: 'cylinders', label: 'Cylindres & culasses', anchor: [-0.05, 0.75, 0.12], explode: [0, 0.4, 0.6], order: 7 },
  { id: 'pistons', label: 'Pistons & bielles', anchor: [-0.05, 0.6, 0.02], explode: [0, 0.3, 1.0], order: 8 },
  { id: 'crankshaft', label: 'Vilebrequin', anchor: [-0.05, 0.38, 0.05], explode: [0.05, -0.02, 1.3], order: 9 },
  { id: 'primary', label: 'Transmission primaire', anchor: [0.0, 0.32, 0.17], explode: [0.2, -0.08, 1.6], order: 10 },
  { id: 'clutch', label: 'Embrayage', anchor: [0.1, 0.33, 0.12], explode: [0.4, -0.12, 1.15], order: 11 },
  { id: 'gearbox', label: 'Boîte de vitesses', anchor: [-0.24, 0.34, 0.05], explode: [-0.55, -0.26, 0.7], order: 12 },
  { id: 'exhaust', label: 'Échappements', anchor: [-0.6, 0.6, 0.2], explode: [-0.35, 0.1, 0.7], order: 13 },
  { id: 'swingarm', label: 'Bras oscillant & amortisseur', anchor: [-0.45, 0.42, 0.12], explode: [-0.45, -0.3, -0.3], order: 14 },
  { id: 'rearWheel', label: 'Roue arrière & transmission finale', anchor: [-0.75, 0.32, 0.08], explode: [-0.85, -0.05, 0.1], order: 15 },
]

export const PART_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p]))

// Which component sheet (section 06) a 3D part opens.
export const PART_TO_SHEET = {
  frontWheel: 'brakes',
  fork: 'suspension',
  handlebar: 'body',
  tank: 'body',
  seat: 'body',
  frame: 'frame',
  crankcase: 'engine',
  cylinders: 'engine',
  pistons: 'pistons',
  crankshaft: 'crankshaft',
  primary: 'transmission',
  clutch: 'transmission',
  gearbox: 'transmission',
  exhaust: 'exhaust',
  swingarm: 'suspension',
  rearWheel: 'wheels',
}

// Showroom hotspots: a curated subset, so the bike stays readable.
export const SHOWROOM_HOTSPOTS = ['cylinders', 'crankcase', 'exhaust', 'fork', 'frontWheel', 'rearWheel', 'tank', 'swingarm', 'handlebar']

const N = PARTS.length
const SPREAD = 0.4 // fraction of the timeline used for staggering

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Local separation (0..1) of a part for a global explode value t. */
export function partProgress(order, t) {
  const start = (order / (N - 1)) * SPREAD
  const local = Math.min(1, Math.max(0, (t - start) / (1 - SPREAD)))
  return ease(local)
}
