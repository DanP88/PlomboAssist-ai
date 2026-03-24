export interface Coords { lat: number; lon: number }

const CACHE_KEY = 'plombo_geo_cache'
let _cache: Record<string, Coords> | null = null

function getCache(): Record<string, Coords> {
  if (!_cache) {
    try { _cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }
    catch { _cache = {} }
  }
  return _cache!
}

function saveToCache(key: string, coords: Coords) {
  const cache = getCache()
  cache[key] = coords
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

let lastNominatimMs = 0

/** Geocode a French address. Returns null if not found. Results cached in localStorage. */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  if (!address || address.trim().length < 5) return null
  const key = address.trim().toLowerCase()
  const cached = getCache()[key]
  if (cached) return cached
  // Rate limit: 1 req/sec for Nominatim policy
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastNominatimMs))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastNominatimMs = Date.now()
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    const coords: Coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    saveToCache(key, coords)
    return coords
  } catch { return null }
}

function haversineFallback(from: Coords, to: Coords): number {
  const R = 6371
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLon = (to.lon - from.lon) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const km = 2 * R * Math.asin(Math.sqrt(a))
  return Math.max(5, Math.ceil(km * 1.35 / 30 * 60)) // urban factor 1.35, avg 30 km/h
}

/** Get driving time in minutes between two coords. Tries OSRM first, falls back to haversine. */
export async function getTravelTimeMin(from: Coords, to: Coords): Promise<number> {
  if (Math.abs(from.lat - to.lat) < 0.0001 && Math.abs(from.lon - to.lon) < 0.0001) return 0
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return haversineFallback(from, to)
    const data = await res.json()
    if (data.code === 'Ok' && data.routes?.length) {
      return Math.ceil(data.routes[0].duration / 60)
    }
  } catch {}
  return haversineFallback(from, to)
}
