import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '../store'
import { globalEngine } from '../three/engineSim'
import { scrollToId } from '../ui/Nav'

const TITLE = [['THE', 'ANATOMY'], ['OF A', 'LEGEND']]

// The opening is a 2D composition of the reference photo: an extracted contour, a light
// beam, engineering overlays and a simulated camera move. It is not presented as 3D.
function TechOverlay() {
  return (
    <svg className="hero__tech" viewBox="0 0 1100 629" aria-hidden="true">
      <g className="draw">
        <line x1="0" y1="612" x2="1100" y2="612" />
        <line x1="232" y1="300" x2="232" y2="629" />
        <line x1="918" y1="300" x2="918" y2="629" />
        <line x1="60" y1="468" x2="400" y2="468" />
        <line x1="750" y1="470" x2="1090" y2="470" />
        <circle cx="232" cy="468" r="150" className="dash" />
        <circle cx="918" cy="470" r="150" className="dash" />
        <circle cx="590" cy="400" r="128" className="dash copper" />
        <line x1="232" y1="590" x2="918" y2="590" />
        <line x1="232" y1="582" x2="232" y2="598" />
        <line x1="918" y1="582" x2="918" y2="598" />
        <line x1="1070" y1="74" x2="1070" y2="612" />
        <line x1="1062" y1="74" x2="1078" y2="74" />
      </g>
      <g className="tags">
        <text x="240" y="300">AXE ARRIÈRE · X 232 · Y 468</text>
        <text x="926" y="300">AXE AVANT · X 918 · Y 470</text>
        <text x="575" y="582" textAnchor="middle">EMPATTEMENT</text>
        <text x="726" y="262" className="copper">BLOC MOTEUR</text>
        <text x="1062" y="66" textAnchor="end">HAUTEUR HORS TOUT</text>
      </g>
    </svg>
  )
}

export default function Hero() {
  const root = useRef()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      gsap.set(q('.hero__bike'), { '--beam': '-30%', '--spot': '0%' })
      gsap.set(q('.hero__photo, .hero__engine-glow, .hero__blur, .hero__shadow'), { opacity: 0 })
      gsap.set(q('.hero__tech .draw > *'), { strokeDasharray: 1400, strokeDashoffset: 1400 })
      gsap.set(q('.hero__tech .tags text'), { opacity: 0 })
      gsap.set(q('.hero__char'), { yPercent: 115, rotateX: -70, opacity: 0 })
      gsap.set(q('.hero__sub, .hero__actions > *, .hero__scroll, .hero__caption'), { opacity: 0, y: 18 })
      gsap.set(q('.hero__cam'), { rotateY: 16, rotateX: 4, scale: 1.14, xPercent: 6 })

      tl.to(q('.hero__cam'), { rotateY: -3, rotateX: 0, scale: 1, xPercent: 0, duration: 6.5, ease: 'power2.inOut' }, 0)
        // 1–2: darkness, then a blade of light reveals the outline
        .to(q('.hero__beam'), { left: '115%', duration: 2.1, ease: 'power2.inOut' }, 0.35)
        .to(q('.hero__bike'), { '--beam': '130%', duration: 2.1, ease: 'power2.inOut' }, 0.35)
        // 3: engineering lines draw around the silhouette
        .to(q('.hero__tech .draw > *'), { strokeDashoffset: 0, duration: 1.6, stagger: 0.06, ease: 'power2.inOut' }, 1.2)
        .to(q('.hero__tech .tags text'), { opacity: 1, duration: 0.6, stagger: 0.12 }, 2.0)
        // 4: the engine is lit first, then the rest of the machine, with a focus pull
        .to(q('.hero__engine-glow'), { opacity: 1, duration: 1.2 }, 2.1)
        .to(q('.hero__photo, .hero__shadow'), { opacity: 1, duration: 0.3 }, 2.2)
        .to(q('.hero__bike'), { '--spot': '150%', duration: 2.6, ease: 'power2.inOut', onComplete: () => q('.hero__bike')[0].classList.add('is-revealed') }, 2.2)
        .fromTo(q('.hero__blur'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 2.4)
        .to(q('.hero__blur'), { opacity: 0, duration: 1.4, ease: 'power2.inOut' }, 3.4)
        .to(q('.hero__lines'), { opacity: 0.18, duration: 1.6 }, 3.6)
        // 6: the title
        .to(q('.hero__char'), { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, stagger: 0.035, ease: 'expo.out' }, 2.7)
        .to(q('.hero__sub'), { opacity: 1, y: 0, duration: 0.8 }, 3.5)
        .to(q('.hero__actions > *'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, 3.7)
        .to(q('.hero__scroll, .hero__caption'), { opacity: 1, y: 0, duration: 0.8 }, 4.4)
        // the engine keeps breathing once the opening is over
        .add(() => prefersReducedMotion() || gsap.to(q('.hero__engine-glow'), { opacity: 0.55, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' }), 4.5)

      if (prefersReducedMotion()) tl.progress(1).pause()

      // Mouse parallax on a separate wrapper so it composes with the camera move.
      const tilt = q('.hero__tilt')[0]
      const rx = gsap.quickTo(tilt, 'rotateX', { duration: 1.2, ease: 'power3.out' })
      const ry = gsap.quickTo(tilt, 'rotateY', { duration: 1.2, ease: 'power3.out' })
      const onMove = (e) => {
        if (prefersReducedMotion()) return
        ry((e.clientX / window.innerWidth - 0.5) * 7)
        rx((e.clientY / window.innerHeight - 0.5) * -4)
      }
      window.addEventListener('pointermove', onMove)
      return () => window.removeEventListener('pointermove', onMove)
    }, root)
    return () => ctx.revert()
  }, [])

  const ignite = () => {
    globalEngine.start()
    scrollToId('engine')
  }

  return (
    <section id="hero" data-env="studio" className="hero" ref={root}>
      <div className="hero__stage" aria-hidden="true">
        <div className="hero__tilt">
          <div className="hero__cam">
            <div className="hero__bike">
              <img className="hero__lines" src="/img/bike-lines.png" alt="" />
              <div className="hero__shadow" />
              <img className="hero__blur" src="/img/bike-blur.png" alt="" />
              <img className="hero__photo" src="/img/bike.png" alt="" />
              <div className="hero__engine-glow" />
              <TechOverlay />
            </div>
          </div>
        </div>
        <div className="hero__beam" />
      </div>

      <div className="hero__copy">
        <h1 className="hero__title" aria-label="The anatomy of a legend">
          {TITLE.map((line, li) => (
            <span key={li} className="hero__line" aria-hidden="true">
              {line.map((word, wi) => (
                <span key={wi} className="hero__word">
                  {[...word].map((c, ci) => (
                    <span key={ci} className="hero__char">{c === ' ' ? ' ' : c}</span>
                  ))}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="hero__sub">Engineered to move. Built to last.</p>
        <div className="hero__actions">
          <button className="btn btn--primary" onClick={() => scrollToId('showroom')}>
            Explore the machine
          </button>
          <button className="btn btn--ghost" onClick={ignite}>
            <span className="btn__ignite" /> Ignite the engine
          </button>
        </div>
      </div>

      <p className="hero__caption">Photographie de référence · composition 2D animée</p>
      <button className="hero__scroll" onClick={() => scrollToId('showroom')}>
        <span>Défiler</span>
        <span className="hero__scroll-line" />
      </button>
    </section>
  )
}
