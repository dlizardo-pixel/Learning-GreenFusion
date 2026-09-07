/**
 * Smoke-Test: klickt echte Lektionen im Browser durch.
 *
 * Die Unit-Tests prüfen die Engine, dieser Test prüft, ob die App
 * bedienbar ist: rendert jeder Aufgabentyp, lässt sich jeder abschliessen,
 * überlebt der Fortschritt einen Reload.
 *
 *   npm run build && npm run smoke
 *
 * Läuft schon eine Vorschau auf BASE_URL, wird sie benutzt; sonst startet
 * dieses Skript selbst eine und beendet sie am Ende wieder. Damit ist der
 * Aufruf in der CI derselbe wie auf dem eigenen Rechner.
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'
const OUT = process.env.SHOT_DIR ?? 'smoke-shots'

/**
 * In dieser Sandbox liegt Chromium an einem festen Ort, in der CI bringt
 * Playwright seinen eigenen mit. Deshalb wird der Pfad nur gesetzt, wenn
 * dort auch wirklich etwas liegt — sonst sucht Playwright selbst.
 */
const EXEC = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'
const launchOptions = existsSync(EXEC) ? { executablePath: EXEC } : {}

/** Wartet, bis die Vorschau antwortet. Gibt false zurück, wenn sie es nicht tut. */
async function reachable(url, tries = 1) {
  for (let i = 0; i < tries; i++) {
    try {
      await fetch(url)
      return true
    } catch {
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 500))
    }
  }
  return false
}

let preview

/**
 * Beendet die selbst gestartete Vorschau.
 *
 * `detached` plus negative PID beendet die ganze Prozessgruppe: npx startet
 * vite als Kindprozess, und ein Signal nur an npx lässt vite weiterlaufen —
 * in der CI wäre der Job damit nie fertig.
 */
function stopPreview() {
  if (!preview) return
  try {
    process.kill(-preview.pid)
  } catch {
    // Schon beendet – nichts zu tun.
  }
  preview = undefined
}

if (await reachable(BASE)) {
  console.log(`Vorschau läuft bereits auf ${BASE}`)
} else {
  const port = new URL(BASE).port || '4173'
  console.log(`Starte Vorschau auf Port ${port} …`)
  preview = spawn('npx', ['vite', 'preview', '--port', port], {
    stdio: 'ignore',
    detached: true,
  })
  if (!(await reachable(BASE, 40))) {
    stopPreview()
    console.error(`Vorschau kam auf ${BASE} nicht hoch. Erst "npm run build" laufen lassen?`)
    process.exit(1)
  }
}

// Auch bei Abbruch oder unerwartetem Fehler aufräumen.
process.on('exit', stopPreview)
process.on('SIGINT', () => process.exit(130))

/** Netzwerk-Rauschen, das nichts über die App aussagt (z. B. Google Fonts in Sandboxes). */
const IGNORE = [/fonts\.googleapis/, /fonts\.gstatic/, /accounts\.google/, /favicon/]

