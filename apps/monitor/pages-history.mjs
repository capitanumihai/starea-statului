import { currentStatus, KNOWN, STALE_MS } from './metrics.mjs'

export const RETENTION_MS = 30 * 86400000

function appendInterval(intervals, start, end, status) {
  if (end <= start || !KNOWN.has(status)) return
  const previous = intervals.at(-1)
  if (previous && previous[1] === start && previous[2] === status) previous[1] = end
  else intervals.push([start, end, status])
}

export function recordProbe(state, sample, now = sample.timestamp) {
  const previous = state.samples.at(-1)
  if (previous && sample.timestamp <= previous.timestamp) throw new Error('Probele trebuie să fie în ordine cronologică')
  if (previous) appendInterval(state.intervals, previous.timestamp, Math.min(sample.timestamp, previous.timestamp + STALE_MS), previous.status)
  const cutoff = now - RETENTION_MS
  state.intervals = state.intervals.filter((interval) => interval[1] > cutoff).map(([start, end, status]) => [Math.max(start, cutoff), end, status])
  state.samples = [...state.samples, sample].slice(-3)
  return state
}

export function observedIntervals(state, now) {
  const intervals = state.intervals.map((interval) => [...interval])
  const last = state.samples.at(-1)
  if (last) appendInterval(intervals, last.timestamp, Math.min(now, last.timestamp + STALE_MS), last.status)
  return intervals
}

export function summarizeIntervals(intervals, start, end) {
  let knownMs = 0
  let availableMs = 0
  for (const [from, to, status] of intervals) {
    const duration = Math.max(0, Math.min(to, end) - Math.max(from, start))
    if (!KNOWN.has(status)) continue
    knownMs += duration
    if (status === 'up' || status === 'slow') availableMs += duration
  }
  return { knownMs, availableMs, uptime: knownMs ? availableMs / knownMs * 100 : null, coverage: end > start ? knownMs / (end - start) * 100 : 0 }
}

export function intervalBars(intervals, start, end, count = 30) {
  const size = (end - start) / count
  return Array.from({ length: count }, (_, index) => {
    const from = start + size * index
    const to = from + size
    const summary = summarizeIntervals(intervals, from, to)
    if (!summary.knownMs) return 'unknown'
    if (summary.uptime < 99) return 'down'
    if (summary.uptime < 100) return 'slow'
    return intervals.some(([a, b, status]) => status === 'slow' && a < to && b > from) ? 'slow' : 'up'
  })
}

export function createPagesSnapshot(history, institutions, days, now = Date.now()) {
  const start = now - days * 86400000
  const readings = Object.fromEntries(institutions.map((item) => {
    const stored = history.services[item.id]
    const state = stored?.endpoint === item.url ? stored : { samples: [], intervals: [] }
    const last = state.samples.at(-1)
    const intervals = observedIntervals(state, now)
    const summary = summarizeIntervals(intervals, start, now)
    const current = currentStatus(state.samples, now)
    const stale = !last || now - last.timestamp > STALE_MS
    return [item.id, { id: item.id, ...current, uptime: summary.uptime, coverage: summary.coverage, observedMs: summary.knownMs, latency: stale ? null : last.latency, lastChecked: last ? new Date(last.timestamp).toISOString() : null, httpCode: last?.httpCode ?? null, bars: intervalBars(intervals, start, now) }]
  }))
  return { mode: 'real', generatedAt: new Date(now).toISOString(), days, pointOfView: 'github-actions', intervalMinutes: 5, staleAfterMinutes: STALE_MS / 60000, collecting: false, lastCycle: history.lastCycle, readings }
}
