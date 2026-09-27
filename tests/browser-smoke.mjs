import { chromium } from "playwright"
import AxeBuilder from "@axe-core/playwright"

const base="http://127.0.0.1:4173"
const routes=["/battle/","/quick-battle/","/account/","/battle-test/","/pvp/","/help/"]
const browser=await chromium.launch({headless:true})
const context=await browser.newContext({viewport:{width:390,height:844}})
const page=await context.newPage()
const pageErrors=[]
const accessibility=[]
page.on("pageerror",e=>pageErrors.push(String(e)))
for(const route of routes){
  const r=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:20000})
  if(!r||r.status()>=400)throw new Error(`${route} HTTP ${r?.status()}`)
  const text=(await page.locator("body").innerText()).trim()
  if(text.length<20)throw new Error(`${route} rendered empty`)
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze()
  const severe=result.violations.filter(v=>v.impact==="serious"||v.impact==="critical")
  if(severe.length) accessibility.push(`${route}: ${severe.map(v=>`${v.id}(${v.nodes.length})`).join(", ")}`)
}
await context.close()
await browser.close()
if(pageErrors.length)throw new Error(`browser page errors: ${pageErrors.join(" | ")}`)
if(accessibility.length)throw new Error(`serious accessibility violations: ${accessibility.join(" | ")}`)
console.log(`smoke + accessibility ok: ${routes.length} routes`)
