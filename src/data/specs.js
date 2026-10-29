// Nothing here is inferred from the photo. The photo is visually consistent with a
// Harley-Davidson Sportster S (2021+), but that identification is not confirmed, so
// every manufacturer figure carries status 'to-verify' until the exact model is known.

export const IDENTIFICATION = {
  hypothesis: 'Sportster S (2021+)',
  note: 'Identification visuelle à partir de la photo — non confirmée.',
}

export const SOURCE = 'Fiche constructeur publiée pour le Sportster S 2021+ (harley-davidson.com)'

export const STATUS = {
  'to-verify': 'À vérifier',
  unknown: 'Inconnu',
}

export const SPECS = {
  engine: { label: 'Moteur', value: 'Revolution Max 1250T', status: 'to-verify' },
  layout: { label: 'Architecture', value: 'Bicylindre en V à 60°, refroidissement liquide', status: 'to-verify' },
  displacement: { label: 'Cylindrée', value: '1 252 cm³', status: 'to-verify' },
  power: { label: 'Puissance', value: '121 ch (90 kW) à 7 500 tr/min', status: 'to-verify' },
  torque: { label: 'Couple', value: '127 N·m à 6 000 tr/min', status: 'to-verify' },
  gearbox: { label: 'Boîte', value: '6 rapports', status: 'to-verify' },
  finalDrive: { label: 'Transmission finale', value: 'Courroie', status: 'to-verify' },
  weight: { label: 'Masse', value: null, status: 'unknown' },
  brakeSize: { label: 'Diamètre des disques', value: null, status: 'unknown' },
  tyres: { label: 'Dimensions des pneus', value: null, status: 'unknown' },
  suspensionTravel: { label: 'Débattement', value: null, status: 'unknown' },
}
