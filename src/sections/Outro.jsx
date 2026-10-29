import { scrollToId } from '../ui/Nav'

export default function Outro() {
  return (
    <footer id="outro" data-env="black" className="outro">
      <p className="outro__big">Ride it.<br />Understand it.</p>
      <button className="btn btn--ghost" onClick={() => scrollToId('hero')}>Revenir au début</button>
      <div className="outro__notes">
        <p>
          Les vues 3D utilisent une maquette procédurale de démonstration, calée sur les proportions de la photo. Elle ne
          reproduit pas fidèlement chaque pièce et peut être remplacée par un modèle GLB découpé par composant.
        </p>
        <p>
          Les chiffres affichés sont des données constructeur publiées pour le modèle supposé et restent à vérifier.
          Harley-Davidson est une marque de son propriétaire ; ce projet est une étude non officielle.
        </p>
      </div>
    </footer>
  )
}
