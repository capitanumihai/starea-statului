import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { institutions } from '../packages/catalog/institutions.mjs'

const client = path.resolve('apps/web/dist/client')
const base = process.env.VITE_BASE_PATH || '/'
const site = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '')
const read = (filename) => readFileSync(path.join(client, filename), 'utf8')

test('pagina publică are active valide și canonical pentru subdirector', () => {
  assert.ok(site, 'Configurează PUBLIC_SITE_URL pentru verificarea publicării')
  const html = read('index.html')
  assert.ok(html.includes('href="' + site + '/"'))
  assert.ok(html.includes('content="index, follow"'))
  assert.ok(!html.includes('noindex'))
  const resources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]).filter((url) => url.startsWith(base + 'assets/'))
  assert.ok(resources.length >= 2)
  for (const resource of resources) assert.ok(existsSync(path.join(client, resource.slice(base.length))), resource)
  assert.ok(existsSync(path.join(client, 'starea-statului-source.zip')))
  assert.ok(existsSync(path.join(client, '.nojekyll')))
})

test('toate instituțiile au pagină indexabilă și adresă canonical corectă', () => {
  for (const item of institutions) {
    const html = read('institutii/' + item.id + '/index.html')
    assert.ok(html.includes('<h1>' + item.name.replaceAll('&', '&amp;') + '</h1>'), item.id)
    assert.ok(html.includes('href="' + site + '/institutii/' + item.id + '/"'), item.id)
    assert.ok(html.includes('href="' + base + '"'), item.id)
  }
  assert.equal((read('sitemap.xml').match(/<loc>/g) || []).length, institutions.length + 1)
  assert.ok(read('robots.txt').includes(site + '/sitemap.xml'))
  assert.ok(read('404.html').includes('noindex'))
})

test('datele online sunt reale și au toate cele trei perioade', () => {
  for (const days of [1, 7, 30]) {
    const data = JSON.parse(read('monitor/status-' + days + '.json'))
    assert.equal(data.mode, 'real')
    assert.equal(data.days, days)
    assert.equal(data.pointOfView, 'github-actions')
    assert.equal(data.staleAfterMinutes, 10)
    assert.equal(Object.keys(data.readings).length, institutions.length)
    assert.ok(Number.isFinite(Date.parse(data.generatedAt)))
    for (const item of institutions) {
      const reading = data.readings[item.id]
      assert.equal(reading.bars.length, 30)
      assert.ok(reading.coverage >= 0 && reading.coverage <= 100)
      assert.ok(reading.uptime === null || reading.uptime >= 0 && reading.uptime <= 100)
    }
  }
})
