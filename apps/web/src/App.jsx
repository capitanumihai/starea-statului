import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GraphIcon, MagnifyingGlassIcon, ArrowUpRightIcon, ArrowRightIcon, ArrowLeftIcon, ListIcon, XIcon, CaretDownIcon, CaretRightIcon, ClockCounterClockwiseIcon, CodeIcon, InfoIcon, DownloadSimpleIcon, CheckIcon, SquaresFourIcon, MapTrifoldIcon, WarningCircleIcon, ArrowClockwiseIcon, CircleNotchIcon } from '@phosphor-icons/react'
import { institutions, categories, categoryById, institutionById, searchInstitutions, statusMeta, createDemo, emptyReading, percent, duration, time, day, observedDuration } from './data'
import { InstitutionIcon } from './icons'
import { assetPath, selectedService, expirePublishedReadings } from './deployment.mjs'
const ServiceMap = lazy(() => import('./ServiceMap'))
const periods = [{ value: 1, label: '24 ore' }, { value: 7, label: '7 zile' }, { value: 30, label: '30 zile' }]
const institutionCount = institutions.length
const publishedData = import.meta.env.VITE_DATA_SOURCE === 'pages'

function Status({ status, compact = false }) {
  const meta = statusMeta[status] || statusMeta.unknown
  return <span className={'status-label status-' + status}><i className="status-dot" />{compact ? meta.short : meta.label}</span>
}
function AvailabilityBars({ reading, className = '', period = 30 }) {
  return <div className={'availability-chart ' + className} role="img" aria-label={reading.uptime == null ? 'Nu există istoric măsurat' : 'Disponibilitate ' + percent(reading.uptime) + ', perioada ' + period + ' zile'}>
    {(reading.bars || Array(30).fill('unknown')).map((status, index) => <span key={index} className={'availability-bar bar-' + status} title={statusMeta[status].label + ' · interval ' + (index + 1)} />)}
  </div>
}
function Dialog({ title, eyebrow, onClose, children, wide = false }) {
  const ref = useRef(null)
  useEffect(() => { const before = document.activeElement; ref.current.showModal(); return () => before?.focus() }, [])
  return <dialog ref={ref} className={'dialog ' + (wide ? 'dialog-wide' : '')} onCancel={onClose} onClick={(event) => { if (event.target === ref.current) onClose() }}>
    <div className="dialog-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Închide fereastra"><XIcon size={22} /></button></div>
    <div className="dialog-body">{children}</div>
  </dialog>
}
function Methodology({ onClose }) {
  return <Dialog title="Ce înseamnă că un serviciu răspunde?" eyebrow="METODOLOGIE TRANSPARENTĂ" onClose={onClose}>
    <p className="dialog-lead">Măsurăm accesibilitatea site-urilor publice. Un răspuns al paginii publice nu confirmă că o plată, o autentificare sau o cerere poate fi finalizată.</p>
    <div className="method-item"><span>01</span><div><h3>O probă simplă și responsabilă</h3><p>Colectorul verifică endpointuri publice dintr-o listă declarată, la cel puțin 5 minute. Nu folosim conturi, date personale sau teste de sarcină.</p></div></div>
    <div className="method-item"><span>02</span><div><h3>Procentul are o perioadă și o acoperire</h3><p>Disponibilitatea HTTP reprezintă durata disponibilă împărțită la durata cu rezultat cunoscut. Golurile în date rămân necunoscute. Un rezultat expiră după 10 minute.</p></div></div>
    <div className="formula">Disponibilitate = timp disponibil / timp cunoscut × 100</div>
    <div className="method-item"><span>03</span><div><h3>Nu confundăm blocarea cu o cădere</h3><p>Un CAPTCHA, o blocare a verificării automate sau un rezultat neconcludent apare separat. Un singur eșec este o observație. Un incident necesită eșecuri repetate.</p></div></div>
    <div className="method-item"><span>04</span><div><h3>Harta explică legătura</h3><p>Liniile continue leagă Parlamentul de cele două camere. Liniile punctate sunt pentru navigare. Pozițiile pe hartă sunt simbolice, iar grupurile tematice nu reprezintă subordonări administrative.</p></div></div>
    <div className="notice"><InfoIcon size={20} /><p>Modul demonstrație folosește exemple fictive. Modul măsurători reale citește probele colectorului acestei instalări. Fiecare rundă observă serviciile dintr-un singur punct.</p></div>
    {publishedData && <p className="muted">Colectarea online rulează în GitHub Actions. Programarea este la cinci minute și poate întârzia. Interfața expiră stările după zece minute. Istoricul se referă la observațiile cunoscute până la momentul publicării, afișat lângă hartă.</p>}
    <a className="text-link" href="https://serviciipublice.gov.ro/institutii" target="_blank" rel="noopener noreferrer">Consultă și catalogul oficial ADR <ArrowUpRightIcon size={16} /></a>
  </Dialog>
}
function SourceDialog({ onClose, onDownload }) {
  return <Dialog title="Un proiect deschis. Un scop public." eyebrow="STAREA STATULUI · OPEN SOURCE" onClose={onClose}>
    <div className="source-illustration"><CodeIcon size={46} weight="light" /></div>
    <p className="dialog-lead">Codul, catalogul și regulile de măsurare pot fi inspectate și îmbunătățite. Accesul la stările publice rămâne gratuit.</p>
    <div className="source-facts"><div><span>Licența aplicației</span><strong>AGPL-3.0</strong></div><div><span>Catalog inițial</span><strong>{institutionCount} instituții și servicii</strong></div><div><span>Aria acoperită</span><strong>Nivel central, România</strong></div><div><span>Depozit public GitHub</span><strong><a className="text-link" href="https://github.com/capitanumihai/starea-statului" target="_blank" rel="noopener noreferrer">Vezi codul <ArrowUpRightIcon size={14} /></a></strong></div></div>
    <p className="muted">Sponsorizările și serviciile de monitorizare găzduită pot susține proiectul. Sponsorii nu pot schimba măsurătorile sau metodologia.</p>
    <div className="dialog-actions"><a href={assetPath('starea-statului-source.zip')} download className="primary-button"><CodeIcon size={18} />Descarcă sursele</a><button className="secondary-button" onClick={onDownload}><DownloadSimpleIcon size={18} />Exportă catalogul</button></div>
    <p className="small muted">Catalogul este o primă selecție a instituțiilor centrale importante. Nu este un registru legal exhaustiv. Adresele și denumirile sunt versionate și pot fi corectate prin contribuții.</p>
  </Dialog>
}
function HistoryDialog({ item, reading, mode, period, onPeriod, onClose }) {
  return <Dialog title={item.shortName} eyebrow={'ISTORIC · ' + (mode === 'demo' ? 'DATE DEMONSTRATIVE' : 'MĂSURĂTORI REALE')} onClose={onClose} wide>
    <div className="history-toolbar"><Status status={reading.status} /><div className="period-switch" aria-label="Perioada istoricului">{periods.map((p) => <button key={p.value} aria-pressed={period === p.value} onClick={() => onPeriod(p.value)}>{p.label}</button>)}</div></div>
    <div className="history-metrics"><div><span>Disponibilitate HTTP</span><strong>{percent(reading.uptime)}</strong></div><div><span>Acoperirea perioadei</span><strong>{percent(reading.coverage)}</strong></div><div><span>Ultimul răspuns</span><strong>{duration(reading.latency)}</strong></div></div>
    <AvailabilityBars reading={reading} className="history-chart" period={period} />
    <div className="chart-axis"><span>{day(Date.now() - period * 86400000)}</span><span>{day(Date.now())}</span></div>
    {reading.uptime == null && <div className="empty-history"><ClockCounterClockwiseIcon size={32} weight="light" /><h3>Istoricul începe cu prima verificare.</h3><p>Nu completăm perioadele nemăsurate cu procente inventate.</p></div>}
    <div className="history-explanation"><h3>Ce este verificat</h3><p>{item.description}</p><a className="text-link" href={item.url} target="_blank" rel="noopener noreferrer">{new URL(item.url).hostname} <ArrowUpRightIcon size={15} /></a></div>
    <div className="notice"><InfoIcon size={20} /><p>{mode === 'demo' ? 'Valorile și barele ilustrează interfața. Nu reprezintă incidente sau măsurători reale.' : 'Procentul se referă la ' + observedDuration(reading.observedMs) + ' de observații cunoscute. Probele provin dintr-un singur punct. Intervalele fără probe rămân necunoscute.'}</p></div>
  </Dialog>
}
function Inspector({ item, reading, mode, period, onPeriod, onHistory, onMethod, onClose }) {
  return <aside className="inspector" aria-label="Detaliile serviciului selectat" id="detalii-serviciu">
    <div className="inspector-topline"><span className="eyebrow">SERVICIUL SELECTAT</span><button className="icon-button mobile-only" aria-label="Închide detaliile" onClick={onClose}><XIcon size={20} /></button></div>
    <h2 title={item.name}>{item.shortName}</h2><Status status={reading.status} />
    <p className="reading-type">Răspuns HTTP · pagină publică</p>
    <a className="service-url" href={item.url} target="_blank" rel="noopener noreferrer"><ArrowUpRightIcon size={18} />{new URL(item.url).hostname.replace('www.', '')}<ArrowUpRightIcon size={13} /></a>
    <p className="inspector-description">{item.description}</p>
    <div className="inspector-metric">
      <div className="metric-title">Disponibilitate HTTP <button className="tiny-button" onClick={onMethod} aria-label="Cum calculăm disponibilitatea"><InfoIcon size={16} /></button></div>
      <div className="period-switch inspector-periods" aria-label="Perioada disponibilității">{periods.map((p) => <button key={p.value} aria-pressed={period === p.value} onClick={() => onPeriod(p.value)}>{p.label}</button>)}</div>
      <div className={'uptime-number ' + (reading.uptime == null ? 'is-unknown' : '') + (mode === 'real' && reading.uptime != null && reading.coverage < 90 ? ' has-observation-note' : '')}>{percent(reading.uptime)}{mode === 'real' && reading.uptime != null && reading.coverage < 90 && <small>din {observedDuration(reading.observedMs)} de măsurători</small>}</div>
      <AvailabilityBars reading={reading} period={period} />
      <div className="chart-axis"><span>{day(Date.now() - period * 86400000)}</span><span>{day(Date.now())}</span></div>
      <div className="coverage-line"><span>Acoperirea perioadei</span><span>{percent(reading.coverage)}</span></div>
    </div>
    <div className="latency-block"><strong>{duration(reading.latency)}</strong><span>ultimul răspuns</span></div>
    <button className="primary-button history-button" onClick={onHistory}>Vezi istoricul <ArrowRightIcon size={20} /></button>
    <div className="inspector-bottom"><div><span className="status-dot" /><span>{reading.lastChecked ? 'Verificat la ' + time(reading.lastChecked) : 'Încă nu există verificări'}</span></div><p>{mode === 'demo' ? 'Date fictive, folosite numai pentru demonstrație.' : reading.reason || 'Probele sunt colectate dintr-un singur punct.'}</p><a className="text-link" href={item.source} target="_blank" rel="noopener noreferrer">Sursa instituției <ArrowUpRightIcon size={13} /></a></div>
  </aside>
}

