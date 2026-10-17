# Starea Statului

Observator civic independent al instituțiilor centrale și serviciilor publice digitale din România. Interfața include o hartă interactivă, catalog cu căutare, istoric de disponibilitate și export de date.

Catalogul inițial conține 140 de instituții și servicii naționale, inclusiv SRI, SIE, STS, SPP, DNA, DIICOT, Parlamentul, Președinția, ministerele și autoritățile naționale. Instituțiile locale și organizarea pe județe sunt în afara scopului.

Catalogul este extensibil și nu reprezintă un registru legal exhaustiv. Grupurile sunt pentru navigare. Numai relațiile dintre Parlament și cele două camere sunt desenate ca legături instituționale.

## Pornire locală

Este necesar Node.js 22.13 sau ulterior. Pentru importul ADR și arhivarea surselor este necesar Python 3. SQLite este inclus în Node. Pe Node 22 poate apărea avertizarea că modulul SQLite este experimental.

    git clone https://github.com/capitanumihai/starea-statului.git
    cd starea-statului
    npm --prefix apps/web ci
    npm run dev

Interfața rulează la http://127.0.0.1:4173, API-ul la http://127.0.0.1:4174.

Colectorul verifică endpointurile publice, cu cel mult trei cereri simultane și o rundă la cinci minute. Vizitatorii citesc probele deja colectate și nu declanșează cereri suplimentare către instituții.

Pentru a opri verificările automate, setează MONITOR_ENABLED=false în mediul procesului. Configurația din .env.example trebuie transferată în mediul de rulare. Aplicația nu citește automat fișiere .env.

În PowerShell, activarea explicită este:

    $env:MONITOR_ENABLED = 'true'
    npm run dev

## Build și pornire

    npm run build
    npm start

Serverul Node livrează buildul și API-ul pe portul 4174. Nu expune implicit serverul în rețea. HOST=0.0.0.0 se configurează numai în mediul de găzduire ales.

PUBLIC_SITE_URL trebuie să conțină originea HTTPS publică înainte de build, pentru adrese canonice, sitemap și activarea indexării. Până atunci, paginile de previzualizare au noindex și robots.txt interzice indexarea.

## Date reale și demonstrație

Modul implicit arată măsurătorile reale ale acestei instalări. Din selectorul sursei datelor se poate activa demonstrația. Parametrul ?mod=demo deschide direct exemplele fictive.

Nu există istoric retroactiv. Disponibilitatea este ponderată în timp, iar acoperirea perioadei este publicată separat. O probă expiră după zece minute. Capturile demonstrative nu confirmă stări ale instituțiilor.

O blocare anti-bot este neconcludentă. Trei eșecuri consecutive confirmă numai o observație locală. Înainte de o lansare publică este recomandată confirmarea independentă a incidentelor dintr-un al doilea punct de verificare.

## Comenzi

    npm test
    npm run test:sites
    npm run monitor:once
    npm run catalog:import

Importul ADR păstrează o sursă de cercetare separată, cu proveniență. Nu introduce automat spitale, școli, instituții locale sau înregistrări neverificate în catalogul public.

## Structură

- apps/web conține interfața React, Vite și runtime-ul de publicare
- apps/monitor conține colectorul Node, API-ul și calculul disponibilității
- packages/catalog conține catalogul central comun
- scripts conține pornirea, pregătirea SEO, importul de referință și arhivarea surselor
- tests conține verificările pentru măsurători, catalog și izolarea rețelelor private
- docs/PROJECT-STATE.md este punctul de pornire pentru progres și decizii
- data/observations.sqlite conține numai măsurători locale, ignorate de Git

## Licență și contribuții

Codul aplicației este oferit sub AGPL-3.0-only. Consultă LICENSE. Bibliotecile, fonturile și activele au licențele lor, descrise în THIRD-PARTY.md.

Pentru adăugarea unei instituții, propune numele, abrevierea, categoria de navigare și URL-ul oficial în packages/catalog/institutions.mjs. Nu publica date personale, credențiale sau stări fără probe. Vezi CONTRIBUTING.md.

Depozitul public este [capitanumihai/starea-statului](https://github.com/capitanumihai/starea-statului), pe ramura main. Detaliile publicării sunt în [docs/GITHUB.md](docs/GITHUB.md). Aplicația rulează local, iar domeniul și găzduirea serviciului urmează să fie configurate.
