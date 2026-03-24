export interface WorkDay {
  date: string    // YYYY-MM-DD
  active: boolean
  startH: number
  startM: number
  endH: number
  endM: number
}

const KEY = 'plombo_planning'

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
      date: d.toISOString().split('T')[0],
      active: !weekend,
      startH: 8, startM: 0,
      endH: 18, endM: 0,
    })
  }
  return days
}

export function getWorkPlanning(): WorkDay[] {
  const todayStr = new Date().toISOString().split('T')[0]
  const stored = localStorage.getItem(KEY)

  if (!stored) {
    const days = buildDefaultDays()
    localStorage.setItem(KEY, JSON.stringify(days))
    return days
  }

  const data: WorkDay[] = JSON.parse(stored)
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
