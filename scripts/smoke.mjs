/**
 * Smoke-Test: klickt echte Lektionen im Browser durch.
 *
 * Die Unit-Tests prüfen die Engine, dieser Test prüft, ob die App
 * bedienbar ist: rendert jeder Aufgabentyp, lässt sich jeder abschliessen,
 * überlebt der Fortschritt einen Reload.
 *
 *   npm run build && npm run preview   (in einem Terminal)
 *   node scripts/smoke.mjs             (in einem zweiten)
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'
const OUT = process.env.SHOT_DIR ?? 'smoke-shots'
const EXEC = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'

/** Netzwerk-Rauschen, das nichts über die App aussagt (z. B. Google Fonts in Sandboxes). */
const IGNORE = [/fonts\.googleapis/, /fonts\.gstatic/, /accounts\.google/, /favicon/]

const ALL_TYPES = [
  'Eine Antwort',
  'Mehrere Antworten',
  'Stimmt das?',
  'Setze die passenden Wörter ein',
  'Zuordnen',
  'In die richtige Reihenfolge',
  'Im Schema anklicken',
  'Schätzen',
  'Aus dem Kundengespräch',
  'Lesen · etwa 2 Minuten',
  'Zusammenfassen',
]

const SUMMARY_TEXT =
  'Wir optimieren kontinuierlich, weil sich Gebäude, Nutzung und Algorithmen verändern und es kein statisches Optimum gibt. ' +
  'Bei einem Gaskessel ist das Gebäude thermisch träge, deshalb wirkt das iterative Nachziehen der Heizkurve am Regler. ' +
  'Bei Sektorkopplung mit PV und Wärmepumpe braucht es Echtzeit. Ausserdem erkennt die laufende Überwachung Störungen früh, ' +
  'was Betriebskosten senkt. Grundlage ist die BetrKV mit laufenden statt einmaligen Kosten, das Wirtschaftlichkeitsgebot ' +
  'nach 556 BGB, die fortlaufende Leistung anders als beim hydraulischen Abgleich, und die ehrliche Einordnung ohne ' +
  'Grundsatzurteil mit Verweis auf Anwalt oder Vermieterverband.'

mkdirSync(OUT, { recursive: true })

const errors = []
const seenTypes = new Set()

