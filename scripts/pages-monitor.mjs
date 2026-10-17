import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { institutions } from '../packages/catalog/institutions.mjs'
import { probe } from '../apps/monitor/probe.mjs'
import { recordProbe, createPagesSnapshot } from '../apps/monitor/pages-history.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cache = path.join(root, '.cache/pages-monitor')
const historyFile = path.join(cache, 'history.json')
const parentFile = path.join(cache, 'parent.txt')
const branch = 'refs/heads/monitor-data'
mkdirSync(cache, { recursive: true })
const run = (args, options = {}) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options })
  if (result.status !== 0) throw new Error('Operațiunea Git a eșuat: ' + args[0] + '\n' + (result.stderr || result.error?.message || ''))
  return result.stdout.trim()
}

const command = process.argv[2]
if (command === 'restore') {
  const remote = run(['ls-remote', '--heads', 'origin', branch])
  if (remote) {
    run(['fetch', '--depth=1', 'origin', branch])
    const parent = run(['rev-parse', 'FETCH_HEAD'])
    writeFileSync(historyFile, run(['show', parent + ':history.json']) + '\n')
    writeFileSync(parentFile, parent)
  } else {
    writeFileSync(historyFile, JSON.stringify({ schemaVersion: 1, lastCycle: null, services: {} }) + '\n')
    writeFileSync(parentFile, '')
  }
  console.log('Istoricul public a fost pregătit. Baza SQLite locală nu este folosită.')
} else if (command === 'collect') {
  const history = existsSync(historyFile) ? JSON.parse(readFileSync(historyFile, 'utf8')) : { schemaVersion: 1, lastCycle: null, services: {} }
  if (history.schemaVersion !== 1 || !history.services || typeof history.services !== 'object') throw new Error('Format de istoric public neacceptat')
  const queue = [...institutions]
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const item = queue.shift()
      const result = await probe(item)
      const previous = history.services[item.id]
      const state = previous?.endpoint === item.url ? previous : { endpoint: item.url, samples: [], intervals: [] }
      history.services[item.id] = recordProbe(state, result)
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
  }))
  history.services = Object.fromEntries(institutions.map((item) => [item.id, history.services[item.id]]))
  history.lastCycle = new Date().toISOString()
  const serialized = '{\n"schemaVersion":1,\n"lastCycle":' + JSON.stringify(history.lastCycle) + ',\n"services":{\n' + Object.entries(history.services).map(([id, state]) => JSON.stringify(id) + ':' + JSON.stringify(state)).join(',\n') + '\n}\n}\n'
  writeFileSync(historyFile, serialized)
  const output = path.join(root, 'apps/web/public/monitor')
  mkdirSync(output, { recursive: true })
  const now = Date.now()
  for (const days of [1, 7, 30]) writeFileSync(path.join(output, 'status-' + days + '.json'), JSON.stringify(createPagesSnapshot(history, institutions, days, now)))
  writeFileSync(path.join(output, 'health.json'), JSON.stringify({ ok: true, lastCycle: history.lastCycle, institutions: institutions.length, source: 'GitHub Actions', scheduledIntervalMinutes: 5, staleAfterMinutes: 10, sourceCommit: process.env.GITHUB_SHA || null }))
  console.log('Colectare publică încheiată: ' + institutions.length + ' endpointuri. Au fost generate trei perioade și starea colectorului.')
} else if (command === 'publish') {
  if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Publicarea istoricului se execută numai în GitHub Actions')
  const parent = readFileSync(parentFile, 'utf8').trim()
  if (parent && !/^[a-f0-9]{40}$/.test(parent)) throw new Error('Revizie părinte neacceptată')
  const blob = run(['hash-object', '-w', historyFile])
  const tree = run(['mktree'], { input: '100644 blob ' + blob + '\thistory.json\n' })
  const commit = run(['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', 'Actualizează măsurătorile publice'], { env: { ...process.env, GIT_AUTHOR_NAME: 'github-actions[bot]', GIT_AUTHOR_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com', GIT_COMMITTER_NAME: 'github-actions[bot]', GIT_COMMITTER_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com' } })
  run(['push', 'origin', commit + ':' + branch])
  console.log('Istoricul măsurătorilor online a fost salvat pe ramura monitor-data.')
} else throw new Error('Alege restore, collect sau publish')
