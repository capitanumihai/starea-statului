# Activele vizuale

Ținta aleasă de utilizator este docs/design/03-camera-de-control.png, a treia imagine afișată în conversație.

Au fost generate cinci active raster distincte în aceeași direcție: gravură arhitecturală în tonuri de piatră argintie, fundal cerneală închisă, fără text sau elemente de interfață.

| Fișier utilizat | Dimensiune | Rol |
| :--- | :--- | :--- |
| apps/web/public/assets/parliament.webp | 768 × 768 | Palatul Parlamentului, nod central |
| apps/web/public/assets/chamber.webp | 768 × 768 | Detaliu arhitectural pentru Camera Deputaților |
| apps/web/public/assets/senate.webp | 768 × 768 | Detaliu arhitectural pentru Senat |
| apps/web/public/assets/mai.webp | 768 × 768 | Ilustrație pentru nodul HUB MAI |
| apps/web/public/assets/romania-map.webp | 1440 × 900 | Fundal geografic decorativ |

Generatorul integrat a primit imaginea aleasă ca referință. Cele patru imagini arhitecturale au fost cerute individual, fără etichete, margini sau interfață și cu spațiu pentru decupare circulară. Fundalul a fost cerut fără etichete, noduri sau linii de graf.

Optimizarea WebP a păstrat raportul de aspect. Activele sunt ilustrații generate și nu trebuie prezentate ca fotografii, embleme instituționale sau hărți geografice oficiale.

Grafurile și legăturile sunt randate de React Flow. Pictogramele provin din Phosphor Icons. Nu s-au redesenat embleme oficiale în cod.
