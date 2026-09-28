import { chromium } from "playwright"
import AxeBuilder from "@axe-core/playwright"

const base="http://127.0.0.1:4173"
const routes=["/battle/","/quick-battle/","/account/","/pvp/","/help/","/latihan-skd/","/latihan-tiu/","/simulasi-tiu/","/global-chat/","/history-ranking/","/messages/"]
const viewports=[{width:390,height:844,name:"mobile"},{width:1440,height:1000,name:"desktop"}]
const browser=await chromium.launch({headless:true})
const pageErrors=[]
const accessibility=[]
for(const viewport of viewports){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}})
  const page=await context.newPage()
  page.on("pageerror",e=>pageErrors.push(`${viewport.name}: ${String(e)}`))
  for(const route of routes){
    const r=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:25000})
    if(!r||r.status()>=400)throw new Error(`${viewport.name} ${route} HTTP ${r?.status()}`)
    await page.waitForTimeout(120)
    const text=(await page.locator("body").innerText()).trim()
    if(text.length<20)throw new Error(`${viewport.name} ${route} rendered empty`)
    const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+4)
    if(horizontalOverflow)throw new Error(`${viewport.name} ${route} horizontal overflow`)
    const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze()
    const severe=result.violations.filter(v=>v.impact==="serious"||v.impact==="critical")
    if(severe.length)accessibility.push(`${viewport.name} ${route}: ${severe.map(v=>`${v.id}(${v.nodes.length})`).join(", ")}`)
  }
  await context.close()
}
await browser.close()
if(pageErrors.length)throw new Error(`browser page errors: ${pageErrors.join(" | ")}`)
if(accessibility.length)throw new Error(`serious accessibility violations: ${accessibility.join(" | ")}`)
console.log(`smoke + accessibility ok: ${routes.length} routes x ${viewports.length} viewports`)