const ALL_TYPES = [
  'Eine Antwort',
  'Einsortieren',
  'Karte beurteilen',
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
/** Labels, die nur in bestimmten Phasen auftauchen und nicht erzwungen werden. */
const OPTIONAL_TYPES = ['Gesprächssimulation', 'Auswertung']

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

const browser = await chromium.launch(launchOptions)
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
  if (await page.locator('.dialogue-says, .dialogue-reaction').count()) {
    // Gesprächssimulation: Zug für Zug antworten, bis alle Züge durch sind.
    for (let turn = 0; turn < 12; turn++) {
      const weiter = page.locator(
        'button:has-text("Weiter im Gespräch"), button:has-text("Gespräch beenden")',
      )
      if (await weiter.count()) {
        await weiter.click()
        await page.waitForTimeout(80)
        continue
      }
      const opt = page.locator('.option')
      if (!(await opt.count())) break
      await opt.first().click()
      await page.waitForTimeout(80)
    }
    return
  }
  if (await page.locator('.bucket-head').count()) {
    // Einsortieren: Begriff antippen, dann Korb antippen.
    for (let n = 0; n < 14; n++) {
      const tile = page.locator('.tiles .tile:not(.tile--used)').first()
      if (!(await tile.count())) break
      await tile.click()
      const bucket = page.locator('.bucket-head:not([disabled])').first()
      if (!(await bucket.count())) break
      await bucket.click()
      await page.waitForTimeout(40)
    }
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
  ['m1-grundlagen', 'm1-u1'],
  ['m1-grundlagen', 'm1-u3'],
  ['m2-regelung', 'm2-u1'],
  ['m2-regelung', 'm2-u7'],
  ['m3-produkt', 'm3-u5'],
  ['m4-recht', 'm4-u6'],
  ['m5-markt', 'm5-u3'],
  ['m8-praxis', 'm8-u1'],
  // Modul 9 mitspielen, damit das neue Modul auch im Browser geprüft wird.
  ['m9-wohnungswirtschaft', 'm9-u3'],
]

for (const [mod, unit] of plan) {
  await page.click(`[data-testid="module-${mod}"]`)
  await page.waitForSelector(`[data-testid="unit-${unit}"]`)
  if (unit === 'm1-u1') await page.screenshot({ path: `${OUT}/02-modulpfad.png`, fullPage: true })
  await page.click(`[data-testid="unit-${unit}"]`)
  const ok = await playLesson(page, unit)
  if (!ok) break
  await page.waitForSelector('[data-testid="lesson-done"]')
  await page.screenshot({ path: `${OUT}/03-${unit}-done.png`, fullPage: true })
  await page.click('[data-testid="lesson-home"]')
  await page.waitForSelector('[data-testid="start-daily"]')
}

// Modulprüfung vollständig durchspielen: keine Auflösung zwischendurch.
await page.click('[data-testid="module-m5-markt"]')
await page.waitForSelector('[data-testid="start-exam-m5-markt"]')
await page.screenshot({ path: `${OUT}/06-modulpruefung-karte.png`, fullPage: true })
await page.click('[data-testid="start-exam-m5-markt"]')
await page.waitForSelector('button:has-text("Antwort abgeben")')
for (let step = 0; step < 30; step++) {
  const hint = ((await page.locator('.type-hint').first().textContent().catch(() => '')) ?? '').trim()
  if (hint) seenTypes.add(hint)
  if (await page.locator('.feedback').count()) {
    errors.push('Prüfung zeigt eine Auflösung zwischendurch')
    break
  }
  await answer(page, hint)
  const submit = page.locator('button:has-text("Antwort abgeben"), button:has-text("Abgeben und auswerten")')
  if (!(await submit.count())) break
  if (await submit.isDisabled()) {
    errors.push(`Prüfung: Abgeben gesperrt bei Aufgabentyp "${hint}"`)
    break
  }
  await submit.click()
  await page.waitForTimeout(160)
  if (await page.locator('[data-testid="exam-done"]').count()) break
}
if (!(await page.locator('[data-testid="exam-done"]').count())) {
  errors.push('Modulprüfung endete nicht innerhalb von 30 Schritten')
} else {
  await page.screenshot({ path: `${OUT}/07-pruefungsergebnis.png`, fullPage: true })
  await page.click('[data-testid="exam-done"]')
  await page.waitForSelector('[data-testid="start-exam-m5-markt"]')
  await page.click('[data-testid="back-home"]')
  await page.waitForSelector('[data-testid="start-daily"]')
}

// Zertifikatsübersicht
await page.click('[data-testid="open-certificate"]')
await page.waitForSelector('text=Modulprüfungen')
await page.screenshot({ path: `${OUT}/08-zertifikat.png`, fullPage: true })
if (await page.locator('[data-testid="start-final"]').count()) {
  errors.push('Abschlussprüfung ist offen, obwohl nicht alle Module bestanden sind')
}
await page.click('[data-testid="back-home"]')
await page.waitForSelector('[data-testid="start-daily"]')

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

const missing = ALL_TYPES.filter((t) => !seenTypes.has(t) && !OPTIONAL_TYPES.includes(t))
if (missing.length) errors.push(`Nie gerendert: ${missing.join(', ')}`)

// ── Grosse Bildschirme ──────────────────────────────────────────────
//
// Der Test oben läuft auf Handybreite. Das Layout für den Rechner ist
// aber eine eigene Sache, und "sieht gut aus" lässt sich nicht klicken.
// Prüfbar ist die eine Eigenschaft, an der alles hängt: liegen die
// Modulkarten am Rechner nebeneinander und auf dem Handy untereinander?
/**
 * Zwei Positionen vergleichen, aber in *einem* Layout-Durchgang.
 *
 * Die App lädt ihre Schrift von Google Fonts mit `display: swap`. Kommt
 * sie an, fliesst der Text neu um und alles darunter verschiebt sich.
 * Zwei getrennte boundingBox-Aufrufe können deshalb zwei verschiedene
 * Zustände messen — genau daran ist dieser Test einmal gescheitert
 * (18 px Differenz, weil die Schrift zwischen den Messungen eintraf).
 * Lokal fällt das nicht auf, weil der Egress-Proxy Google Fonts
 * blockiert und die Schrift nie ankommt.
 *
 * Deshalb: erst auf die Schriften warten, dann beide Rechtecke in einem
 * einzigen evaluate lesen.
 */
async function twoRows(p, idA, idB) {
  await p.evaluate(() => document.fonts.ready.then(() => true))
  return p.evaluate(([a, b]) => {
    const y = (id) => document.querySelector(`[data-testid="module-${id}"]`).getBoundingClientRect().y
    return [y(a), y(b)]
  }, [idA, idB])
}

const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await wide.goto(BASE, { waitUntil: 'domcontentloaded' })
await wide.waitForSelector('[data-testid="module-m1-grundlagen"]')

const [y1, y2] = await twoRows(wide, 'm1-grundlagen', 'm2-regelung')
if (Math.abs(y1 - y2) > 1) {
  errors.push(`Am Rechner stehen die Modulkarten nicht nebeneinander (y ${y1} vs ${y2})`)
}

// Und die Lektion muss ihre bequeme Zeilenlänge behalten, statt sich
// über die ganze Breite zu ziehen.
await wide.click('[data-testid="module-m1-grundlagen"]')
await wide.waitForSelector('[data-testid="unit-m1-u1"]')
await wide.click('[data-testid="unit-m1-u1"]')
await wide.waitForSelector('.prompt')
await wide.evaluate(() => document.fonts.ready.then(() => true))
const promptWidth = (await wide.locator('.prompt').boundingBox()).width
if (promptWidth > 800) {
  errors.push(`Aufgabentext am Rechner zu breit: ${Math.round(promptWidth)} px (erwartet unter 800)`)
}
await wide.screenshot({ path: `${OUT}/09-rechner-lektion.png` })
await wide.close()

// Gegenprobe auf Handybreite: dort müssen sie untereinander stehen.
const narrow = await browser.newPage({ viewport: { width: 414, height: 900 } })
await narrow.goto(BASE, { waitUntil: 'domcontentloaded' })
await narrow.waitForSelector('[data-testid="module-m1-grundlagen"]')
const [n1, n2] = await twoRows(narrow, 'm1-grundlagen', 'm2-regelung')
if (Math.abs(n1 - n2) < 20) {
  errors.push(`Auf Handybreite stehen die Modulkarten nebeneinander (y ${n1} vs ${n2})`)
}
await narrow.close()
console.log(`Layout: Rechner nebeneinander (y ${Math.round(y1)}), Handy untereinander (y ${Math.round(n1)}/${Math.round(n2)}), Aufgabentext ${Math.round(promptWidth)} px`)

await browser.close()
stopPreview()

console.log(`Aufgabentypen geprüft (${seenTypes.size}/${ALL_TYPES.length}): ${[...seenTypes].join(' | ')}`)
console.log(`XP: ${xpBefore} (nach Reload ${xpAfter})`)
console.log(`Screenshots: ${OUT}/`)

if (errors.length) {
  console.error('\nFEHLER:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log('\nSmoke-Test bestanden.')
