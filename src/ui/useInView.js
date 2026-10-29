import { useEffect, useState } from 'react'

/** True while the element is near the viewport — used to pause off-screen canvases. */
export function useInView(ref, margin = '15%') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: `${margin} 0px` })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

// Heavy WebGL setup (shader compilation, environment capture) is held back until the
// visitor scrolls or the opening sequence has had time to play without hitches.
let warm = false
const warmListeners = new Set()
function setWarm() {
  if (warm) return
  warm = true
  warmListeners.forEach((fn) => fn())
}
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', setWarm, { once: true, passive: true })
  setTimeout(setWarm, 6000)
}

/** Latches to true the first time the element comes within `margin` of the viewport. */
export function useMountWhenNear(ref, margin = '35%') {
  const [near, setNear] = useState(false)
  const [ready, setReady] = useState(warm)
  useEffect(() => {
    if (ready) return
    const fn = () => setReady(true)
    warmListeners.add(fn)
    return () => warmListeners.delete(fn)
  }, [ready])
  useEffect(() => {
    if (near || !ready || !ref.current) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: `${margin} 0px` })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, margin, near, ready])
  return near
}
