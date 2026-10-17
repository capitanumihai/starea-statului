export const STALE_MS = 10 * 60 * 1000
export const KNOWN = new Set(['up', 'slow', 'down'])

export function summarize(samples, start, end, staleMs = STALE_MS) {
  const points = samples.filter((p) => Number.isFinite(p.timestamp) && p.timestamp <= end).slice().sort((a, b) => a.timestamp - b.timestamp)
  let knownMs = 0
  let availableMs = 0
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const from = Math.max(start, point.timestamp)
    const to = Math.min(end, point.timestamp + staleMs, points[i + 1]?.timestamp ?? end)
    if (to <= from || !KNOWN.has(point.status)) continue
    knownMs += to - from
    if (point.status === 'up' || point.status === 'slow') availableMs += to - from
  }
  const windowMs = Math.max(0, end - start)
  return { uptime: knownMs > 0 ? availableMs / knownMs * 100 : null, coverage: windowMs > 0 ? knownMs / windowMs * 100 : 0, availableMs, knownMs }
}

export function currentStatus(samples, now) {
  const points = samples.slice().sort((a, b) => a.timestamp - b.timestamp)
  const last = points.at(-1)
  if (!last || now - last.timestamp > STALE_MS) return { status: 'unknown', reason: last ? 'Ultima probă a expirat. Nu extrapolăm starea.' : 'Monitorizarea acestui endpoint nu a început.' }
  if (last.status !== 'down') return { status: last.status, reason: last.reason }
  const tail = points.slice(-3)
  const repeated = tail.length === 3 && tail.every((p) => p.status === 'down') && tail[2].timestamp - tail[0].timestamp <= STALE_MS * 2
  return { status: repeated ? 'down' : 'unknown', reason: repeated ? 'Trei eșecuri consecutive, observate dintr-un singur punct.' : 'Eșec observat. Așteptăm confirmare prin probe repetate.' }
}

export function historyBars(samples, start, end, count = 30) {
  const size = (end - start) / count
  return Array.from({ length: count }, (_, i) => {
    const summary = summarize(samples, start + size * i, start + size * (i + 1))
    if (summary.knownMs === 0) return 'unknown'
    if (summary.uptime < 99) return 'down'
    if (summary.uptime < 100) return 'slow'
    const hasSlow = samples.some((p) => p.status === 'slow' && p.timestamp >= start + size * i && p.timestamp < start + size * (i + 1))
    return hasSlow ? 'slow' : 'up'
  })
}
