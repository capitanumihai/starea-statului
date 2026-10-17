# Starea Statului

Ultima actualizare: 17 octombrie 2026

## Citește întâi acest fișier

Proiect nou, construit de la zero. Utilizatorul a ales explicit varianta vizuală 3, Camera de control, din docs/design/03-camera-de-control.png.

Scop confirmat: instituțiile mari de la nivel central și serviciile publice naționale, inclusiv SRI și DNA. Sunt excluse instituțiile locale și organizarea pe județe.

## Starea actuală

Publicarea prin GitHub Pages este în curs, la https://capitanumihai.github.io/starea-statului/. Configurația, structura colectorului online și limitele sunt documentate în docs/PAGES.md.

Aplicația locală este funcțională, cu 140 de instituții și servicii în opt ramuri. Are hartă interactivă, căutare, listă, paginare, fișă de serviciu, istoric și metodologie.

Modul implicit citește probe reale. Modul demonstrație este explicit și poate fi deschis cu ?mod=demo. Măsurătorile sunt locale, dintr-un singur punct, cu acoperire și durată observată afișate. Nu există istoric retroactiv.

Colectorul rulează runde la cinci minute, cu trei cereri simultane. Datele se păstrează în data/observations.sqlite, ignorat de Git și exclus din arhiva surselor.

## Adrese locale

- http://127.0.0.1:4174 este buildul verificat, cu API și colector
- http://127.0.0.1:4173 este interfața de dezvoltare Vite, cu proxy către API
- API: /api/status?days=1, /api/status?days=7, /api/status?days=30
- Catalog: /api/catalog și /catalog.json
- Sănătate proces: /api/health
- Descărcare surse: /starea-statului-source.zip

Procesele locale trebuie să rămână active pentru acces și colectare. Nu s-a instalat un serviciu Windows sau o automatizare de chat.

## Structură reală

- apps/web/src/App.jsx conține fluxurile, căutarea, lista, panoul și ferestrele de detaliu
- apps/web/src/ServiceMap.jsx conține graful React Flow și paginarea ramurilor
- apps/web/src/data.js conține exemplele demonstrative și formatarea
- apps/web/src/styles.css conține aspectul și adaptarea la ecrane mici
- apps/web/public/assets conține cele cinci imagini WebP folosite
- apps/monitor/probe.mjs verifică endpointurile publice
- apps/monitor/metrics.mjs calculează disponibilitatea și expirarea
- apps/monitor/server.mjs păstrează probele SQLite și livrează API-ul plus buildul
- packages/catalog/institutions.mjs este catalogul comun
- scripts/prerender.mjs generează HTML-ul indexabil
- scripts/package-source.py creează și verifică arhiva surselor
- scripts/document-catalog.mjs actualizează docs/CATALOG.md
- scripts/import-adr.py păstrează sursa ADR separat pentru cercetare
- .github/workflows/pages.yml colectează, verifică și publică varianta GitHub Pages
- apps/monitor/pages-history.mjs păstrează intervalele publice și generează instantaneele
- scripts/pages-monitor.mjs restaurează, colectează și păstrează istoricul online
- apps/web/src/deployment.mjs gestionează subdirectorul și expirarea în browser
- tests/metrics.test.mjs verifică măsurătorile și integritatea catalogului
- tests/pages.test.mjs verifică istoricul compact, expirarea și adresele Pages
- tests/pages-build.check.mjs verifică pachetul public construit

## Dovezi

- Buildul complet a trecut
- 23 de teste de domeniu și compatibilitate Pages au trecut
- 4 teste ale runtime-ului de publicare au trecut
- 3 teste ale pachetului Pages au trecut, inclusiv cele 140 de rute, activele din subdirector, metadatele și instantaneele reale
- Clicurile pe noduri, selecția prin tastatură, căutarea SRI și DNA, paginarea DNSC, istoricul, metodologia, starea fără rezultate și modurile de date au fost verificate în browser
- Descărcarea ZIP și exportul JSON au fost verificate din interfață
- Desktopul, tableta și lățimile CSS de 390 și 320 px au fost verificate
- Raportul final este în design-qa.md
- Capturile și comparațiile sunt în docs/qa
- Nu au fost raportate erori sau avertizări în sesiunea de browser a buildului final

## SEO și performanță

Buildul generează 141 de pagini HTML și catalog JSON. Domeniul public se configurează prin PUBLIC_SITE_URL înainte de build. Fără domeniu, indexarea rămâne oprită în previzualizare. Nu se pretinde verificare SEO sau performanță în producție.

Harta se încarcă separat. Fonturile sunt locale și imaginile sunt WebP. JavaScriptul principal are aproximativ 91 kB gzip, iar harta aproximativ 64 kB gzip în buildul verificat. Nu s-a măsurat un scor Lighthouse.

## Open source și publicare

Codul are licența AGPL-3.0-only. LICENSE, THIRD-PARTY.md și CONTRIBUTING.md sunt incluse. Depozitul public este https://github.com/capitanumihai/starea-statului, pe ramura main. Remote-ul origin folosește HTTPS. Publicarea surselor a fost cerută explicit de utilizator la 17 octombrie 2026. Detaliile și verificările sunt în docs/GITHUB.md.

Fereastra Open source din aplicație include legătura către depozitul public. Găzduirea Pages și colectarea în GitHub Actions sunt configurate separat de varianta locală. Vezi docs/PAGES.md pentru starea verificării.

Arhiva surselor este generată în apps/web/public și copiată în build. Are verificare ZIP și SHA-256. Nu include node_modules, baze de măsurători sau fișiere .env cu secrete.

Catalogul curat de 140 de înregistrări este o selecție extensibilă, nu un registru legal exhaustiv. Sursa ADR conține 568 de înregistrări și este păstrată separat în data/reference.

## Următoarea etapă

Finalizarea publicării GitHub Pages și verificarea măsurătorilor produse în GitHub Actions. Un domeniu propriu și un colector cu programare garantată pot fi adăugate ulterior. Confirmarea incidentelor dintr-un al doilea punct este o îmbunătățire pentru serviciul public.

## Reguli de păstrat

Actualizează această pagină și documentul relevant după schimbări importante. Nu citi node_modules. Păstrează româna cu diacritice, accesul public gratuit, sursele și distincția dintre site accesibil și operațiune reușită. Nu folosi punct și virgulă sau linie dublă în comentarii și explicații.
