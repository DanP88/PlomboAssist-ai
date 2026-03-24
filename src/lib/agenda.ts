export interface Intervention {
  id: string
  date: string          // YYYY-MM-DD
  startH: number
  startM: number
  durationMin: number
  client: string
  phone: string
  address: string
  type: string
  typeColor: string
  typeBg: string
  typeBorder: string
  status: 'scheduled' | 'in_progress' | 'done' | 'cancelled'
  notes?: string
  finishedAt?: string   // ISO datetime quand marquée terminée
}

// Interventions du jour (statuts variés pour la démo)
const DEMO: Intervention[] = [
  {
    id: 'demo-1', date: '', // date set at runtime
    startH: 9, startM: 0, durationMin: 90,
    client: 'Mme Dupont', phone: '06 12 34 56 78',
    address: '12 rue Victor Hugo, Lyon 3',
    type: 'Fuite', typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca',
    status: 'done',
  },
  {
    id: 'demo-2', date: '',
    startH: 11, startM: 30, durationMin: 120,
    client: 'M. Renard', phone: '07 98 76 54 32',
    address: '45 av. Gambetta, Lyon 6',
    type: 'Chauffe-eau', typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe',
    status: 'in_progress',
  },
  {
    id: 'demo-3', date: '',
    startH: 14, startM: 30, durationMin: 60,
    client: 'Mme Petit', phone: '06 55 44 33 22',
    address: '8 rue de la Paix, Lyon 2',
    type: 'Entretien', typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0',
    status: 'scheduled',
  },
]

/** Génère les interventions de démonstration pour les 2 prochaines semaines,
 *  couvrant tous les modes tarifaires (semaine, urgence, week-end, soir…). */
function buildDemoWeek(): Intervention[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const dayStr = (offset: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  }

  const dow = now.getDay() // 0=dim, 6=sam
  // Prochain samedi et dimanche (au moins +1 jour)
  const daysToSat = dow === 6 ? 7 : (6 - dow) || 7
  const daysToSun = dow === 0 ? 7 : (7 - dow)

  return [
    // +1 jour — semaine normale
    {
      id: 'demo-w1', date: dayStr(1),
      startH: 9, startM: 0, durationMin: 60,
      client: 'M. Bertrand', phone: '06 23 45 67 89',
      address: '22 rue Bellecour, Lyon 2',
      type: 'Robinetterie', typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe',
      status: 'scheduled',
    },
    // +2 jours — urgence semaine
    {
      id: 'demo-w2', date: dayStr(2),
      startH: 8, startM: 0, durationMin: 90,
      client: 'Mme Faure', phone: '07 34 56 78 90',
      address: '5 place Carnot, Lyon 2',
      type: "Fuite d'eau", typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca',
      status: 'scheduled',
      notes: 'URGENT — Fuite sous évier cuisine',
    },
    // +3 jours — soir (après 20h)
    {
      id: 'demo-w3', date: dayStr(3),
      startH: 20, startM: 0, durationMin: 60,
      client: 'M. Chabert', phone: '06 45 67 89 01',
      address: '17 rue Garibaldi, Lyon 3',
      type: 'Débouchage', typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0',
      status: 'scheduled',
    },
    // +4 jours — urgence soir
    {
      id: 'demo-w4', date: dayStr(4),
      startH: 20, startM: 30, durationMin: 75,
      client: 'Mme Girard', phone: '07 56 78 90 12',
      address: '30 cours Lafayette, Lyon 3',
      type: 'Chauffe-eau', typeColor: '#7c3aed', typeBg: '#f5f3ff', typeBorder: '#ddd6fe',
      status: 'scheduled',
      notes: 'URGENT — Panne chauffe-eau, plus d\'eau chaude',
    },
    // Prochain samedi — week-end
    {
      id: 'demo-w5', date: dayStr(daysToSat),
      startH: 10, startM: 30, durationMin: 90,
      client: 'M. Morin', phone: '06 67 89 01 23',
      address: '8 rue de Sèze, Lyon 6',
      type: 'Entretien', typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0',
      status: 'scheduled',
    },
    // Prochain dimanche — urgence week-end
    {
      id: 'demo-w6', date: dayStr(daysToSun),
      startH: 9, startM: 0, durationMin: 90,
      client: 'Mme Leclerc', phone: '07 78 90 12 34',
      address: '3 rue Président Herriot, Lyon 1',
      type: "Fuite d'eau", typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca',
      status: 'scheduled',
      notes: 'URGENT — Inondation en cours, cave touchée',
    },
  ]
}

/** Recharge les données de démo une fois par jour.
 *  Les interventions créées par le pro (id non préfixés "demo-") sont préservées. */
export function getInterventions(): Intervention[] {
  const todayStr = new Date().toISOString().split('T')[0]
  const lastReset = localStorage.getItem('plombo_demo_reset')
  const stored = localStorage.getItem('plombo_agenda')

  if (lastReset !== todayStr) {
    // Nouveau jour : reconstruire les démos, garder les RDV réels du pro
    const demoToday = DEMO.map(iv => ({ ...iv, date: todayStr }))
    const demoWeek = buildDemoWeek()
    const userItems: Intervention[] = stored
      ? (JSON.parse(stored) as Intervention[]).filter(iv => !iv.id.startsWith('demo-'))
      : []
    const all = [...userItems, ...demoToday, ...demoWeek]
    localStorage.setItem('plombo_agenda', JSON.stringify(all))
    localStorage.setItem('plombo_demo_reset', todayStr)
    return all
  }

  return stored ? JSON.parse(stored) : []
}

export function saveInterventions(list: Intervention[]) {
  localStorage.setItem('plombo_agenda', JSON.stringify(list))
}

export function getTodayInterventions(): Intervention[] {
  const todayStr = new Date().toISOString().split('T')[0]
  return getInterventions()
    .filter(iv => iv.date === todayStr)
    .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))
}

export function addIntervention(iv: Omit<Intervention, 'id'>): Intervention {
  const all = getInterventions()
  const newIv: Intervention = { ...iv, id: `iv-${Date.now()}` }
  all.push(newIv)
  saveInterventions(all)
  return newIv
}

export function updateStatus(id: string, status: Intervention['status'], finishedAt?: string) {
  const all = getInterventions()
  const idx = all.findIndex(iv => iv.id === id)
  if (idx >= 0) {
    all[idx].status = status
    if (finishedAt) all[idx].finishedAt = finishedAt
    saveInterventions(all)
  }
}

/** Renvoie l'heure planifiée en minutes depuis minuit */
export function toMinutes(h: number, m: number) { return h * 60 + m }

/** Formate des minutes en "HHhMM" */
export function minutesToHHMM(totalMin: number) {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${String(h).padStart(2,'0')}h${String(m).padStart(2,'0')}`
}

/** Calcule l'ETA du pro chez le prochain client.
 *  finishedAtMs = Date.now() quand il a cliqué "J'ai fini"
 *  travelMin    = temps de trajet estimé en minutes (défaut 20)
 */
export function calcETA(finishedAtMs: number, travelMin = 20) {
  const d = new Date(finishedAtMs + travelMin * 60_000)
  return d.getHours() * 60 + d.getMinutes()
}
