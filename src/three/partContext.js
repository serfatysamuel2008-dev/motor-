import { createContext, useContext } from 'react'
import { M } from './materials'

// Each part receives its own clone of the palette so it can glow without affecting others.
export const PartMaterialContext = createContext(M)
export const useMat = () => useContext(PartMaterialContext)

export function clonePalette() {
  return Object.fromEntries(Object.entries(M).map(([k, mat]) => [k, mat.clone()]))
}