export function App() {
  const [category, setCategory] = useState('panorama')
  const [selectedId, setSelectedId] = useState(() => { const id = selectedService(window.location.search, window.location.pathname); return institutionById[id] ? id : 'ghiseul' })
  const [view, setView] = useState(() => window.matchMedia('(max-width: 950px)').matches ? 'list' : 'map')
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('mod') === 'demo' ? 'demo' : 'real')
  const [modeOpen, setModeOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [mobileInspector, setMobileInspector] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [period, setPeriod] = useState(30)
  const [demoAnchor] = useState(Date.now)
  const demo = useMemo(() => createDemo(period, demoAnchor), [period, demoAnchor])
  const [real, setReal] = useState({})
  const [apiError, setApiError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [listPage, setListPage] = useState(0)
  const [clock, setClock] = useState(new Date())
  const [toast, setToast] = useState('')
  const searchRef = useRef(null)
  const requestSequence = useRef(0)
  const freshReadings = useMemo(() => expirePublishedReadings(real, clock.getTime()), [real, clock])
  const readings = mode === 'demo' ? demo : real.days === period ? freshReadings : {}
  const publicationTime = real.generatedAt ? new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'short', timeStyle: 'short' }).format(new Date(real.generatedAt)) : null
  const selected = institutionById[selectedId]
  const reading = readings[selectedId] || emptyReading(selectedId)
  const results = useMemo(() => searchInstitutions(query, category), [query, category])
  const suggestions = useMemo(() => searchInstitutions(query).slice(0, 6), [query])
  const knownReadings = Object.values(readings).filter((r) => ['up', 'slow', 'down'].includes(r.status))
  const responsiveCount = knownReadings.filter((r) => r.status !== 'down').length
  const trackedCount = Object.keys(readings).length
  const loadReal = useCallback(async () => {
    const sequence = ++requestSequence.current
    setRefreshing(true)
    try {
      const endpoint = publishedData ? assetPath('monitor/status-' + period + '.json') : '/api/status?days=' + period
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000), cache: 'no-cache' })
      if (!response.ok) throw new Error('API indisponibil')
      const data = await response.json()
      if (!data.readings || data.mode !== 'real') throw new Error('API invalid')
      if (sequence !== requestSequence.current) return
      setReal({ ...data, days: period }); setClock(new Date()); setApiError('')
    } catch { if (sequence === requestSequence.current) { setApiError('Colectorul nu este disponibil. Nu afișăm rezultate demonstrative în locul măsurătorilor.'); setReal({}) } }
    finally { if (sequence === requestSequence.current) setRefreshing(false) }
  }, [period])
  useEffect(() => { if (mode !== 'real') return; loadReal(); const timer = setInterval(loadReal, 60000); return () => clearInterval(timer) }, [mode, loadReal])
  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 60000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    function keyboard(event) {
      if (event.key === 'Escape') { setSearchFocused(false); setModeOpen(false); setMobileMenu(false) }
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') { event.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard)
  }, [])
  useEffect(() => setListPage(0), [category, query])
  useEffect(() => { if (view === 'list' && category !== 'panorama' && !query) { const index = institutions.filter((item) => item.category === category).findIndex((item) => item.id === selectedId); setListPage(Math.max(0, Math.floor(index / 12))) } }, [selectedId, category, view])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer) }, [toast])
  const selectService = useCallback((id) => {
    if (!institutionById[id]) return
    setSelectedId(id); setSearchFocused(false); setMobileInspector(true)
    const url = new URL(window.location.href); url.searchParams.set('serviciu', id); window.history.replaceState({}, '', url)
  }, [])
  const openCategory = useCallback((id) => { setCategory(id); setQuery(''); setSearchFocused(false) }, [])
  const exportCatalog = () => {
    const blob = new Blob([JSON.stringify({ project: 'Starea Statului', exportedAt: new Date().toISOString(), scope: 'instituții centrale și servicii naționale', exhaustive: false, categories, institutions }, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'starea-statului-catalog.json'; anchor.click(); URL.revokeObjectURL(url); setToast('Catalogul a fost exportat.')
  }
  const showSearch = searchFocused && query.trim()
  const visibleActivity = Object.entries(readings).filter(([id, r]) => institutionById[id] && r.lastChecked).sort((a, b) => new Date(b[1].lastChecked) - new Date(a[1].lastChecked)).slice(0, 7)
  const visibleList = results.slice(listPage * 12, listPage * 12 + 12)
  const listPages = Math.max(1, Math.ceil(results.length / 12))
  return <div className="app-shell">
    <a href="#continut" className="skip-link">Sari la conținut</a>
    <header className="site-header">
      <a className="brand" href={assetPath('')} aria-label="Starea Statului, pagina principală" onClick={(event) => { event.preventDefault(); setCategory('panorama'); setView('map'); setQuery('') }}><GraphIcon size={34} weight="light" /><span>Starea Statului<span className="brand-period">.</span></span></a>
      <nav className={'primary-nav ' + (mobileMenu ? 'nav-open' : '')} aria-label="Navigare principală">
        <button className={view === 'map' ? 'active' : ''} onClick={() => { setView('map'); setMobileMenu(false) }}>Hartă</button>
        <button className={view === 'list' ? 'active' : ''} onClick={() => { setView('list'); setMobileMenu(false) }}>Instituții <span className="nav-count">{institutionCount}</span></button>
        <button onClick={() => { setDialog('method'); setMobileMenu(false) }}>Metodologie</button>
        <button onClick={() => { setDialog('source'); setMobileMenu(false) }}>Cod sursă <ArrowUpRightIcon size={13} /></button>
      </nav>
      <div className="header-right"><div className="mode-container">
        <button className={'mode-badge ' + (mode === 'real' ? 'real-mode' : '')} aria-expanded={modeOpen} onClick={() => setModeOpen(!modeOpen)}>{mode === 'demo' ? <><strong>DEMO</strong><span>· Date demonstrative</span></> : <><span className="status-dot" /><strong>Date reale</strong></>}<CaretDownIcon size={12} /></button>
        {modeOpen && <div className="mode-menu"><p>SURSA DATELOR</p><button onClick={() => { setMode('demo'); setModeOpen(false) }}><span><strong>Demonstrație</strong><small>Explorează interfața cu date fictive</small></span>{mode === 'demo' && <CheckIcon />}</button><button onClick={() => { setMode('real'); setModeOpen(false) }}><span><strong>Măsurători reale</strong><small>Probele acestei instalări</small></span>{mode === 'real' && <CheckIcon />}</button></div>}
      </div><div className="header-clock"><time dateTime={clock.toISOString()}>{new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', year: 'numeric' }).format(clock)}</time><span>{time(clock)} <i />Europe/Bucharest</span></div><button className="icon-button mobile-menu-toggle" aria-label={mobileMenu ? 'Închide meniul' : 'Deschide meniul'} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <XIcon size={24} /> : <ListIcon size={24} />}</button></div>
    </header>
    <main id="continut">
      <section className="workspace-heading">
        <div><div className="heading-kicker"><span className="status-dot" />OBSERVATOR CIVIC INDEPENDENT</div><h1>Pulsul digital al României<span>.</span></h1><p>Instituțiile centrale. Serviciile publice. Dintr-o singură privire.</p></div>
        <div className="search-container"><form role="search" className="search-field" onSubmit={(event) => { event.preventDefault(); setView('list'); setSearchFocused(false); setCategory('panorama') }}><MagnifyingGlassIcon size={20} aria-hidden="true" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 180)} placeholder="Caută o instituție sau un serviciu..." aria-label="Caută o instituție sau un serviciu" autoComplete="off" />{query ? <button type="button" aria-label="Șterge căutarea" onClick={() => { setQuery(''); searchRef.current?.focus() }}><XIcon size={16} /></button> : <kbd>Ctrl K</kbd>}</form>
          {showSearch && <div className="search-results"><p>{suggestions.length ? 'INSTITUȚII ȘI SERVICII' : 'NICIUN REZULTAT'}</p>{suggestions.map((item) => <button key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { selectService(item.id); setCategory(item.category); setQuery('') }}><InstitutionIcon kind={item.image} size={23} /><span><strong>{item.shortName}</strong><small>{item.name === item.shortName ? categoryById[item.category].name : item.name}</small></span><ArrowUpRightIcon size={16} /></button>)}{!suggestions.length && <div className="search-empty">Încearcă numele complet sau o abreviere, precum SRI ori DNA.</div>}<button className="all-results" onMouseDown={(event) => event.preventDefault()} onClick={() => { setView('list'); setCategory('panorama'); setSearchFocused(false) }}>Vezi rezultatele în catalog <ArrowRightIcon size={15} /></button></div>}
        </div>
      </section>
      <section className="workspace-summary" aria-label="Rezumatul catalogului"><div className="availability-summary">{trackedCount ? <><strong>{responsiveCount}<span> / {trackedCount}</span></strong><span>{mode === 'demo' ? 'servicii răspund în demo' : 'endpointuri răspund acum'}</span></> : <><strong>{institutionCount}</strong><span>instituții și servicii în catalog</span></>}<span className={'summary-tag ' + (mode === 'real' ? 'real-tag' : '')}>{mode === 'demo' ? 'Exemplu demonstrativ' : 'Un singur punct de verificare'}</span></div><div className="summary-controls"><span className="catalog-scope"><span className="scope-marker" />Nivel central · România</span>{mode === 'real' && <button className="icon-button" aria-label="Actualizează măsurătorile" disabled={refreshing} onClick={loadReal}><ArrowClockwiseIcon size={18} className={refreshing ? 'spin' : ''} /></button>}<div className="view-switch" aria-label="Modul de vizualizare"><button aria-pressed={view === 'map'} aria-label="Vizualizare hartă" onClick={() => setView('map')}><MapTrifoldIcon size={18} /></button><button aria-pressed={view === 'list'} aria-label="Vizualizare listă" onClick={() => setView('list')}><ListIcon size={19} /></button></div></div></section>
      <div className="category-bar" aria-label="Ramurile catalogului"><button aria-pressed={category === 'panorama'} className={category === 'panorama' ? 'active' : ''} onClick={() => openCategory('panorama')}><SquaresFourIcon size={16} />Panoramă</button>{categories.map((item) => <button key={item.id} aria-pressed={category === item.id} className={category === item.id ? 'active' : ''} onClick={() => openCategory(item.id)}>{item.name}<span>{institutions.filter((i) => i.category === item.id).length}</span></button>)}</div>
      {mode === 'real' && apiError && <div className="api-notice" role="status"><WarningCircleIcon size={20} /><p>{apiError}</p><button onClick={loadReal}>Reîncearcă</button></div>}
      {mode === 'real' && publishedData && publicationTime && <div className="publication-notice" role="status"><InfoIcon size={17} /><p>Măsurători publicate la <strong>{publicationTime}</strong>. Actualizările sunt periodice și pot întârzia. Probele mai vechi de zece minute apar ca „Fără date”.</p></div>}
      <div className="workspace">
        <section className={'explorer ' + (view === 'list' ? 'list-explorer' : '')} aria-label={view === 'map' ? 'Harta serviciilor' : 'Catalogul instituțiilor'}>
          {view === 'map' ? <div className="map-canvas"><Suspense fallback={<div className="map-loading"><CircleNotchIcon size={26} className="spin" />Se pregătește harta...</div>}><ServiceMap category={category} selectedId={selectedId} readings={readings} onSelect={selectService} onOpenCategory={openCategory} /></Suspense></div> :
          <div className="catalog-view"><div className="catalog-heading"><div><span className="eyebrow">CATALOG NAȚIONAL</span><h2>{category === 'panorama' ? 'Instituții și servicii' : categoryById[category].name}</h2><p>{results.length} rezultate{query ? ' pentru „' + query + '”' : ' · nivel central'}</p></div><button className="icon-button" aria-label="Exportă catalogul JSON" onClick={exportCatalog}><DownloadSimpleIcon size={21} /></button></div>
            <div className="catalog-table" aria-label="Instituții din catalog"><div className="catalog-table-head"><span>INSTITUȚIE / SERVICIU</span><span>STARE</span><span>HTTP · {periods.find((p) => p.value === period).label.toUpperCase()}</span></div>{visibleList.map((item) => { const r = readings[item.id] || emptyReading(item.id); return <button key={item.id} className={'catalog-row ' + (selectedId === item.id ? 'selected' : '')} onClick={() => selectService(item.id)}><span className="catalog-row-icon"><InstitutionIcon kind={item.image} size={25} /></span><span className="catalog-name"><strong>{item.shortName}</strong><small>{item.name === item.shortName ? categoryById[item.category].name : item.name}</small></span><Status status={r.status} compact /><span className="table-uptime">{percent(r.uptime)}</span><CaretRightIcon size={15} /></button> })}</div>
            {!results.length && <div className="empty-catalog"><MagnifyingGlassIcon size={34} /><h3>Nu am găsit această instituție.</h3><p>Încearcă o altă denumire sau caută în toate ramurile.</p><button className="secondary-button" onClick={() => { setCategory('panorama'); setQuery('') }}>Resetează căutarea</button></div>}
            {listPages > 1 && <div className="catalog-pagination"><span>{listPage * 12 + 1}–{Math.min((listPage + 1) * 12, results.length)} din {results.length}</span><div><button className="icon-button" aria-label="Pagina anterioară din catalog" disabled={listPage === 0} onClick={() => setListPage((p) => p - 1)}><ArrowLeftIcon size={18} /></button><span>{listPage + 1} / {listPages}</span><button className="icon-button" aria-label="Pagina următoare din catalog" disabled={listPage >= listPages - 1} onClick={() => setListPage((p) => p + 1)}><ArrowRightIcon size={18} /></button></div></div>}
            <p className="catalog-note"><InfoIcon size={15} />Catalog inițial, extensibil. „Fără date” înseamnă că nu avem încă măsurători, nu că instituția este indisponibilă.</p>
          </div>}
        </section>
        <div className={'inspector-wrapper ' + (mobileInspector ? 'mobile-inspector-open' : '')}><Inspector item={selected} reading={reading} mode={mode} period={period} onPeriod={setPeriod} onHistory={() => setDialog('history')} onMethod={() => setDialog('method')} onClose={() => setMobileInspector(false)} /></div>
      </div>
      <section className="recent-activity"><div className="activity-heading"><h2><span className="activity-pulse" />Activitate recentă</h2><span>{mode === 'demo' ? 'Evenimente demonstrative' : 'Ultimele probe colectate'}<i />{time(clock)}</span></div>{visibleActivity.length ? <div className="activity-grid">{visibleActivity.map(([id, r]) => <button className="activity-item" key={id} onClick={() => selectService(id)}><span className={'status-dot status-' + r.status} /><div><time>{time(r.lastChecked)}</time><strong>{institutionById[id].shortName}</strong><span>{r.httpCode ? r.httpCode + ' HTTP' : r.status === 'down' ? 'Timeout' : statusMeta[r.status].label}{r.latency !== null ? ' · ' + duration(r.latency) : ''}</span></div></button>)}</div> : <div className="activity-empty"><ClockCounterClockwiseIcon size={20} />Primele verificări vor apărea aici. Istoricul nu este completat retroactiv.</div>}</section>
    </main>
    <footer className="site-footer"><div><span>Starea Statului</span><i />Monitorizare independentă<i /><button onClick={() => setDialog('source')}>Open source <ArrowUpRightIcon size={12} /></button></div><p>{mode === 'demo' ? 'Date demonstrative.' : 'Date măsurate de această instalare.'} Un site accesibil nu confirmă funcționarea tuturor serviciilor.</p></footer>
    {dialog === 'method' && <Methodology onClose={() => setDialog(null)} />}{dialog === 'source' && <SourceDialog onClose={() => setDialog(null)} onDownload={exportCatalog} />}{dialog === 'history' && <HistoryDialog item={selected} reading={reading} mode={mode} period={period} onPeriod={setPeriod} onClose={() => setDialog(null)} />}{toast && <div className="toast" role="status"><CheckIcon size={18} />{toast}</div>}
  </div>
}
