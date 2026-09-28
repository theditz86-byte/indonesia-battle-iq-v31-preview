import { chromium } from "playwright"

const token = process.env.ALZAVA_E2E_TOKEN || ""
if (!token) throw new Error("ALZAVA_E2E_TOKEN is required for authenticated smoke")

const base = "http://localhost:4173"
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const pageErrors = []
page.on("pageerror", (error) => pageErrors.push(String(error)))

await page.goto(`${base}/battle/`, { waitUntil: "domcontentloaded" })
await page.evaluate((value) => localStorage.setItem("indonesia-battle-iq.participant-token.v1", value), token)

for (const route of ["/battle/", "/messages/", "/global-chat/", "/latihan-tiu/", "/pvp/"]) {
  const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 25000 })
  await page.waitForTimeout(700)
  if (!response || response.status() >= 400) throw new Error(`${route} HTTP ${response?.status()}`)
  const body = (await page.locator("body").innerText()).trim()
  if (body.length < 20) throw new Error(`${route} rendered empty`)
}

await page.goto(`${base}/battle-test/`, { waitUntil: "domcontentloaded", timeout: 25000 })
await page.waitForTimeout(1000)

const fairPlay = page.getByText("Saya memahami dan menyetujui Aturan Fair Play di atas.")
if (await fairPlay.count()) {
  await page.locator('input[type="checkbox"]').check()
  await page.getByRole("button", { name: /Mulai \/ Lanjutkan Ranked/i }).click()
  const prep = page.getByRole("button", { name: /Saya Siap · Mulai/i })
  if (await prep.count()) await prep.click()
}

await page.getByText(/20 soal · 20 menit/i).first().waitFor({ state: "visible", timeout: 20000 })
await page.getByText(/Soal \d+ \/ 20/i).first().waitFor({ state: "visible", timeout: 10000 })

const optionButtons = page.locator("article button").filter({ has: page.locator("span") })
if (await optionButtons.count()) await optionButtons.first().click()
await page.waitForTimeout(700)

if (pageErrors.length) throw new Error(`authenticated browser errors: ${pageErrors.join(" | ")}`)
await browser.close()
console.log("authenticated Ranked smoke ok")
