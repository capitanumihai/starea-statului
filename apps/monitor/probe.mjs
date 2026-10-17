import dns from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { performance } from 'node:perf_hooks'

export function isPublicAddress(address) {
  const family = net.isIP(address)
  if (family === 4) {
    const [a, b] = address.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0))
  }
  if (family === 6) {
    const value = address.toLowerCase()
    if (value.startsWith('::ffff:')) {
      const tail = value.slice(7)
      if (net.isIP(tail) === 4) return isPublicAddress(tail)
      return false
    }
    return /^(2|3)/.test(value) && !value.startsWith('2001:db8:') && !value.startsWith('2001:10:') && !value.startsWith('2001:2:')
  }
  return false
}

async function requestOnce(url, timeoutMs) {
  const records = await Promise.race([
    dns.lookup(url.hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('DNS timeout')), timeoutMs); timer.unref() }),
  ])
  if (!records.length || records.some((record) => !isPublicAddress(record.address))) throw new Error('Adresă de rețea nepublică')
  const record = records.find((r) => r.family === 4) || records[0]
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http
    const request = protocol.request(url, {
      method: 'GET',
      agent: false,
      lookup: (_host, options, callback) => {
        if (options?.all) callback(null, [record])
        else callback(null, record.address, record.family)
      },
      headers: { 'User-Agent': 'StareaStatului/0.1 (independent availability monitor, public endpoint only)', Accept: 'text/html,application/json;q=0.8' },
      timeout: timeoutMs,
    }, (response) => {
      let bytes = 0
      let text = ''
      response.on('data', (chunk) => {
        bytes += chunk.length
        if (bytes <= 32768) text += chunk.toString('utf8')
        else { finish(); response.destroy() }
      })
      const finish = () => resolve({ code: response.statusCode, location: response.headers.location, text })
      response.on('end', finish)
      response.on('error', reject)
      if (response.statusCode >= 300 && response.statusCode < 400) { finish(); response.destroy() }
    })
    request.on('timeout', () => request.destroy(new Error('Timeout')))
    request.on('error', reject)
    request.end()
  })
}

export async function probe(item, { timeoutMs = 8000 } = {}) {
  const started = performance.now()
  const timestamp = Date.now()
  let url = new URL(item.url)
  const hostname = url.hostname.replace(/^www\./, '')
  try {
    for (let redirect = 0; redirect < 5; redirect++) {
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || ![80, 443, 0].includes(Number(url.port))) throw new Error('Endpoint neacceptat')
      if (url.hostname.replace(/^www\./, '') !== hostname) return { id: item.id, timestamp, status: 'blocked', latency: null, httpCode: null, reason: 'Redirecționare către alt domeniu. Este necesară validarea endpointului.' }
      const result = await requestOnce(url, timeoutMs)
      if (result.code >= 300 && result.code < 400 && result.location) { url = new URL(result.location, url); continue }
      const latency = Math.round(performance.now() - started)
      const blocked = [401, 403, 407, 429].includes(result.code) || /<title[^>]*>\s*(just a moment|access denied|attention required)|cf-chl-|verify you are human/i.test(result.text)
      if (blocked) return { id: item.id, timestamp, status: 'blocked', latency, httpCode: result.code, reason: 'Verificarea automată este blocată sau limitată. Starea serviciului rămâne neconcludentă.' }
      const status = result.code >= 200 && result.code < 300 ? latency > 1500 ? 'slow' : 'up' : result.code >= 500 ? 'down' : 'unknown'
      return { id: item.id, timestamp, status, latency, httpCode: result.code, reason: 'Răspuns HTTP ' + result.code + ' al paginii publice.' }
    }
    return { id: item.id, timestamp, status: 'blocked', latency: null, httpCode: null, reason: 'Prea multe redirecționări. Endpointul necesită verificare.' }
  } catch (error) {
    return { id: item.id, timestamp, status: 'down', latency: null, httpCode: null, reason: 'Verificarea nu a reușit: ' + (error.code || error.message).slice(0, 120) }
  }
}
