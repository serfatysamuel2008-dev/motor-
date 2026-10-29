import * as THREE from 'three'

// One shared palette. ExplodablePart clones these per part so highlighting stays local.
export const M = {
  paint: new THREE.MeshPhysicalMaterial({ color: '#060606', metalness: 0.35, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }),
  satin: new THREE.MeshStandardMaterial({ color: '#141516', metalness: 0.55, roughness: 0.48 }),
  graphite: new THREE.MeshStandardMaterial({ color: '#1d1f22', metalness: 0.7, roughness: 0.38 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#c4c7cb', metalness: 1, roughness: 0.16 }),
  brushed: new THREE.MeshStandardMaterial({ color: '#777b80', metalness: 0.92, roughness: 0.36 }),
  copper: new THREE.MeshStandardMaterial({ color: '#b77743', metalness: 1, roughness: 0.28 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#0a0a0a', metalness: 0, roughness: 0.86 }),
  seat: new THREE.MeshStandardMaterial({ color: '#121212', metalness: 0, roughness: 0.7 }),
  lens: new THREE.MeshStandardMaterial({ color: '#f1f0ec', emissive: '#f1f0ec', emissiveIntensity: 1.6, roughness: 0.1 }),
  amber: new THREE.MeshStandardMaterial({ color: '#ff7518', emissive: '#ff7518', emissiveIntensity: 1.2 }),
  red: new THREE.MeshStandardMaterial({ color: '#7a0b0b', emissive: '#c4120f', emissiveIntensity: 1.4 }),
  glass: new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
}

export const HIGHLIGHT = new THREE.Color('#ff7518')
