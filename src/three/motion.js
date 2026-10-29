import { createContext, useContext } from 'react'

// Mutable values read inside useFrame (no React renders): wheel rotation and exhaust heat.
export const createMotion = () => ({ wheelAngle: 0, heat: 0 })
export const MotionContext = createContext(createMotion())
export const useMotion = () => useContext(MotionContext)
