import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
const read=(p)=>fs.readFileSync(p,"utf8")

test("Ranked uses dedicated native-20 start backend",()=>{
  const s=read("app/battle-test/page.tsx")
  assert.match(s,/battle-ranked-start/)
  assert.equal(s.includes('callBattle({ action: "start" }, rawToken)'),false)
})

test("Open Beta participant payment page has no QRIS purchase flow",()=>{
  const s=read("app/payment/page.tsx")
  assert.match(s,/Open Beta Gratis/)
  assert.match(s,/Pembayaran sementara dinonaktifkan/)
  assert.doesNotMatch(s,/qris-alzava|Kirim Bukti|Rp5\.000/)
})

test("TIU exposes figural and local resume",()=>{
  const s=read("components/tiu-practice.tsx")
  assert.match(s,/\| "figural"/)
  assert.match(s,/alzava\.tiu\.progress/)
})

test("Growth tracker covers SKD and TIU funnel",()=>{
  const s=read("components/growth-tracker.tsx")
  for(const event of ["page_latihan_skd","page_latihan_tiu","page_simulasi_tiu","click_latihan_skd","click_latihan_tiu","click_simulasi_tiu"]) assert.match(s,new RegExp(event))
})
