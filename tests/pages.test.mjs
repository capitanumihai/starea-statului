import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, STALE_MS } from '../apps/monitor/metrics.mjs'
import { recordProbe, observedIntervals, summarizeIntervals, intervalBars, createPagesSnapshot, RETENTION_MS } from '../apps/monitor/pages-history.mjs'
import { assetPath, selectedService, expirePublishedReadings } from '../apps/web/src/deployment.mjs'

const sample = (timestamp, status = 'up') => ({ timestamp, status, latency: 120, httpCode: status === 'up' ? 200 : null, reason: 'Probă de test' })
const state = () => ({ endpoint: 'https://example.org/', samples: [], intervals: [] })

test('istoricul compact păstrează rezultatul ponderat al probelor originale', () => {
  const points = [sample(0), sample(300000, 'slow'), sample(600000, 'blocked'), sample(1000000, 'down'), sample(2000000)]
  const stored = state()
  for (const point of points) recordProbe(stored, point)
  const now = 2300000
  const compact = summarizeIntervals(observedIntervals(stored, now), 250000, now)
  const original = summarize(points, 250000, now)
  assert.equal(compact.knownMs, original.knownMs)
  assert.equal(compact.availableMs, original.availableMs)
  assert.equal(compact.uptime, original.uptime)
  assert.equal(compact.coverage, original.coverage)
})

test('întârzierea colectării produce un gol necunoscut', () => {
  const stored = state()
  for (const point of [sample(0), sample(300000), sample(1500000)]) recordProbe(stored, point)
  assert.deepEqual(observedIntervals(stored, 1600000), [[0, 900000, 'up'], [1500000, 1600000, 'up']])
  assert.equal(summarizeIntervals(observedIntervals(stored, 1600000), 900000, 1500000).knownMs, 0)
})

test('istoricul de treizeci de zile păstrează numai intersecția măsurată', () => {
  const stored = state()
  recordProbe(stored, sample(0))
  recordProbe(stored, sample(300000))
  recordProbe(stored, sample(RETENTION_MS + 500000))
  assert.deepEqual(stored.intervals, [[500000, 900000, 'up']])
})

test('blocarea automată nu produce disponibilitate istorică', () => {
  const stored = state()
  recordProbe(stored, sample(0, 'blocked'))
  recordProbe(stored, sample(300000, 'blocked'))
  assert.equal(summarizeIntervals(observedIntervals(stored, 400000), 0, 400000).uptime, null)
  assert.deepEqual(intervalBars(observedIntervals(stored, 400000), 0, 400000), Array(30).fill('unknown'))
})

test('instantaneele confirmă căderea numai după trei probe apropiate', () => {
  const stored = state()
  const institution = { id: 'test', url: stored.endpoint }
  const history = { services: { test: stored }, lastCycle: null }
  recordProbe(stored, sample(0, 'down'))
  assert.equal(createPagesSnapshot(history, [institution], 1, 1000).readings.test.status, 'unknown')
  recordProbe(stored, sample(300000, 'down'))
  recordProbe(stored, sample(600000, 'down'))
  assert.equal(createPagesSnapshot(history, [institution], 1, 600001).readings.test.status, 'down')
  assert.equal(createPagesSnapshot(history, [institution], 1, 600001 + STALE_MS).readings.test.status, 'unknown')
})

test('schimbarea adresei instituției nu reutilizează probele adresei vechi', () => {
  const stored = state()
  recordProbe(stored, sample(0))
  const reading = createPagesSnapshot({ services: { test: stored } }, [{ id: 'test', url: 'https://new.example.org/' }], 1, 1000).readings.test
  assert.equal(reading.status, 'unknown')
  assert.equal(reading.uptime, null)
  assert.equal(reading.lastChecked, null)
})

test('interfața expiră probele publicate chiar dacă JSON-ul nu se actualizează', () => {
  const original = { readings: { test: { status: 'up', latency: 100, lastChecked: new Date(1000000).toISOString(), uptime: 99, observedMs: 1000 } }, staleAfterMinutes: 10 }
  const fresh = expirePublishedReadings(original, 1100000).test
  const expired = expirePublishedReadings(original, 1700000).test
  assert.equal(fresh.status, 'up')
  assert.equal(expired.status, 'unknown')
  assert.equal(expired.latency, null)
  assert.equal(expired.uptime, 99)
  assert.equal(expired.observedMs, 1000)
  assert.equal(original.readings.test.status, 'up')
})

test('instituția selectată se păstrează în adresele directe de Pages', () => {
  assert.equal(selectedService('', '/starea-statului/institutii/sri/'), 'sri')
  assert.equal(selectedService('', '/institutii/dna/'), 'dna')
  assert.equal(selectedService('?serviciu=dna', '/starea-statului/institutii/sri/'), 'dna')
  assert.equal(selectedService('', '/starea-statului/'), null)
})

test('activele și arhiva funcționează la rădăcină și în subdirector', () => {
  assert.equal(assetPath('/assets/parliament.webp', '/starea-statului/'), '/starea-statului/assets/parliament.webp')
  assert.equal(assetPath('starea-statului-source.zip', '/'), '/starea-statului-source.zip')
  assert.equal(assetPath('', '/starea-statului/'), '/starea-statului/')
})
