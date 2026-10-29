import { useStore } from '../store'
import { SHEETS, SHEET_BY_ID } from '../data/sheets'
import { SPECS, STATUS, SOURCE, IDENTIFICATION } from '../data/specs'
import Diagram from '../ui/Diagrams'
import bikeImg from '../assets/bike.png'

function SpecRow({ id }) {
  const s = SPECS[id]
  return (
    <div className="spec">
      <dt>{s.label}</dt>
      <dd>
        {s.value ?? '—'}
        <span className={`spec__status spec__status--${s.status}`}>{STATUS[s.status]}</span>
      </dd>
    </div>
  )
}

export default function Components() {
  const active = useStore((s) => s.sheet)
  const setSheet = useStore((s) => s.setSheet)
  const sheet = SHEET_BY_ID[active]

  return (
    <section id="components" data-env="black" className="section components">
      <header className="section__head">
        <p className="eyebrow"><span>06</span> Fiches composants</p>
        <h2 className="section__title">Built from<br />legendary components.</h2>
        <p className="section__lead">Choisissez un point sur la machine pour ouvrir sa fiche.</p>
      </header>

      <div className="components__grid">
        <div className="figure">
          <img src={bikeImg} alt="Photographie de référence : moto Harley-Davidson noire, caches moteur cuivrés, silencieux superposés." />
          {SHEETS.map((s, i) => (
            <button
              key={s.id}
              className={`pin${s.id === active ? ' is-active' : ''}`}
              style={{ left: `${s.spot[0]}%`, top: `${s.spot[1]}%` }}
              onClick={() => setSheet(s.id)}
              aria-pressed={s.id === active}
              aria-label={s.name}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>

        <div className="tabs" role="tablist" aria-label="Composants">
          {SHEETS.map((s, i) => (
            <button key={s.id} role="tab" aria-selected={s.id === active} className="tabs__tab" onClick={() => setSheet(s.id)}>
              <span>{String(i + 1).padStart(2, '0')}</span> {s.name}
            </button>
          ))}
        </div>

        <article className="sheet" key={sheet.id} role="tabpanel" aria-live="polite">
          <p className="sheet__num">{String(SHEETS.indexOf(sheet) + 1).padStart(2, '0')} / {SHEETS.length}</p>
          <h3 className="sheet__title">{sheet.name}</h3>
          <p className="sheet__lead">{sheet.lead}</p>
          <Diagram type={sheet.diagram} />
          <dl className="sheet__points">
            {sheet.points.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {sheet.specs && (
            <div className="sheet__specs">
              <dl>{sheet.specs.map((id) => <SpecRow key={id} id={id} />)}</dl>
              <p className="sheet__source">
                Hypothèse de modèle : {IDENTIFICATION.hypothesis}. {IDENTIFICATION.note} Source des valeurs : {SOURCE}.
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
