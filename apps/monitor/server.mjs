import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { institutions, categories } from '../../packages/catalog/institutions.mjs'
import { probe } from './probe.mjs'
import { summarize, currentStatus, historyBars, STALE_MS } from './metrics.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dataDir = path.join(root, 'data')
mkdirSync(dataDir, { recursive: true })
const database = new DatabaseSync(path.join(dataDir, 'observations.sqlite'))
database.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS observations (id INTEGER PRIMARY KEY, service_id TEXT NOT NULL, timestamp INTEGER NOT NULL, status TEXT NOT NULL, latency INTEGER, http_code INTEGER, reason TEXT); CREATE INDEX IF NOT EXISTS observations_service_time ON observations(service_id, timestamp)')
const insert = database.prepare('INSERT INTO observations(service_id,timestamp,status,latency,http_code,reason) VALUES(?,?,?,?,?,?)')
const select = database.prepare('SELECT timestamp,status,latency,http_code as httpCode,reason FROM observations WHERE service_id=? AND timestamp >= ? ORDER BY timestamp ASC')
let collecting = false
let lastCycle = null
let revision = 0
const cache = new Map()
const autoMonitor = process.env.MONITOR_ENABLED !== 'false'

async function collect() {
  if (collecting) return
  collecting = true
  const queue = [...institutions]
  let completed = 0
  console.log('Colectare începută: ' + queue.length + ' endpointuri publice')
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const item = queue.shift()
      const result = await probe(item)
      insert.run(item.id, result.timestamp, result.status, result.latency, result.httpCode, result.reason)
      revision++
      completed++
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
  }))
  lastCycle = Date.now()
  collecting = false
  cache.clear()
  console.log('Colectare încheiată: ' + completed + ' probe salvate')
}

function snapshot(days) {
  const now = Date.now()
  const cached = cache.get(days)
  if (cached && cached.revision === revision && now - cached.createdAt < 30000) return cached.value
  const start = now - days * 86400000
  const readings = Object.fromEntries(institutions.map((item) => {
    const samples = select.all(item.id, start - STALE_MS)
    const last = samples.at(-1)
    const summary = summarize(samples, start, now)
    const current = currentStatus(samples, now)
    return [item.id, { id: item.id, ...current, uptime: summary.uptime, coverage: summary.coverage, observedMs: summary.knownMs, latency: current.status === 'unknown' && (!last || now - last.timestamp > STALE_MS) ? null : last?.latency ?? null, lastChecked: last ? new Date(last.timestamp).toISOString() : null, httpCode: last?.httpCode ?? null, bars: historyBars(samples, start, now) }]
  }))
  const value = { mode: 'real', generatedAt: new Date(now).toISOString(), days, pointOfView: 'single-installation', intervalMinutes: 5, collecting, lastCycle, readings }
  cache.set(days, { createdAt: now, revision, value })
  return value
}

if (process.argv.includes('--once')) {
  await collect()
  console.log(JSON.stringify({ lastCycle, records: database.prepare('SELECT count(*) AS count FROM observations').get().count }))
  database.close()
} else {
  const client = path.join(root, 'apps/web/dist/client')
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.zip': 'application/zip' }
  const server = createServer((request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return }
    let url
    try { url = new URL(request.url, 'http://localhost') } catch { response.writeHead(400); response.end(); return }
    const json = (value) => { response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(request.method === 'HEAD' ? undefined : JSON.stringify(value)) }
    if (url.pathname === '/api/status') { const days = [1, 7, 30].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 30; json(snapshot(days)); return }
    if (url.pathname === '/api/catalog') { json({ scope: 'central', exhaustive: false, categories, institutions }); return }
    if (url.pathname === '/api/health') { json({ ok: true, collecting, lastCycle, institutions: institutions.length, autoMonitor }); return }
    if (url.pathname.startsWith('/api/')) { response.writeHead(404); response.end(); return }
    let decoded
    try { decoded = decodeURIComponent(url.pathname) } catch { response.writeHead(400); response.end(); return }
    let file = path.resolve(client, '.' + decoded)
    if (!file.startsWith(client + path.sep) && file !== client) { response.writeHead(403); response.end(); return }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!existsSync(file) || !statSync(file).isFile()) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Pagina nu a fost găsită.'); return }
    const ext = path.extname(file)
    response.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': /-[a-zA-Z0-9_-]{8,}\./.test(path.basename(file)) ? 'public, max-age=31536000, immutable' : 'no-cache' })
    response.end(request.method === 'HEAD' ? undefined : readFileSync(file))
  })
  server.listen(Number(process.env.PORT || 4174), process.env.HOST || '127.0.0.1', () => console.log('Starea Statului API: http://' + (process.env.HOST || '127.0.0.1') + ':' + (process.env.PORT || 4174)))
  if (autoMonitor) {
    collect().catch((error) => { collecting = false; console.error(error.message) })
    const timer = setInterval(() => collect().catch((error) => { collecting = false; console.error(error.message) }), 300000)
    timer.unref()
  }
  const close = () => server.close(() => { database.close(); process.exit(0) })
  process.on('SIGINT', close)
  process.on('SIGTERM', close)
}
