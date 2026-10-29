// Component sheets for section 06. `spot` is the hotspot position on the reference
// photo in percent of its width / height. `diagram` selects the animated illustration.

export const SHEETS = [
  {
    id: 'engine',
    name: 'Le moteur',
    spot: [61.4, 50.9],
    diagram: 'cycle',
    lead: 'Transforme l’énergie chimique de l’essence en rotation.',
    points: [
      ['Fonction', 'Brûler un mélange air-essence pour pousser deux pistons, quatre temps après quatre temps.'],
      ['Architecture', 'Deux cylindres disposés en V autour d’un vilebrequin commun.'],
      ['Principe', 'Admission, compression, combustion-détente, échappement : un cycle par deux tours de vilebrequin.'],
      ['Composants internes', 'Pistons, bielles, vilebrequin, arbres à cames, soupapes, pompe à huile et à eau.'],
    ],
    specs: ['engine', 'layout', 'displacement', 'power', 'torque'],
  },
  {
    id: 'pistons',
    name: 'Les pistons',
    spot: [47.7, 50.9],
    diagram: 'piston',
    lead: 'Reçoivent la pression de la combustion.',
    points: [
      ['Fonction', 'Encaisser l’explosion et transmettre la poussée à la bielle.'],
      ['Mouvement', 'Alternatif : un aller-retour du point mort haut au point mort bas à chaque tour.'],
      ['Liaison', 'Axe de piston → bielle → maneton du vilebrequin.'],
      ['Étanchéité', 'Des segments assurent le contact avec la paroi du cylindre.'],
    ],
  },
  {
    id: 'crankshaft',
    name: 'Le vilebrequin',
    spot: [47.3, 73.1],
    diagram: 'crank',
    lead: 'Change un va-et-vient en rotation.',
    points: [
      ['Fonction', 'Convertir le mouvement alternatif des pistons en mouvement rotatif.'],
      ['Relation', 'Les deux bielles tirent et poussent sur le maneton, décentré de l’axe.'],
      ['Inertie', 'Les masses d’équilibrage lissent les à-coups entre deux combustions.'],
    ],
  },
  {
    id: 'transmission',
    name: 'La transmission',
    spot: [56.8, 72.3],
    diagram: 'drivetrain',
    lead: 'Achemine la puissance du vilebrequin à la roue arrière.',
    points: [
      ['Primaire', 'Relie le vilebrequin à l’embrayage par engrenages.'],
      ['Embrayage', 'Un empilement de disques qui couple ou découple le moteur de la boîte.'],
      ['Boîte de vitesses', 'Des paires de pignons choisissent le rapport entre régime moteur et vitesse.'],
      ['Finale', 'Une courroie entraîne la couronne de la roue arrière.'],
    ],
    specs: ['gearbox', 'finalDrive'],
  },
  {
    id: 'exhaust',
    name: 'Les échappements',
    spot: [26.4, 52.5],
    diagram: 'exhaust',
    lead: 'Évacuent les gaz brûlés, dosent le son.',
    points: [
      ['Évacuation', 'Les gaz quittent les culasses par les collecteurs à chaque ouverture des soupapes d’échappement.'],
      ['Parcours', 'Culasses → collecteurs → silencieux superposés → sortie arrière.'],
      ['Acoustique', 'Les chambres du silencieux atténuent et sculptent le son.'],
      ['Thermique', 'Acier inoxydable et caches de protection gèrent des centaines de degrés.'],
    ],
  },
  {
    id: 'suspension',
    name: 'Les suspensions',
    spot: [78.2, 52.5],
    diagram: 'suspension',
    lead: 'Gardent les pneus collés à la route.',
    points: [
      ['Fourche avant', 'Deux tubes télescopiques contenant ressorts et amortissement hydraulique.'],
      ['Arrière', 'Un amortisseur relie le bras oscillant au cadre.'],
      ['Rôle', 'Absorber les irrégularités et contrôler le rebond.'],
    ],
    specs: ['suspensionTravel'],
  },
  {
    id: 'brakes',
    name: 'Les freins',
    spot: [82.3, 68.4],
    diagram: 'brake',
    lead: 'Transforment la vitesse en chaleur.',
    points: [
      ['Disque', 'Solidaire de la roue, il tourne avec elle.'],
      ['Étrier', 'Fixé à la fourche ; ses pistons hydrauliques serrent les plaquettes.'],
      ['Plaquettes', 'La friction contre le disque convertit l’énergie cinétique en chaleur.'],
    ],
    specs: ['brakeSize'],
  },
  {
    id: 'wheels',
    name: 'Roues & pneus',
    spot: [11.8, 82.7],
    diagram: 'wheel',
    lead: 'Le seul contact avec la route.',
    points: [
      ['Jantes', 'Structure légère qui porte le pneu, le disque et la couronne.'],
      ['Pneumatiques', 'Leur carcasse et leur gomme encaissent la charge et transmettent l’adhérence.'],
      ['Contact', 'Une surface de la taille d’une carte de crédit par pneu.'],
    ],
    specs: ['tyres'],
  },
  {
    id: 'frame',
    name: 'Le cadre',
    spot: [69.1, 46.1],
    diagram: 'frame',
    lead: 'Le squelette qui tient tout ensemble.',
    points: [
      ['Fonction', 'Relier la direction, le moteur et le bras oscillant dans une géométrie précise.'],
      ['Support', 'Porte le moteur, le réservoir, la selle et les commandes.'],
      ['Efforts', 'Répartit les charges du freinage, de l’accélération et du poids.'],
    ],
    specs: ['weight'],
  },
  {
    id: 'body',
    name: 'Réservoir & carrosserie',
    spot: [54.5, 34.2],
    diagram: 'body',
    lead: 'L’identité visuelle de la machine.',
    points: [
      ['Réservoir', 'Contient le carburant et donne sa ligne à la moto.'],
      ['Selle', 'Assise solo, basse et courte.'],
      ['Garde-boue', 'Courts, réduits à leur fonction.'],
      ['Finitions', 'Noir brillant, caches moteur cuivrés, acier brossé sur les silencieux.'],
    ],
  },
]

export const SHEET_BY_ID = Object.fromEntries(SHEETS.map((s) => [s.id, s]))
