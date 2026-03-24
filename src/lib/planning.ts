export interface WorkDay {
  date: string    // YYYY-MM-DD
  active: boolean
  startH: number
  startM: number
  endH: number
  endM: number
}

const KEY = 'plombo_planning'

/** Date locale YYYY-MM-DD sans décalage UTC (corrige le bug fuseau horaire). */
export function localDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function buildDefaultDays(numDays = 14): WorkDay[] {
  const days: WorkDay[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = 0; i < numDays; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    const weekend = dow === 0 || dow === 6
    days.push({
      date: localDateStr(d),   // ← date locale, pas UTC
      active: !weekend,
      startH: 8, startM: 0,
      endH: 18, endM: 0,
    })
  }
  return days
}

export function getWorkPlanning(): WorkDay[] {
  const todayStr = localDateStr(new Date())
  const stored = localStorage.getItem(KEY)

  if (!stored) {
    const days = buildDefaultDays()
    localStorage.setItem(KEY, JSON.stringify(days))
    return days
  }

  const data: WorkDay[] = JSON.parse(stored)

  // Si les dates stockées ne sont pas au bon format local (ex : décalage UTC ancien),
  // on reconstruit le planning depuis zéro.
  const hasToday = data.some(d => d.date === todayStr)
  const firstDate = data[0]?.date ?? ''
  const dayDiff = firstDate
    ? Math.abs(new Date(firstDate + 'T12:00:00').getTime() - new Date(todayStr + 'T12:00:00').getTime()) / 86_400_000
    : 999
  if (!hasToday && dayDiff > 14) {
    const fresh = buildDefaultDays()
    localStorage.setItem(KEY, JSON.stringify(fresh))
    return fresh
  }
  const existing = new Set(data.map(d => d.date))
  const fresh = buildDefaultDays()
  const toAdd = fresh.filter(d => !existing.has(d.date) && d.date >= todayStr)
  const valid = data.filter(d => d.date >= todayStr)
  const merged = [...valid, ...toAdd].sort((a, b) => a.date.localeCompare(b.date))

  if (toAdd.length > 0 || valid.length < data.length) {
    localStorage.setItem(KEY, JSON.stringify(merged))
  }

  return merged
}

export function saveWorkPlanning(days: WorkDay[]) {
  localStorage.setItem(KEY, JSON.stringify(days))
}
