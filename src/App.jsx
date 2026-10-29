import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from './store'
import { ensureEngineTicker } from './three/engineSim'
import EnvBackdrop from './ui/EnvBackdrop'
import Nav from './ui/Nav'
import Hero from './sections/Hero'
import Showroom from './sections/Showroom'
import Explode from './sections/Explode'
import Engine from './sections/Engine'
import Ride from './sections/Ride'
import Components from './sections/Components'
import Outro from './sections/Outro'

gsap.registerPlugin(ScrollTrigger)

function useEnvironmentObserver() {
  useEffect(() => {
    const setEnv = useStore.getState().setEnv
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setEnv(e.target.dataset.env)),
      { rootMargin: '-50% 0px -50% 0px' }
    )
    document.querySelectorAll('[data-env]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export default function App() {
  useEnvironmentObserver()
  useEffect(() => {
    ensureEngineTicker()
    // Fonts and canvases change section heights after first layout.
    const t = setTimeout(() => ScrollTrigger.refresh(), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <EnvBackdrop />
      <Nav />
      <main>
        <Hero />
        <Showroom />
        <Explode />
        <Engine />
        <Ride />
        <Components />
        <Outro />
      </main>
    </>
  )
}