const browser = await chromium.launch({ executablePath: EXEC })
const page = await browser.newPage({ viewport: { width: 414, height: 900 } })
page.on('console', (m) => {
  if (m.type() !== 'error') return
  const where = m.location()?.url ?? ''
  if (IGNORE.some((r) => r.test(where) || r.test(m.text()))) return
  errors.push(`console: ${m.text()} (${where || 'ohne Quelle'})`)
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e}`))
page.on('requestfailed', (r) => {
  if (!IGNORE.some((x) => x.test(r.url()))) errors.push(`request failed: ${r.url()}`)
})

/** Erzeugt eine gültige Eingabe für die gerade sichtbare Aufgabe. */
async function answer(page, hint) {
  const read = page.locator('button:has-text("Gelesen")')
  if (await read.count()) {
    await read.click()
    await page.waitForTimeout(120)
    // Die Lese-Aufgabe wechselt in die Schreibphase und zeigt dann ein
    // anderes Label — beide Phasen sollen erfasst werden.
    const after = await page.locator('.type-hint').first().textContent().catch(() => '')
    if (after?.trim()) seenTypes.add(after.trim())
  }

  if (await page.locator('textarea').count()) {
    await page.fill('textarea', SUMMARY_TEXT)
    return
  }
  if (await page.locator('.match-slot').count()) {
    // Zuordnen: erst Slot antippen, dann eine Antwort aus dem Vorrat.
    const slots = await page.locator('.match-slot').count()
    for (let i = 0; i < slots; i++) {
      await page.locator('.match-slot').nth(i).click()
      const tile = page.locator('.tile:not(.tile--used)').first()
      if (await tile.count()) await tile.click()
      await page.waitForTimeout(50)
    }
    return
  }
  if (await page.locator('.tile').count()) {
    // Lückentext: Kacheln setzen, bis "Prüfen" frei ist.
    for (let n = 0; n < 8; n++) {
      const tile = page.locator('.tile:not(.tile--used)').first()
      if (!(await tile.count()) || (await tile.isDisabled())) break
      await tile.click()
      await page.waitForTimeout(50)
      if (!(await page.locator('button:has-text("Prüfen")').isDisabled())) break
    }
    return
  }
  if (await page.locator('.order-move').count()) {
    // Reihenfolge: die Liste ist schon gefüllt, eine Bewegung testet nur die
    // Bedienung. Der erste Pfeil nach oben ist bewusst gesperrt.
    const move = page.locator('.order-move:not([disabled])').first()
    if (await move.count()) await move.click()
    return
  }
  if (await page.locator('.option').count()) {
    await page.locator('.option').first().click()
    return
  }
  if (await page.locator('.hot').count()) {
    await page.locator('.hot').first().click()
    return
  }
  if (await page.locator('input[type=range]').count()) {
    const el = page.locator('input[type=range]')
    const min = Number(await el.getAttribute('min'))
    const max = Number(await el.getAttribute('max'))
    const step = Number(await el.getAttribute('step')) || 1
    // Mitte der Skala, auf einen gültigen Schritt gerundet.
    const mid = min + Math.round((max - min) / 2 / step) * step
    await el.fill(String(mid))
    return
  }
  errors.push(`Keine bekannte Eingabe für Aufgabentyp "${hint}"`)
}

/** Klickt eine Lektion vollständig durch. */
async function playLesson(page, label) {
  await page.waitForSelector('button:has-text("Prüfen"), button:has-text("Gelesen")')
  for (let step = 0; step < 40; step++) {
    const hint = (await page.locator('.type-hint').first().textContent().catch(() => '')) ?? ''
    if (hint.trim()) seenTypes.add(hint.trim())

    await answer(page, hint.trim())

    const check = page.locator('button:has-text("Prüfen")')
    if (await check.count()) {
      if (await check.isDisabled()) {
        errors.push(`"Prüfen" bleibt gesperrt bei Aufgabentyp "${hint.trim()}" (${label})`)
        return false
      }
      await check.click()
    }

    await page.waitForSelector('.feedback', { timeout: 8000 })
    // Jede Rückmeldung muss eine Erklärung und eine Quelle zeigen.
    if (!(await page.locator('.feedback-why').count())) errors.push(`Keine Erklärung sichtbar (${label})`)
    if (!(await page.locator('.feedback-source').count())) errors.push(`Keine Quelle sichtbar (${label})`)

    await page.locator('.feedback button').click()
    await page.waitForTimeout(150)

    if (await page.locator('[data-testid="lesson-done"]').count()) return true
  }
  errors.push(`Lektion "${label}" endete nicht innerhalb von 40 Schritten`)
  return false
}

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('text=Heizungsheld')
await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true })

// Je Kurs eine Lektion, bis alle Aufgabentypen mindestens einmal dran waren.
const plan = [
  ['technik', 'technik-1'],
  ['technik', 'technik-2'],
  ['produkt', 'produkt-1'],
  ['produkt', 'produkt-4'],
  ['vertrieb', 'vertrieb-4'],
  ['recht', 'recht-1'],
]

for (const [course, unit] of plan) {
  await page.click(`[data-testid="course-${course}"]`)
  await page.waitForSelector(`[data-testid="unit-${unit}"]`)
  if (unit === 'technik-1') await page.screenshot({ path: `${OUT}/02-path.png`, fullPage: true })
  await page.click(`[data-testid="unit-${unit}"]`)
  const ok = await playLesson(page, unit)
  if (!ok) break
  await page.waitForSelector('[data-testid="lesson-done"]')
  await page.screenshot({ path: `${OUT}/03-${unit}-done.png`, fullPage: true })
  await page.click('[data-testid="lesson-home"]')
  await page.waitForSelector('[data-testid="start-daily"]')
}

const xpBefore = await page.locator('.pill--xp').textContent()
await page.screenshot({ path: `${OUT}/04-home-after.png`, fullPage: true })

// Liga: alle drei Wertungen müssen rendern und die eigene Zeile enthalten.
await page.click('[data-testid="open-liga"]')
await page.waitForSelector('.board-row')
for (const tab of ['Punkte', 'Serie', 'Teams']) {
  await page.click(`.tab:has-text("${tab}")`)
  await page.waitForTimeout(150)
  const rows = await page.locator('.board-row').count()
  if (rows === 0) errors.push(`Liga-Wertung "${tab}" zeigt keine Zeile`)
  await page.screenshot({ path: `${OUT}/05-liga-${tab.toLowerCase()}.png`, fullPage: true })
}
await page.click('.tab:has-text("Punkte")')
await page.waitForTimeout(150)
if (!(await page.locator('.board-row--me').count())) {
  errors.push('Liga zeigt die eigene Zeile nicht')
}
await page.click('[data-testid="back-home"]')
await page.waitForSelector('[data-testid="start-daily"]')

// Wiederholung muss auftauchen, sobald Items fällig sind – oder korrekt fehlen.
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.pill--xp')
const xpAfter = await page.locator('.pill--xp').textContent()
if (xpBefore !== xpAfter) errors.push(`Fortschritt nach Reload verloren: ${xpBefore} → ${xpAfter}`)

const missing = ALL_TYPES.filter((t) => !seenTypes.has(t))
if (missing.length) errors.push(`Nie gerendert: ${missing.join(', ')}`)

await browser.close()

console.log(`Aufgabentypen geprüft (${seenTypes.size}/${ALL_TYPES.length}): ${[...seenTypes].join(' | ')}`)
console.log(`XP: ${xpBefore} (nach Reload ${xpAfter})`)
console.log(`Screenshots: ${OUT}/`)

if (errors.length) {
  console.error('\nFEHLER:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('\nSmoke-Test bestanden.')
