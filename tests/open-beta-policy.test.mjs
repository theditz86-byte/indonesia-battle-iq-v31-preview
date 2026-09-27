import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
const read=(p)=>fs.readFileSync(p,"utf8")

test("Ranked uses dedicated native-20 start backend only",()=>{
  const s=read("app/battle-test/page.tsx")
  assert.match(s,/battle-ranked-start/)
  assert.match(s,/20 soal/)
  assert.equal(s.includes('callBattle({ action: "start" }, rawToken)'),false)
  assert.doesNotMatch(s,/Rp5\.000|Buka Rematch|Kredit Rematch/)
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

test("SKD metadata does not overclaim TWK and TKP availability",()=>{
  const s=read("app/latihan-skd/page.tsx")
  assert.match(s,/Bagian dari Persiapan SKD/)
  assert.match(s,/TWK dan TKP belum menjadi fokus versi ini/)
})

test("completed one-off source mutating workflows stay removed",()=>{
  for(const p of [
    ".github/workflows/apply-result-share-card.yml",
    ".github/workflows/apply-admin-battle-point-source.yml",
    ".github/workflows/rebrand-admin-mobile-battle-point.yml",
    "scripts/apply-result-share-card.py",
  ]) assert.equal(fs.existsSync(p),false,`${p} must not return`)
})

test("set-question generation contract always has non-negative remainder",()=>{
  for(let total=45;total<=60;total++){
    for(let a=20;a<=28;a++){
      for(let b=18;b<=26;b++){
        const minBoth=Math.max(6,a+b-total)
        const maxBoth=Math.min(a,b)-3
        if(minBoth>maxBoth) continue
        for(let both=minBoth;both<=maxBoth;both++){
          const neither=total-(a+b-both)
          assert.ok(neither>=0,`invalid set: total=${total}, a=${a}, b=${b}, both=${both}`)
          assert.ok(both<=a&&both<=b)
        }
      }
    }
  }
})


test("Ranked gives 3 anytime attempts without weekday gating",()=>{
  const ranked=read("app/battle-test/page.tsx")
  const hero=read("components/hero.tsx")
  assert.match(ranked,/3 Ranked Battle resmi gratis/)
  assert.match(ranked,/boleh dipakai kapan saja/)
  assert.doesNotMatch(ranked,/Senin, Rabu, dan Jumat/)
  assert.doesNotMatch(hero,/Ranked dibuka Senin/)
})

test("Open Beta public copy does not sell paid Ranked or Premium",()=>{
  for(const p of ["app/help/page.tsx","app/terms/page.tsx","app/refund/page.tsx","components/site-footer.tsx"]) {
    const s=read(p)
    assert.doesNotMatch(s,/Rp5\.000/)
  }
  const result=read("app/result/page.tsx")
  assert.doesNotMatch(result,/Buka Premium Hasil Ini · Rp5\.000/)
  assert.match(result,/Premium sementara tidak dijual/)
})

test("TIU practice requires the shared participant token instead of a second login",()=>{
  const s=read("components/tiu-practice.tsx")
  assert.match(s,/getParticipantToken/)
  assert.match(s,/X-Battle-Token/)
})


test("Account and result history follow 3 official Ranked Open Beta policy",()=>{
  for(const p of ["app/account/page.tsx","app/account/results/page.tsx"]){
    const s=read(p)
    assert.doesNotMatch(s,/Buka Rematch|Kredit Rematch|Rematch \/ Practice|Rp5\.000/)
    assert.match(s,/3 Ranked|3x|3 kesempatan/)
  }
})

test("Participant logout reaches server session endpoint",()=>{
  const s=read("components/site-navbar.tsx")
  assert.match(s,/battle-participant-session/)
  assert.match(s,/action:"logout"|action: "logout"/)
})

test("Quick Battle is indexed and homepage branding leads with Battle Point",()=>{
  assert.match(read("public/sitemap.xml"),/quick-battle/)
  assert.match(read("app/layout.tsx"),/Competitive Brain Game Indonesia/)
})


test("Account copy never regresses to one free Ranked attempt",()=>{
  const s=read("app/account/page.tsx")
  assert.doesNotMatch(s,/1x percobaan gratis per season/)
  assert.match(s,/3x Ranked Battle resmi gratis per season/)
})
