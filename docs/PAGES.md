# Publicarea pe GitHub Pages

Data: 17 octombrie 2026

## Adresă și surse

Adresa configurată este https://capitanumihai.github.io/starea-statului/.

Sursele sunt pe ramura main din https://github.com/capitanumihai/starea-statului. Fișierul .github/workflows/pages.yml controlează colectarea, verificările, construirea și publicarea.

Publicarea online a fost cerută explicit de utilizator. Configurația Pages folosește GitHub Actions și acces public.

## Arhitectura publică

GitHub Pages livrează interfața, paginile instituțiilor, imaginile, fonturile, catalogul și arhiva surselor. Nu execută serverul Node.

GitHub Actions execută o rundă de probe la publicarea surselor, la declanșare manuală și conform unei programări la cinci minute, începând cu minutul 2 al orei. Trei cereri rulează simultan, cu o pauză de 350 ms între verificările fiecărui fir.

Colectorul folosește numai URL-urile oficiale din catalog. Păstrează protecția adreselor private, limita de răspuns, tratarea blocării automate și confirmarea prin trei eșecuri apropiate.

Istoricul online începe cu prima rulare găzduită. Baza SQLite de pe calculator nu este citită, transferată sau publicată de acest flux.

## Date și persistență

Ramura monitor-data păstrează history.json cu ultimele trei probe ale fiecărui endpoint și intervalele de observații necesare calculelor pentru treizeci de zile. Datele provin din verificările publice executate online. Sunt păstrate numai stări, momente, latențe, coduri HTTP, motive și URL-uri publice.

Intervalele consecutive cu aceeași stare sunt reunite fără pierderea duratelor. Un gol de colectare mai lung de zece minute rămâne necunoscut. Schimbarea URL-ului unui endpoint începe un istoric nou pentru acea adresă.

Git păstrează reviziile anterioare ale ramurii de date. Fereastra de treizeci de zile se aplică setului folosit pentru calcule, nu ștergerii tuturor reviziilor Git.

Fișierele publice rezultate sunt:

- monitor/status-1.json pentru 24 de ore
- monitor/status-7.json pentru 7 zile
- monitor/status-30.json pentru 30 de zile
- monitor/health.json pentru ultima rundă și revizia surselor

Acestea sunt generate în apps/web/public/monitor, copiate în build și excluse din main și din arhiva codului.

## Interfață și SEO

VITE_BASE_PATH este /starea-statului/, iar PUBLIC_SITE_URL este adresa HTTPS completă cu aceeași cale și separator final. VITE_DATA_SOURCE=pages activează citirea fișierelor JSON publicate.

Imaginile nodurilor, fundalul, activele compilate și descărcarea surselor respectă subdirectorul. Adresele directe de forma /starea-statului/institutii/sri/ selectează instituția corectă.

Sunt generate 141 de pagini indexabile de conținut, un sitemap, metadate canonical și Open Graph, catalogul JSON și o pagină 404 cu noindex. Fișierul robots.txt din subdirector este disponibil ca document al proiectului. Regulile de crawling ale întregii origini github.io sunt administrate la rădăcina acelei origini.

Fonturile rămân locale, imaginile sunt WebP, iar harta se încarcă separat. Vizitatorii citesc rezultatele publicate și nu declanșează probe către instituții.

## Limitele programării

Programarea GitHub Actions poate întârzia sau poate omite rulări în perioade aglomerate. Un interval strict de cinci minute nu este garantat. Interfața publică arată momentul publicării și expiră independent stările după zece minute, inclusiv când fișierul JSON a rămas vechi.

Procentul istoric se referă la observațiile cunoscute din instantaneul publicat. Durata observată și acoperirea sunt afișate separat. Nu este completat un istoric retroactiv.

În depozitele publice, GitHub poate dezactiva programările după 60 de zile fără activitate în depozit. Verifică periodic pagina Actions și ultima rundă publicată.

Surse tehnice:

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/rest/pages/pages

## Verificare și intervenție

Rulările sunt disponibile la https://github.com/capitanumihai/starea-statului/actions/workflows/pages.yml.

O rundă manuală se pornește din Run workflow sau cu:

    gh workflow run pages.yml

Un eșec al construirii păstrează versiunea publică precedentă. Datele vechi expiră în interfață. Un eșec al citirii istoricului oprește publicarea, fără să înlocuiască tacit istoricul cu un set gol.

Pentru oprirea colectării și publicării automate se dezactivează fluxul din Actions. Pentru revenire se reactivează și se pornește o rulare manuală. Pentru revenirea codului se folosește un commit de corecție sau git revert, apoi se publică din nou.

## Starea verificării

Configurarea Pages a fost creată. Cele 23 de teste de domeniu și compatibilitate Pages, cele 4 teste ale runtime-ului și cele 3 teste ale pachetului public au trecut local. Buildul pentru subdirector a trecut.

În browserul local au fost verificate ruta directă SRI, schimbarea perioadei, încărcarea imaginilor și fundalului din subdirector și absența erorilor de consolă la lățimea de 1280 px. Publicarea și verificarea adresei externe sunt în curs.

La 390 px au fost verificate căutarea SRI și lipsa derulării orizontale. Testele care verifică fișierele de publicare se execută după build, pentru a funcționa și într-un checkout curat.
