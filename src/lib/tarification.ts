import { getInterventions } from './agenda'

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
  const pad = cfg.trajetDefaut + cfg.margeMin   // tampon avant/après = 35 min
  const workStart = 8 * 60                       // 8h00
  const workEnd   = 19 * 60                      // 19h00

  const all = getInterventions()
  const now = new Date()
  let skipUntilMin = afterSlot
    ? (afterSlot.date === now.toISOString().split('T')[0]
        ? afterSlot.startH * 60 + afterSlot.startM + repairDuration + pad
        : 0)
    : 0
  let skipDate = afterSlot?.date ?? null

  for (let dayOffset = 0; dayOffset <= 13; dayOffset++) {
    const d = new Date(now)
    d.setDate(d.getDate() + dayOffset)
    d.setHours(0, 0, 0, 0)
    const dateStr = d.toISOString().split('T')[0]

    const nowMin = dayOffset === 0 ? (now.getHours() * 60 + now.getMinutes()) : 0
    let earliest = Math.max(workStart, nowMin + pad)

    // afterSlot logic: skip past the already-proposed slot
    if (skipDate && dateStr === skipDate) {
      earliest = Math.max(earliest, skipUntilMin)
    } else if (skipDate && dateStr > skipDate) {
      skipDate = null  // past the skipped date, search normally
    } else if (skipDate && dateStr < skipDate) {
      continue  // before the skip date, skip this day entirely
    }

    if (earliest + repairDuration > workEnd) continue

    const dayIvs = all
      .filter(iv => iv.date === dateStr && iv.status !== 'cancelled' && iv.status !== 'done')
      .map(iv => ({
        start: iv.startH * 60 + iv.startM,
        end:   iv.startH * 60 + iv.startM + iv.durationMin,
      }))
      .sort((a, b) => a.start - b.start)

    if (dayIvs.length === 0) {
      return { date: dateStr, startH: Math.floor(earliest / 60), startM: earliest % 60 }
    }

    // Avant la première intervention
    if (earliest + repairDuration + pad <= dayIvs[0].start) {
      return { date: dateStr, startH: Math.floor(earliest / 60), startM: earliest % 60 }
    }

    // Entre deux interventions
    for (let i = 0; i < dayIvs.length - 1; i++) {
      const slotStart = Math.max(earliest, dayIvs[i].end + pad)
      if (slotStart + repairDuration + pad <= dayIvs[i + 1].start) {
        return { date: dateStr, startH: Math.floor(slotStart / 60), startM: slotStart % 60 }
      }
    }

    // Après la dernière intervention
    const afterLast = Math.max(earliest, dayIvs[dayIvs.length - 1].end + pad)
    if (afterLast + repairDuration <= workEnd) {
      return { date: dateStr, startH: Math.floor(afterLast / 60), startM: afterLast % 60 }
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
