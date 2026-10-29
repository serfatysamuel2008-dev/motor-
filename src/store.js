import { create } from 'zustand'

export const ENVIRONMENTS = {
  studio: 'BLACK STUDIO',
  lab: 'INDUSTRIAL LAB',
  chamber: 'METAL CHAMBER',
  ride: 'NIGHT RIDE',
  blueprint: 'BLUEPRINT MODE',
  black: 'PURE BLACK',
}

export const useStore = create((set) => ({
  env: 'studio',
  setEnv: (env) => set({ env }),

  // Showroom selection / hover (part ids from data/parts.js)
  selected: null,
  hovered: null,
  setSelected: (selected) => set({ selected }),
  setHovered: (hovered) => set({ hovered }),

  // Explode view: value 0..1; mode 'scroll' follows the page, 'manual' follows controls
  explode: 0,
  explodeMode: 'scroll',
  explodePaused: false,
  setExplode: (explode) => set({ explode }),
  setExplodeMode: (explodeMode) => set({ explodeMode }),
  setExplodePaused: (explodePaused) => set({ explodePaused }),

  // Component sheet open in section 06
  sheet: 'engine',
  setSheet: (sheet) => set({ sheet }),
}))

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
