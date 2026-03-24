export interface Materiau {
  id: number
  nom: string
  reference: string
  categorie: string
  quantite: number
  unite: string
  seuilAlerte: number
  prixUnitaire: number
}

export interface LigneUtilisation {
  materiauId: number
  nomMateriau: string
  quantite: number
  unite: string
}

export interface Utilisation {
  id: number
  date: string
  intervention: string
  client: string
  lignes: LigneUtilisation[]
  note?: string
}

const DEFAULT_STOCK: Materiau[] = [
  { id: 1,  nom: 'Robinet mitigeur lavabo',    reference: 'ROB-001', categorie: 'Robinetterie',  quantite: 8,   unite: 'pcs',      seuilAlerte: 3,  prixUnitaire: 45.00 },
  { id: 2,  nom: 'Robinet mitigeur douche',    reference: 'ROB-002', categorie: 'Robinetterie',  quantite: 5,   unite: 'pcs',      seuilAlerte: 2,  prixUnitaire: 65.00 },
  { id: 3,  nom: 'Flexible alimentation 40cm', reference: 'FLX-001', categorie: 'Robinetterie',  quantite: 20,  unite: 'pcs',      seuilAlerte: 5,  prixUnitaire: 5.20  },
  { id: 4,  nom: 'Joint plat 3/4"',            reference: 'JNT-001', categorie: 'Joints',        quantite: 200, unite: 'pcs',      seuilAlerte: 20, prixUnitaire: 0.30  },
  { id: 5,  nom: 'Joint torique 20mm',         reference: 'JNT-002', categorie: 'Joints',        quantite: 50,  unite: 'pcs',      seuilAlerte: 10, prixUnitaire: 0.80  },
  { id: 6,  nom: 'Bande téflon',               reference: 'ETN-001', categorie: 'Étanchéité',    quantite: 30,  unite: 'rouleaux', seuilAlerte: 5,  prixUnitaire: 1.50  },
  { id: 7,  nom: 'Tuyau cuivre 14mm',          reference: 'TUY-001', categorie: 'Tuyauterie',    quantite: 25,  unite: 'm',        seuilAlerte: 5,  prixUnitaire: 4.50  },
  { id: 8,  nom: 'Tuyau PER 16mm',             reference: 'TUY-002', categorie: 'Tuyauterie',    quantite: 50,  unite: 'm',        seuilAlerte: 10, prixUnitaire: 1.80  },
  { id: 9,  nom: 'Coude cuivre 14mm',          reference: 'ACC-001', categorie: 'Accessoires',   quantite: 30,  unite: 'pcs',      seuilAlerte: 5,  prixUnitaire: 2.20  },
  { id: 10, nom: 'Té égal cuivre 14mm',        reference: 'ACC-002', categorie: 'Accessoires',   quantite: 15,  unite: 'pcs',      seuilAlerte: 3,  prixUnitaire: 3.50  },
  { id: 11, nom: 'Vanne quart de tour 1/2"',   reference: 'VAN-001', categorie: 'Vannes',        quantite: 12,  unite: 'pcs',      seuilAlerte: 3,  prixUnitaire: 12.00 },
  { id: 12, nom: 'Siphon évier bouteille',     reference: 'SIP-001', categorie: 'Évacuation',    quantite: 6,   unite: 'pcs',      seuilAlerte: 2,  prixUnitaire: 8.50  },
  { id: 13, nom: 'Té PER 16mm',               reference: 'ACC-003', categorie: 'Accessoires',   quantite: 2,   unite: 'pcs',      seuilAlerte: 5,  prixUnitaire: 2.80  },
  { id: 14, nom: 'Colle PVC',                  reference: 'ETN-002', categorie: 'Étanchéité',    quantite: 4,   unite: 'pots',     seuilAlerte: 2,  prixUnitaire: 6.50  },
]

export function getStock(): Materiau[] {
  const stored = localStorage.getItem('plombo_stock')
  if (!stored) {
    localStorage.setItem('plombo_stock', JSON.stringify(DEFAULT_STOCK))
    return DEFAULT_STOCK
  }
  return JSON.parse(stored)
}

export function saveStock(stock: Materiau[]) {
  localStorage.setItem('plombo_stock', JSON.stringify(stock))
}

export function getUtilisations(): Utilisation[] {
  const stored = localStorage.getItem('plombo_utilisations')
  if (!stored) return []
  return JSON.parse(stored)
}

export function enregistrerUtilisation(
  data: Omit<Utilisation, 'id'>,
): Utilisation {
  // Decrement stock
  const stock = getStock()
  for (const ligne of data.lignes) {
    const mat = stock.find(m => m.id === ligne.materiauId)
    if (mat) mat.quantite = Math.max(0, mat.quantite - ligne.quantite)
  }
  saveStock(stock)

  // Save history
  const utilisations = getUtilisations()
  const newUtil: Utilisation = { ...data, id: Date.now() }
  utilisations.unshift(newUtil)
  localStorage.setItem('plombo_utilisations', JSON.stringify(utilisations))
  return newUtil
}

export function ajouterStock(materiauId: number, quantite: number) {
  const stock = getStock()
  const mat = stock.find(m => m.id === materiauId)
  if (mat) {
    mat.quantite += quantite
    saveStock(stock)
  }
}

export function getStatutStock(mat: Materiau): 'ok' | 'alerte' | 'rupture' {
  if (mat.quantite === 0) return 'rupture'
  if (mat.quantite <= mat.seuilAlerte) return 'alerte'
  return 'ok'
}
