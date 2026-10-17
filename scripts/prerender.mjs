import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { institutions, categories, categoryById } from '../packages/catalog/institutions.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const client = path.join(root, 'apps/web/dist/client')
const template = readFileSync(path.join(client, 'index.html'), 'utf8')
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const configured = process.env.PUBLIC_SITE_URL
let site = null
if (configured) {
  const parsed = new URL(configured)
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password || ['localhost', '127.0.0.1'].includes(parsed.hostname)) throw new Error('PUBLIC_SITE_URL trebuie să fie originea HTTPS publică, fără cale sau parametri')
  site = parsed.origin
}
const footer = '<p>Proiect civic independent, gratuit și open source. Verificăm paginile publice. Accesibilitatea unui site nu confirmă reușita operațiunilor autentificate.</p><p><a href="/">Înapoi la hartă</a></p>'
const directory = '<ul>' + institutions.map((i) => '<li><a href="/institutii/' + i.id + '/">' + escape(i.name) + '</a></li>').join('') + '</ul>'
const makePage = ({ title, description, pathname, content }) => {
  const canonical = site ? '<link rel="canonical" href="' + escape(site + pathname) + '" />' : ''
  const metadata = canonical + '<meta property="og:type" content="website" /><meta property="og:locale" content="ro_RO" /><meta property="og:title" content="' + escape(title) + '" /><meta property="og:description" content="' + escape(description) + '" />'
  return template.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escape(title) + '</title>').replace(/<meta name="description" content="[^"]*"\s*\/?>/, '<meta name="description" content="' + escape(description) + '" />').replace('content="noindex, nofollow"', 'content="' + (site ? 'index, follow' : 'noindex, nofollow') + '"').replace('</head>', metadata + '</head>').replace('<div id="root"></div>', '<div id="root"><main class="seo-fallback">' + content + footer + '</main></div>')
}
writeFileSync(path.join(client, 'index.html'), makePage({ title: 'Starea Statului · Instituții și servicii publice din România', description: 'Hartă interactivă a instituțiilor centrale și serviciilor publice digitale din România. Disponibilitate HTTP, istoric transparent și cod open source.', pathname: '/', content: '<h1>Starea Statului</h1><p>Pulsul digital al României. Explorează ' + institutions.length + ' instituții și servicii naționale, grupate pe ramuri.</p><p>Stările actuale sunt încărcate din măsurătorile locale. Nu publicăm procente pentru perioade nemăsurate.</p><h2>Catalogul instituțiilor centrale</h2>' + directory }))
for (const item of institutions) {
  const pathname = '/institutii/' + item.id + '/'
  const folder = path.join(client, pathname)
  mkdirSync(folder, { recursive: true })
  writeFileSync(path.join(folder, 'index.html'), makePage({ title: item.shortName + ' · Stare și disponibilitate HTTP | Starea Statului', description: 'Verifică accesibilitatea paginii publice pentru ' + item.name + '. Istoric observat, timp de răspuns și acoperirea măsurătorilor.', pathname, content: '<p>' + escape(categoryById[item.category].name) + '</p><h1>' + escape(item.name) + '</h1><p>' + escape(item.description) + '</p><p>Starea curentă, timpul de răspuns și istoricul se încarcă din API-ul de monitorizare. Lipsa datelor nu este echivalentă cu indisponibilitatea.</p><p><a rel="noopener noreferrer" href="' + escape(item.url) + '">Site-ul oficial al instituției</a></p>' }))
}
writeFileSync(path.join(client, 'catalog.json'), JSON.stringify({ project: 'Starea Statului', scope: 'central', exhaustive: false, generatedAt: new Date().toISOString(), categories, institutions }, null, 2))
writeFileSync(path.join(client, 'robots.txt'), site ? 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ' + site + '/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n')
if (site) writeFileSync(path.join(client, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ['/', ...institutions.map((i) => '/institutii/' + i.id + '/')].map((pathname) => '<url><loc>' + escape(site + pathname) + '</loc></url>').join('') + '</urlset>')
console.log('SEO: ' + (institutions.length + 1) + ' pagini HTML, catalog JSON și robots.txt. Indexare: ' + (site ? site : 'oprită până la configurarea domeniului public'))
