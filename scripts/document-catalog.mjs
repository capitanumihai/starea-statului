import { writeFileSync } from 'node:fs'
import { institutions, categories } from '../packages/catalog/institutions.mjs'
const lines = ['# Catalogul central', '', 'Snapshot de proiect: 17 octombrie 2026', '', 'Catalogul conține ' + institutions.length + ' instituții și servicii naționale. Sunt excluse instituțiile locale și directoarele pe județe. Grupurile sunt pentru navigare, nu o organigramă juridică.', '', 'Acoperirea este o selecție extensibilă a instituțiilor centrale importante. Nu se pretinde existența unui registru legal exhaustiv. Adresele publice sunt verificate de colector, iar lipsa unei probe valide nu dovedește indisponibilitatea instituției.', '', 'Catalogul oficial ADR a fost importat separat în data/reference/adr-institutions.json, cu 568 de înregistrări și proveniență. Este o sursă de cercetare care necesită revizuire, nu sursa automată a tuturor nodurilor publice.', '']
for (const category of categories) {
  const rows = institutions.filter((i) => i.category === category.id)
  lines.push('## ' + category.name + ' · ' + rows.length, '', '| ID | Instituție sau serviciu | Site public |', '| :--- | :--- | :--- |')
  for (const item of rows) lines.push('| ' + item.id + ' | ' + item.name.replaceAll('|', '/') + ' | ' + item.url + ' |')
  lines.push('')
}
writeFileSync(new URL('../docs/CATALOG.md', import.meta.url), lines.join('\n'))
console.log('Documentat catalogul: ' + institutions.length + ' înregistrări')
