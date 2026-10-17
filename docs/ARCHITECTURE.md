# Arhitectura implementată

## Fluxul datelor

Procesul Node verifică endpointuri publice din catalog și păstrează rezultatele în SQLite. API-ul citește acele probe. Interfața citește API-ul, fără să declanșeze verificări suplimentare către instituții la fiecare vizită.

Interfața este React și JSX, pornită din șablonul Product Design pe Vite. Graful React Flow se încarcă separat. Există o listă accesibilă echivalentă, folosită implicit pe ecrane înguste.

Serverul Node poate livra atât buildul static, cât și API-ul pe același origin. Vite folosește un proxy pentru dezvoltare.

## Catalog

packages/catalog/institutions.mjs conține 140 de înregistrări, ID-uri stabile, denumiri, abrevieri, categorii, URL-uri și surse. Grupurile reprezintă navigare. Liniile continue sunt rezervate legăturii dintre Parlament și cele două camere.

Catalogul ADR este o sursă de cercetare separată. Importul său de 568 de înregistrări nu adaugă automat instituții în interfață. Înregistrările noi necesită revizuirea scopului, a adresei și a denumirii.

## Colector

O rundă este programată la cinci minute. Cel mult trei cereri sunt active simultan, cu o pauză scurtă între cererile unui lucrător. O rundă nouă nu se suprapune peste o rundă încă activă.

Se folosesc cereri GET către pagini publice, cu timeout, limită de redirecționări și limită pentru corpul citit. Nu sunt folosite conturi, plăți, documente sau date personale.

Rezoluția DNS este validată, adresa publică aleasă este fixată pentru cerere, iar rețelele private și adresele speciale sunt excluse. Redirecționările către alte domenii cer revizuire în catalog.

HTTP 2xx este un răspuns disponibil. Răspunsurile de peste 1500 ms apar ca lente. HTTP 5xx și erorile de conexiune sunt observații de eșec. HTTP 401, 403, 407, 429 și indiciile de blocare automată apar ca verificare blocată. Alte răspunsuri neconcludente nu sunt transformate automat în indisponibilitate.

## Măsurători și procente

Fiecare probă păstrează ID-ul serviciului, ora UTC, starea, durata, codul HTTP și explicația. Interfața afișează orele în Europe/Bucharest.

O observație este valabilă până la următoarea probă sau cel mult zece minute. Intervalele sunt intersectate cu perioada solicitată și ponderate în timp.

Disponibilitate HTTP = timp disponibil / timp cu rezultat cunoscut × 100.

Acoperire = timp cu rezultat cunoscut / durata perioadei solicitate × 100.

Răspunsurile lente contează ca disponibile în procentul HTTP. Intervalele necunoscute și verificările blocate nu sunt transformate în succes sau cădere. O singură probă nu inventează un istoric lunar.

Când acoperirea este redusă, lângă procent apare durata efectiv observată. De exemplu, un procent bazat pe 30 de minute este însoțit de această durată și de acoperirea ferestrei alese.

Starea curentă expiră după zece minute. Un eșec izolat rămâne neconfirmat. Trei eșecuri consecutive, apropiate în timp, confirmă o observație din punctul local. Nu se pretinde confirmare globală sau din mai multe regiuni.

Contorul serviciilor care răspund acum este separat de disponibilitatea istorică.

## API

- GET /api/status?days=1 sau 7 sau 30 întoarce probe agregate și perioada
- GET /api/catalog întoarce catalogul și categoriile
- GET /api/health întoarce starea procesului și a colectorului
- GET /catalog.json oferă catalogul generat la build

Cereri de scriere nu sunt acceptate de API. Serverul se leagă implicit la 127.0.0.1. MONITOR_ENABLED=false oprește rundele automate. Configurația se preia din mediul procesului, nu automat dintr-un fișier .env.

## SEO

Buildul adaugă HTML pentru pagina principală și pentru fiecare dintre cele 140 de înregistrări. Titlurile și descrierile sunt specifice instituției, iar HTML-ul include denumirea, descrierea și legătura oficială, fără procente demonstrative.

PUBLIC_SITE_URL configurează originea HTTPS, adresele canonice și sitemap-ul. Până la configurarea domeniului, paginile au noindex și robots.txt interzice indexarea. Filtrele și parametrii de demonstrație nu sunt rute editoriale noi.

## Viteză și accesibilitate

Harta are un pachet separat. Fonturile sunt locale și imaginile sunt WebP. API-ul are cache scurt pentru agregări. Activele cu nume amprentate au cache lung, iar fișierele stabile se revalidează.

Stările au text și culoare. Butoanele hărții sunt accesibile prin tastatură. Există listă, căutare, focus vizibil, ferestre native dialog și respectarea preferinței de mișcare redusă.

Au fost verificate lățimi CSS de 1440, 1280, 768, 390 și 320 px. Fonturile sunt lăsate să se încarce înainte de judecarea încadrării.

## Publicare

Runtime-ul static Product Design pentru Sites a fost păstrat. Serviciul complet are și un colector Node cu SQLite, care necesită o gazdă cu proces persistent și stocare persistentă. Publicarea doar a fișierelor statice nu asigură colectarea probelor.

Baza de observații rămâne locală. Arhiva surselor exclude datele colectate, node_modules, fișiere .env și materialele temporare de QA. Codul, catalogul, metodologia, imaginile consumate și licențele sunt incluse.
