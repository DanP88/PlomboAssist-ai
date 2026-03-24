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

const today = new Date().toISOString().split('T')[0]

// Données de démo — présentes au premier lancement
const DEMO: Intervention[] = [
  {
    id: 'demo-1', date: today,
    startH: 9, startM: 0, durationMin: 90,
    client: 'Mme Dupont', phone: '06 12 34 56 78',
    address: '12 rue Victor Hugo, Lyon 3',
    type: 'Fuite', typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca',
    status: 'done',
  },
  {
    id: 'demo-2', date: today,
    startH: 11, startM: 30, durationMin: 120,
    client: 'M. Renard', phone: '07 98 76 54 32',
    address: '45 av. Gambetta, Lyon 6',
    type: 'Chauffe-eau', typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe',
    status: 'in_progress',
  },
  {
    id: 'demo-3', date: today,
    startH: 14, startM: 30, durationMin: 60,
    client: 'Mme Petit', phone: '06 55 44 33 22',
    address: '8 rue de la Paix, Lyon 2',
    type: 'Entretien', typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0',
    status: 'scheduled',
  },
]

export function getInterventions(): Intervention[] {
  const todayStr = new Date().toISOString().split('T')[0]
  const stored = localStorage.getItem('plombo_agenda')

  if (!stored) {
    const demo = DEMO.map(iv => ({ ...iv, date: todayStr }))
    localStorage.setItem('plombo_agenda', JSON.stringify(demo))
    return demo
  }

  const data: Intervention[] = JSON.parse(stored)

  // Si les démos ont des dates d'un autre jour, les rafraîchir à aujourd'hui
  const demoItems = data.filter(iv => iv.id.startsWith('demo-'))
  if (demoItems.length > 0 && demoItems.every(iv => iv.date !== todayStr)) {
    const updated = data.map(iv => {
      if (!iv.id.startsWith('demo-')) return iv
      const original = DEMO.find(d => d.id === iv.id)
      return { ...iv, date: todayStr, status: original?.status ?? iv.status, finishedAt: undefined }
    })
    localStorage.setItem('plombo_agenda', JSON.stringify(updated))
    return updated
  }

  return data
}

export function saveInterventions(list: Intervention[]) {
  localStorage.setItem('plombo_agenda', JSON.stringify(list))
}

export function getTodayInterventions(): Intervention[] {
  return getInterventions()
    .filter(iv => iv.date === today)
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
