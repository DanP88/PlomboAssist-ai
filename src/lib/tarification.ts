import { getInterventions } from './agenda'
import { getWorkPlanning, localDateStr } from './planning'

export interface TarifConfig {
  trajetDefaut: number       // minutes de trajet estimés (défaut 20)
  margeMin: number           // marge tampon (défaut 15)
  majorUrgence: number       // % majoration urgence (défaut 30)
  majorNuit: number          // % majoration nuit > 20h ou < 7h (défaut 50)
  majorWeekend: number       // % majoration samedi/dimanche (défaut 25)
  majorFerie: number         // % majoration jour férié (défaut 100)
  fraisDeplacementBase: number  // € HT déplacement de base (défaut 35)
  tauxHoraireBase: number       // €/h HT main d'œuvre (défaut 55)
}

export const DEFAULT_TARIF: TarifConfig = {
  trajetDefaut: 20,
  margeMin: 15,
  majorUrgence: 30,
  majorNuit: 50,
  majorWeekend: 25,
  majorFerie: 100,
  fraisDeplacementBase: 35,
  tauxHoraireBase: 55,
}

export const REPAIR_DURATIONS: Record<string, number> = {
  "Fuite d'eau":  90,
  'Chauffe-eau':  120,
  'Débouchage':   60,
  'Entretien':    60,
  'Robinetterie': 45,
  'Autre':        75,
}

const STORAGE_KEY = 'plombo_tarif'
const MODE_KEY = 'plombo_tarif_mode'

export type TarifMode =
  | 'semaine'
  | 'urgence-semaine'
  | 'week-end'
  | 'urgence-week-end'
  | 'soir'
  | 'urgence-soir'

export const TARIF_MODE_LABELS: Record<TarifMode, string> = {
  'semaine':          'Semaine',
  'urgence-semaine':  'Urgence semaine',
  'week-end':         'Week-end',
  'urgence-week-end': 'Urgence week-end',
  'soir':             'Soir',
  'urgence-soir':     'Urgence soir',
}

export function getTarifMode(): TarifMode {
  return (localStorage.getItem(MODE_KEY) as TarifMode) || 'semaine'
}

export function saveTarifMode(mode: TarifMode) {
  localStorage.setItem(MODE_KEY, mode)
}

export function getTarif(): TarifConfig {
  const s = localStorage.getItem(STORAGE_KEY)
  return s ? { ...DEFAULT_TARIF, ...JSON.parse(s) } : { ...DEFAULT_TARIF }
}

export function saveTarif(t: TarifConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
}

/** Calcule le prix estimé avec majorations. */
export function calcPrix(
  repairDuration: number,
  slotDate: string,
  slotH: number,
  isUrgent: boolean,
  config: TarifConfig
): { base: number; total: number; majorations: string[] } {
  const base = config.fraisDeplacementBase + (repairDuration / 60) * config.tauxHoraireBase
  let mult = 1
  const majorations: string[] = []

  if (isUrgent) {
    mult += config.majorUrgence / 100
    majorations.push(`Urgence +${config.majorUrgence}%`)
  }

  const dow = new Date(slotDate).getDay() // 0=dim, 6=sam
  if (dow === 0 || dow === 6) {
    mult += config.majorWeekend / 100
    majorations.push(`Week-end +${config.majorWeekend}%`)
  }

  if (slotH >= 20 || slotH < 7) {
    mult += config.majorNuit / 100
    majorations.push(`Nuit +${config.majorNuit}%`)
  }

  return {
    base: Math.round(base),
    total: Math.round(base * mult),
    majorations,
  }
}

/** Trouve le premier créneau disponible dans le planning.
 *  afterSlot: si fourni, cherche le créneau suivant (pour proposer une alternative).
 */
