export const assetPath = (pathname, base = import.meta.env?.BASE_URL || '/') => base + pathname.replace(/^\/+/, '')

export function selectedService(search, pathname) {
  const query = new URLSearchParams(search).get('serviciu')
  const parts = pathname.split('/').filter(Boolean)
  const index = parts.indexOf('institutii')
  return query || (index >= 0 ? parts[index + 1] : null)
}

export function expirePublishedReadings(snapshot, now = Date.now()) {
  if (!snapshot.readings) return {}
  const expiry = (snapshot.staleAfterMinutes || 10) * 60000
  return Object.fromEntries(Object.entries(snapshot.readings).map(([id, reading]) => {
    const checked = Date.parse(reading.lastChecked)
    if (Number.isFinite(checked) && now - checked <= expiry) return [id, reading]
    return [id, { ...reading, status: 'unknown', latency: null, reason: 'Ultima probă a expirat sau lipsește. Așteptăm o nouă colectare și nu extrapolăm starea.' }]
  }))
}
