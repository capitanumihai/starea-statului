export { institutions, categories, categoryById, institutionById, normalize, searchInstitutions } from '../../../packages/catalog/institutions.mjs'

export const statusMeta = {
  up: { label: 'Disponibil', color: '#7be8b5', short: 'Răspunde' },
  slow: { label: 'Răspuns lent', color: '#f2c36c', short: 'Lent' },
  down: { label: 'Indisponibil', color: '#fb7f87', short: 'Nu răspunde' },
  unknown: { label: 'Fără date', color: '#8ba1b1', short: 'Fără date' },
  blocked: { label: 'Verificare blocată', color: '#bca5df', short: 'Neconcludent' },
}

const demoRows = {
  ghiseul: ['up', 284, 99.92],
  cdep: ['up', 312, 99.98],
  senat: ['up', 276, 100],
  spv: ['slow', 1800, 98.74],
  hubmai: ['down', null, 99.1],
  roeid: ['unknown', null, null],
  sri: ['unknown', null, null],
  dna: ['up', 426, 99.96],
}

export const createDemo = (period = 30, anchor = Date.now()) => Object.fromEntries(Object.entries(demoRows).map(([id, [status, latency, uptime]], index) => [id, {
  id, status, latency, uptime: uptime === null ? null : period === 1 ? status === 'down' ? 98.6 : status === 'slow' ? 99.4 : 100 : period === 7 ? Math.min(100, uptime + 0.03) : uptime,
  coverage: uptime === null ? 0 : 100,
  lastChecked: status === 'unknown' ? null : new Date(anchor - (index + 1) * 60000).toISOString(),
  httpCode: status === 'down' || status === 'unknown' ? null : 200,
  reason: status === 'down' ? 'Timeout demonstrativ' : status === 'unknown' ? 'Nicio probă disponibilă în acest exemplu' : 'Răspuns HTTP demonstrativ',
  bars: Array.from({ length: 30 }, (_, day) => status === 'unknown' ? 'unknown' : day === 21 && status === 'down' ? 'down' : day === 19 || (day === 24 && status === 'slow') ? 'slow' : 'up'),
}]))

export const emptyReading = (id) => ({ id, status: 'unknown', uptime: null, coverage: 0, latency: null, lastChecked: null, reason: 'Monitorizarea acestui endpoint nu a început.', bars: Array(30).fill('unknown') })
export const percent = (value) => value === null || value === undefined ? 'N/A' : new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + '%'
export const duration = (value) => value === null || value === undefined ? 'N/A' : value >= 1000 ? new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(value / 1000) + ' s' : Math.round(value) + ' ms'
export const time = (value) => value ? new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Fără verificări'
export const day = (value) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'short' }).format(new Date(value))


export const observedDuration = (ms) => !ms || ms < 60000 ? "sub 1 min" : ms < 3600000 ? Math.floor(ms / 60000) + " min" : ms < 86400000 ? new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(ms / 3600000) + " ore" : new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(ms / 86400000) + " zile"