export function findBestSlot(
  repairDuration: number,
  config?: TarifConfig,
  afterSlot?: { date: string; startH: number; startM: number }
): { date: string; startH: number; startM: number } | null {
  const cfg = config || getTarif()
  const pad = cfg.trajetDefaut + cfg.margeMin   // tampon avant/après
  const planning = getWorkPlanning()

  const all = getInterventions()
  const now = new Date()
  let skipUntilMin = afterSlot
    ? (afterSlot.date === localDateStr(now)
        ? afterSlot.startH * 60 + afterSlot.startM + repairDuration + pad
        : 0)
    : 0
  let skipDate = afterSlot?.date ?? null

  for (let dayOffset = 0; dayOffset <= 13; dayOffset++) {
    const d = new Date(now)
    d.setDate(d.getDate() + dayOffset)
    d.setHours(0, 0, 0, 0)
    const dateStr = localDateStr(d)

    // Heures de travail : fenêtres disponibles sur ce jour
    // (prend en compte les débords nuit du jour précédent)
    const workDay = planning.find(wd => wd.date === dateStr)
    const prevD = new Date(d); prevD.setDate(d.getDate() - 1)
    const prevDateStr = localDateStr(prevD)
    const prevDay = planning.find(wd => wd.date === prevDateStr)

    // Fenêtres en minutes depuis minuit pour ce jour
    const windows: Array<{start: number; end: number}> = []
    // Débord du jour précédent (ex: jeudi endH=27 → vendredi 0h→3h)
    if (prevDay && prevDay.active && prevDay.endH > 23) {
      windows.push({ start: 0, end: (prevDay.endH - 24) * 60 + prevDay.endM })
    }
    // Plage du jour courant (on coupe à minuit pour éviter de compter deux fois)
    if (workDay && workDay.active) {
      windows.push({
        start: workDay.startH * 60 + workDay.startM,
        end:   Math.min(24 * 60, workDay.endH * 60 + workDay.endM),
      })
    }
    if (windows.length === 0) continue  // aucune plage ce jour

    // afterSlot logic
    if (skipDate && dateStr < skipDate) continue
    if (skipDate && dateStr > skipDate) skipDate = null

    const nowMin = dayOffset === 0 ? (now.getHours() * 60 + now.getMinutes()) : 0

    // Interventions déjà planifiées ce jour
    const dayIvs = all
      .filter(iv => iv.date === dateStr && iv.status !== 'cancelled' && iv.status !== 'done')
      .map(iv => ({ start: iv.startH * 60 + iv.startM, end: iv.startH * 60 + iv.startM + iv.durationMin }))
      .sort((a, b) => a.start - b.start)

    // Chercher un créneau dans chaque fenêtre de travail
    for (const win of windows) {
      let earliest = Math.max(win.start, nowMin + pad)
      if (skipDate && dateStr === skipDate) earliest = Math.max(earliest, skipUntilMin)
      if (earliest + repairDuration > win.end) continue

      // Avant la première intervention dans cette fenêtre
      const winIvs = dayIvs.filter(iv => iv.start < win.end && iv.end > win.start)

      if (winIvs.length === 0) {
        return { date: dateStr, startH: Math.floor(earliest / 60), startM: earliest % 60 }
      }
      if (earliest + repairDuration + pad <= winIvs[0].start) {
        return { date: dateStr, startH: Math.floor(earliest / 60), startM: earliest % 60 }
      }
      for (let i = 0; i < winIvs.length - 1; i++) {
        const s = Math.max(earliest, winIvs[i].end + pad)
        if (s + repairDuration + pad <= winIvs[i + 1].start) {
          return { date: dateStr, startH: Math.floor(s / 60), startM: s % 60 }
        }
      }
      const afterLast = Math.max(earliest, winIvs[winIvs.length - 1].end + pad)
      if (afterLast + repairDuration <= win.end) {
        return { date: dateStr, startH: Math.floor(afterLast / 60), startM: afterLast % 60 }
      }
    }
  }

  return null
}

/** Formate une date YYYY-MM-DD en "lun. 24 mars" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long'
  })
}
