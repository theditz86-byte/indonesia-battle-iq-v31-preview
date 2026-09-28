import { chromium } from "playwright"

const token = process.env.ALZAVA_E2E_TOKEN || ""
const base = "http://localhost:4173"
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const pageErrors = []
page.on("pageerror", (error) => pageErrors.push(String(error)))

// This part always runs: Ranked must reject/redirect a browser without a participant session.
await page.goto(`${base}/battle-test/`, { waitUntil: "domcontentloaded", timeout: 25000 })
await page.waitForTimeout(700)
if (!page.url().includes("/account")) {
  throw new Error("Ranked auth guard failed: unauthenticated browser was not redirected to /account")
}

// A real QA token is deliberately optional because repository secrets are deployment configuration,
// not source. When configured, this section performs an actual authenticated Ranked start/resume.
if (token) {
  await page.goto(`${base}/battle/`, { waitUntil: "domcontentloaded" })
  await page.evaluate((value) => localStorage.setItem("indonesia-battle-iq.participant-token.v1", value), token)

  for (const route of ["/battle/", "/messages/", "/global-chat/", "/latihan-tiu/", "/pvp/"]) {
    const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 25000 })
    await page.waitForTimeout(500)
    if (!response || response.status() >= 400) throw new Error(`${route} HTTP ${response?.status()}`)
    const body = (await page.locator("body").innerText()).trim()
    if (body.length < 20) throw new Error(`${route} rendered empty`)
  }

  await page.goto(`${base}/battle-test/`, { waitUntil: "domcontentloaded", timeout: 25000 })
  await page.waitForTimeout(700)
  const fairPlay = page.getByText("Saya memahami dan menyetujui Aturan Fair Play di atas.")
  if (await fairPlay.count()) {
    await page.locator('input[type="checkbox"]').check()
    await page.getByRole("button", { name: /Mulai \/ Lanjutkan Ranked/i }).click()
    const prep = page.getByRole("button", { name: /Saya Siap · Mulai/i })
    if (await prep.count()) await prep.click()
  }
  await page.getByText(/20 soal · 20 menit/i).first().waitFor({ state: "visible", timeout: 20000 })
  await page.getByText(/Soal \d+ \/ 20/i).first().waitFor({ state: "visible", timeout: 10000 })
  const optionButtons = page.locator("article button")
  if (await optionButtons.count()) await optionButtons.first().click()
  console.log("authenticated Ranked smoke ok")
} else {
  console.log("Ranked auth guard smoke ok; full participant flow will run when ALZAVA_E2E_TOKEN is configured")
}

if (pageErrors.length) throw new Error(`browser errors: ${pageErrors.join(" | ")}`)
await browser.close()
