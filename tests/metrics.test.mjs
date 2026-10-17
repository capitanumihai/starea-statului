import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, currentStatus, historyBars, STALE_MS } from '../apps/monitor/metrics.mjs'
import { isPublicAddress } from '../apps/monitor/probe.mjs'
import { institutions, categories, searchInstitutions } from '../packages/catalog/institutions.mjs'
const point = (timestamp, status = 'up') => ({ timestamp, status })
test('perioada nemăsurată nu devine uptime', () => { assert.deepEqual(summarize([], 0, 1000), { uptime: null, coverage: 0, availableMs: 0, knownMs: 0 }) })
test('intervalele sunt ponderate în timp', () => { const s = summarize([point(0), point(200, 'down'), point(800)], 0, 1000); assert.equal(s.uptime, 40); assert.equal(s.coverage, 100) })
test('golurile după expirare rămân necunoscute', () => { const s = summarize([point(0)], 0, 2000, 500); assert.equal(s.uptime, 100); assert.equal(s.coverage, 25) })
test('probe dinaintea ferestrei sunt intersectate corect', () => { const s = summarize([point(0), point(500, 'down')], 250, 750, 1000); assert.equal(s.uptime, 50) })
test('blocarea anti-bot nu devine indisponibilitate', () => { const s = summarize([point(0, 'blocked')], 0, 1000); assert.equal(s.uptime, null); assert.equal(s.coverage, 0) })
test('răspunsul lent contează în disponibilitatea HTTP', () => { assert.equal(summarize([point(0, 'slow')], 0, 1000).uptime, 100) })
test('un eșec izolat nu confirmă incidentul', () => assert.equal(currentStatus([point(0, 'down')], 1).status, 'unknown'))
test('trei eșecuri consecutive confirmă observația locală', () => assert.equal(currentStatus([point(0, 'down'), point(300000, 'down'), point(600000, 'down')], 600001).status, 'down'))
test('ultima stare expiră', () => assert.equal(currentStatus([point(0)], STALE_MS + 1).status, 'unknown'))
test('istoricul fără probe are numai intervale necunoscute', () => assert.deepEqual(historyBars([], 0, 1000), Array(30).fill('unknown')))
test('colectorul exclude rețele locale și adrese speciale', () => { for (const ip of ['127.0.0.1', '10.0.0.2', '172.16.0.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', '2001:db8::1']) assert.equal(isPublicAddress(ip), false, ip) })
test('colectorul acceptă adrese publice', () => { assert.equal(isPublicAddress('1.1.1.1'), true); assert.equal(isPublicAddress('2606:4700:4700::1111'), true) })
test('catalogul include SRI, DNA și toate ramurile centrale', () => { assert.equal(new Set(institutions.map((i) => i.id)).size, institutions.length); for (const id of ['sri', 'dna', 'sie', 'sts', 'spp', 'diicot', 'iccj', 'cdep', 'senat']) assert.ok(institutions.some((i) => i.id === id)); for (const i of institutions) { assert.ok(categories.some((c) => c.id === i.category)); assert.equal(new URL(i.url).protocol, 'https:') } })
test('căutarea funcționează cu abrevieri și fără diacritice', () => { assert.ok(searchInstitutions('sri').some((i) => i.id === 'sri')); assert.ok(searchInstitutions('anticoruptie').some((i) => i.id === 'dna')); assert.ok(searchInstitutions('ministerul sanatatii').some((i) => i.id === 'ms')) })
