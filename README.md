# The Anatomy of a Legend

Expérience web immersive autour de l'anatomie d'une Harley-Davidson (référence visuelle : photo fournie, très probablement un Sportster S 2021+).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production → dist/
```

Stack : Vite · React 19 · Three.js via React Three Fiber + Drei · postprocessing · GSAP ScrollTrigger · Zustand.

## Sections

| # | Section | Environnement | Rendu |
|---|---------|---------------|-------|
| 01 | Hero — *The Anatomy of a Legend* | BLACK STUDIO | Photo de référence + contour extrait, faisceau lumineux, lignes techniques, caméra simulée (2D) |
| 02 | Showroom 3D | INDUSTRIAL LAB | Maquette 3D : rotation, zoom, hotspots, focus caméra, reset |
| 03 | Vue éclatée — *Every part has a purpose* | BLUEPRINT MODE | 16 objets 3D distincts, explosion pilotée au scroll + EXPLODE / REASSEMBLE / curseur / pause |
| 04 | Moteur — *The heart of the beast* | METAL CHAMBER | V-twin 60° en coupe, bielle-manivelle exacte, soupapes, allumage, OFF / IDLE / REV |
| 05 | Accélération | NIGHT RIDE | Séquence temps réel pilotée au scroll, tunnel, lignes de vitesse, bloom, profondeur de champ |
| 06 | Composants — *Built from legendary components* | PURE BLACK | Hotspots sur la photo + fiches animées (SVG) |

## Honnêteté du modèle 3D

Aucun modèle 3D fidèle n'était fourni. La moto 3D est une **maquette procédurale** (primitives Three.js) calée sur
les proportions de la photo ; elle est signalée comme telle dans l'interface. Elle n'est pas une reproduction exacte des pièces réelles.

### Remplacer par un vrai modèle GLB

1. Exporter un `.glb` (Draco/meshopt conseillé) dont les nœuds racine portent les identifiants de `src/data/parts.js`
   (`frontWheel`, `fork`, `handlebar`, `tank`, `seat`, `frame`, `crankcase`, `cylinders`, `pistons`, `crankshaft`,
   `primary`, `clutch`, `gearbox`, `exhaust`, `swingarm`, `rearWheel`), à l'échelle 1 unité ≈ 1 m (empattement ~1,5).
2. Le placer dans `public/models/` et renseigner `MODEL_URL` dans `src/three/config.js`.
3. Chaque nœud trouvé remplace la pièce procédurale correspondante ; les pièces absentes restent procédurales.
   Les vecteurs d'explosion, hotspots et fiches restent inchangés.

## Données techniques

Les fiches n'affichent des chiffres que lorsqu'ils sont marqués comme données constructeur publiées pour le Sportster S,
avec la mention « à vérifier » tant que le modèle exact n'est pas confirmé (`src/data/specs.js`). Aucun chiffre n'est déduit de la photo.

## Son

Désactivé par défaut. Le bouton son ne s'active que si un fichier `public/audio/engine.mp3` est présent
(sa vitesse de lecture suit alors le régime).
