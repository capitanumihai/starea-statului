# Publicarea pe GitHub

Data: 17 octombrie 2026

Utilizatorul a cerut publicarea proiectului pe Git, în continuarea deciziei de a oferi acces gratuit și cod open source.

## Depozit

- Adresă: https://github.com/capitanumihai/starea-statului
- Vizibilitate: public
- Ramură principală: main
- Remote local: origin prin HTTPS
- Licență: AGPL-3.0-only

## Conținut

Sunt publicate interfața React, colectorul Node, catalogul de 140 de instituții și servicii, testele, documentația și activele vizuale cu proveniență documentată. Fișierul .env.example conține numai exemple de configurare.

Baza locală de măsurători, fișierele .env private, node_modules, buildurile, capturile locale de verificare și arhiva ZIP generată sunt excluse prin .gitignore. Arhiva surselor se generează la build și poate fi descărcată din aplicația rulată.

## Verificări

Fișierele candidate au fost inventariate înainte de publicare. Scanarea textelor nu a identificat credențiale sau căi personale locale. Excluderile bazei SQLite, configurației private, dependențelor și buildului au fost verificate prin Git.

Buildul complet a trecut înaintea publicării, împreună cu cele 14 teste de domeniu și cele 4 teste ale runtime-ului de publicare. Fișierul .gitattributes păstrează terminatorii de linie LF pentru surse și tratează imaginile ca fișiere binare.

Pentru modificările viitoare, actualizează documentația și rulează verificările potrivite înainte de commit. Dovezile detaliate sunt în docs/PROJECT-STATE.md.

## Lucru ulterior

Clonare:

    git clone https://github.com/capitanumihai/starea-statului.git
    cd starea-statului

Publicarea modificărilor autorizate, după verificare:

    git add .
    git commit -m "Descrierea modificării"
    git push origin main

## Găzduire

GitHub găzduiește sursele. Aplicația și colectorul rulează încă local. Pentru serviciul public sunt necesare domeniul, un proces Node permanent și persistența bazei SQLite. Un site static singur poate afișa interfața, dar măsurătorile reale au nevoie de API și colector.
