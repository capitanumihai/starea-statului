# Verificare vizuală și funcțională

final result: passed

## Ținta și dovezile

Sursă vizuală: docs/design/03-camera-de-control.png, a treia imagine aleasă explicit de utilizator.

Build verificat: http://127.0.0.1:4174

Stare de comparație: ?mod=demo, Panoramă, Ghișeul.ro selectat, perioada de 30 de zile.

Viewport final: 1440 × 1024 pixeli CSS, devicePixelRatio 1. Captura browserului returnează regiunea de conținut 1425 × 1013 pixeli. Sursa de 1487 × 1058 a fost normalizată la dimensiunea capturii pentru comparație. Nu a fost modificată implementarea pentru normalizarea imaginii.

Dovezile sursei și implementării au fost deschise împreună în aceeași imagine:

- docs/qa/desktop-final.png
- docs/qa/comparison-desktop-final.png
- docs/qa/comparison-inspector-final.png

Capturi suplimentare:

- docs/qa/desktop-real.png, cu date reale și durata efectiv observată
- docs/qa/mobile-real.png, fișa SRI pe telefon
- docs/qa/responsive-checks.json, verificări de încadrare după încărcarea fonturilor

Capturile exploratorii vechi din serverul Vite au avut o scală internă diferită. Rezultatul final folosește buildul de pe portul 4174, cu densitatea verificată direct în browser.

## Istoricul comparațiilor și corecțiilor

Prima comparație comună a găsit două probleme P2. Fundalul cartografic concura cu legăturile grafului, iar procentul și barele de istoric erau prea mici față de țintă. A fost atenuat rasterul de fundal și a fost mărită scara indicatorilor și a butonului de istoric.

Testarea mobilă a găsit o problemă P2: lista ascundea etichetele vizuale ale stărilor. Etichetele au fost mutate sub numele instituției și verificate la 390 și 320 px.

Testarea cu mouse-ul a găsit o problemă P1: React Flow dezactiva evenimentele pointer pe nodurile marcate ca needitabile, deoarece nu primea un handler de selectare. A fost adăugat onNodeClick și au fost marcate butoanele interne cu nodrag și nopan. O regulă CSS simplă nu a fost suficientă. Buildul ulterior a fost testat prin clic pe DNA și selecția a actualizat URL-ul, starea activă și fișa. Selecția SRI prin Enter a fost verificată separat.

La 320 px, lățimea minimă a paginii crea depășire în prezența barei de derulare. A fost eliminată acea limită. După încărcarea fonturilor, niciuna dintre lățimile verificate nu are depășire orizontală sau suprapunere a antetului.

Comparația finală comună și comparația focalizată a panoului nu au constatări P0, P1 sau P2 rămase.

## Suprafețele obligatorii

Tipografie: Manrope este încărcat local și are diacritice românești. Scara titlului, procentul și greutățile păstrează ierarhia aleasă. Cifrele tehnice folosesc IBM Plex Mono. Micile diferențe de formă față de rasterul generat sunt P3.

Spațiere și ritm: panoul începe imediat sub antet, alături de zona de lucru. Harta, panoul și activitatea păstrează compoziția aleasă. Bara de ramuri și nodurile SRI și DNA sunt extinderi intenționate pentru scopul cerut.

Culori: suprafață cerneală, mentă pentru disponibil, chihlimbar pentru lent, coral pentru indisponibil, gri pentru date lipsă și mov pentru verificare blocată. Rasterul geografic este atenuat. Starea este exprimată și prin text.

Imagini: toate cele cinci active raster sunt prezente și păstrează raportul de aspect. Arhitectura este ilustrativă. Pictogramele provin din Phosphor, iar liniile funcționale ale grafului din React Flow. Nu au fost folosite desene CSS sau SVG-uri manuale drept înlocuitori de active.

Conținut: catalogul are 140 de înregistrări centrale, cu denumiri, grupuri și adrese. Contorul demonstrației folosește cele opt exemple existente. ROeID nu mai are un eveniment de succes demonstrativ care să contrazică starea sa fără date. Modul real nu folosește valori fictive.

## Interacțiuni verificate

- Clic pe noduri și selecție prin tastatură
- Căutare SRI și DNA, cu și fără diacritice în regulile de catalog
- Ramuri, paginarea hărții, DNSC pe pagina a doua și selecția echivalentă în listă
- Paginarea catalogului, căutare fără rezultate și resetare
- Istoric, selectarea perioadelor și revenirea focusului
- Metodologie și explicația acoperirii
- Trecere între demonstrație și probe reale
- Afișarea distinctă a verificării blocate, a datelor lipsă și a perioadei observate
- Descărcarea ZIP și exportul JSON din interfață
- Desktop, tabletă și telefon
- Consola buildului final nu a raportat erori sau avertizări

## Verificări de încadrare

1280 × 900, 768 × 1024, 390 × 844 și 320 × 720 pixeli CSS au fost verificate cu fonturile încărcate. Documentul nu depășește lățimea disponibilă, iar marca și comenzile din antet nu se suprapun. La 1440 × 1024 au fost capturate și comparate regiunile principale.

## Dovezi separate de QA vizual

14 teste de domeniu și 4 teste ale runtime-ului au trecut. Buildul, paginile HTML prerandate, API-ul, exporturile și integritatea arhivei au fost verificate separat. Aceste rezultate nu au fost folosite drept înlocuitor pentru comparația în browser.

## P3 și limite

Familia de font și detaliile gravurilor generate diferă ușor față de machetă. Compoziția hărții include două noduri suplimentare și navigarea pentru catalogul extins. Acestea sunt adaptări intenționate ale scopului.

Nu s-a făcut o certificare WCAG, un audit SEO în producție, un test Lighthouse sau o confirmare a incidentelor din mai multe regiuni. Măsurătorile provin dintr-o singură instalare și au un istoric foarte scurt, indicat vizibil în interfață.
