import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const out = join(process.cwd(), "public")
await mkdir(out, { recursive: true })
await mkdir(join(out, "assets"), { recursive: true })

const origins = [
  "https://indonesia-battle-iq-v30-backup.netlify.app",
  "https://indonesia-battle-iq.netlify.app",
]

async function fetchStable(path, binary = false) {
  let lastError
  for (const origin of origins) {
    try {
      const response = await fetch(origin + "/" + path, { redirect: "follow" })
      if (!response.ok) throw new Error(origin + " " + response.status)
      return binary ? Buffer.from(await response.arrayBuffer()) : await response.text()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error("stable source unavailable: " + path)
}

const accountCss = String.raw`
*{box-sizing:border-box}html{min-height:100%;background:#020817;color:#f8fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color-scheme:dark}body{margin:0;min-height:100vh;background:radial-gradient(circle at 15% 0%,rgba(55,115,255,.20),transparent 34rem),radial-gradient(circle at 90% 15%,rgba(42,210,255,.10),transparent 28rem),linear-gradient(180deg,#020817 0%,#07142f 46%,#050d20 100%);color:#f8fbff}[hidden]{display:none!important}a{color:inherit}.topbar{position:sticky;top:0;z-index:20;max-width:none;margin:0;padding:14px max(24px,calc((100vw - 1180px)/2));border-bottom:1px solid rgba(148,163,184,.16);display:flex;align-items:center;justify-content:space-between;gap:16px;background:rgba(3,11,31,.82);backdrop-filter:blur(18px)}.brand{display:flex;align-items:center;gap:11px;text-decoration:none;font-weight:900;letter-spacing:-.02em}.brand img{width:38px;height:38px;object-fit:contain;border-radius:11px}.brand i{color:#67d4ff;font-style:normal}.back{font-weight:750;color:#b7c5dc;text-decoration:none;padding:9px 13px;border:1px solid rgba(148,163,184,.18);border-radius:12px;background:rgba(255,255,255,.04)}.back:hover{color:white;border-color:rgba(103,212,255,.4);background:rgba(103,212,255,.08)}.shell{max-width:980px;margin:0 auto;padding:42px 24px 64px}.hero{margin-bottom:24px}.eyebrow{font:850 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:#65d6ff}.hero h1{font-size:clamp(34px,6vw,60px);line-height:.98;letter-spacing:-.05em;margin:11px 0 13px;background:linear-gradient(90deg,#fff 0%,#dfeaff 46%,#8ecbff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.hero p{max-width:760px;color:#aab9d0;line-height:1.7}.card{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(14,34,71,.88),rgba(8,23,52,.88));border:1px solid rgba(120,157,216,.20);border-radius:24px;padding:25px;box-shadow:0 22px 70px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.04);margin-bottom:18px;backdrop-filter:blur(16px)}.card:before{content:"";position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,transparent,rgba(103,212,255,.55),rgba(126,94,255,.45),transparent);pointer-events:none}.grid{display:grid;gap:16px}.two{grid-template-columns:1fr 1fr}.qris-card{text-align:center}.price{font-size:44px;font-weight:950;letter-spacing:-.04em;margin:8px 0;color:#fff}.qris{display:block;width:min(390px,100%);margin:18px auto 12px;border-radius:18px;border:10px solid #fff;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.3)}.merchant{font-weight:850}.muted{color:#9fb0c9}.note{font-size:13px;line-height:1.6}.field{display:grid;gap:7px}.field span{font-weight:800;font-size:13px;color:#e8f1ff}.field input,.field select,.field textarea{width:100%;border:1px solid rgba(137,165,211,.26);border-radius:13px;background:#07152f;padding:12px 14px;font:inherit;color:#f8fbff;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}.field input::placeholder,.field textarea::placeholder{color:#657795}.field input:focus,.field select:focus,.field textarea:focus{outline:3px solid rgba(84,199,255,.13);border-color:#54c7ff;background:#091a38}.actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.button{border:0;border-radius:12px;padding:12px 16px;font-weight:850;font:inherit;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:.18s ease}.button:hover{transform:translateY(-1px)}.primary{background:linear-gradient(135deg,#5652ff,#7b3cf4);color:#fff;box-shadow:0 10px 28px rgba(91,80,245,.35)}.secondary{background:#102343;color:#d9e5f7;border:1px solid rgba(148,163,184,.18)}.success{background:#07966a;color:#fff}.danger{background:#e5484d;color:#fff}.button:disabled{opacity:.55;cursor:not-allowed;transform:none}.status{padding:13px 14px;border-radius:12px;background:#0d213f;border:1px solid rgba(148,163,184,.18);line-height:1.55;color:#dce8f8}.status.good{background:rgba(5,150,105,.13);border-color:rgba(52,211,153,.32);color:#b9f4dc}.status.bad{background:rgba(225,72,77,.12);border-color:rgba(251,113,133,.28);color:#ffd3d8}.identity{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:#091a37}.identity strong{display:block}.identity small{color:#8fa1bb}.admin-tools{display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap}.payment-item{border:1px solid rgba(148,163,184,.18);border-radius:16px;padding:16px;margin:12px 0;background:#07172f}.payment-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.pill{display:inline-flex;padding:5px 9px;border-radius:999px;background:rgba(91,80,245,.18);color:#c8c4ff;font-size:12px;font-weight:800;text-transform:uppercase}.proof{display:block;max-width:100%;max-height:560px;margin-top:12px;border-radius:14px;border:1px solid rgba(148,163,184,.18)}.login-card{max-width:640px;margin:30px auto}.footer{text-align:center;color:#7386a4;font-size:12px;margin-top:28px}.footer a{font-weight:700}.spinner{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.topbar .actions{display:flex}.profile-head{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center}.avatar-lg{width:92px;height:92px;border-radius:50%;object-fit:cover;border:4px solid #0d234b;box-shadow:0 0 0 2px rgba(84,199,255,.48),0 12px 34px rgba(0,0,0,.35);background:#0d234b}.avatar-fallback{display:grid;place-items:center;font-size:28px;font-weight:950;color:#dff6ff;background:linear-gradient(145deg,#18427b,#11163f)}.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metric{border:1px solid rgba(148,163,184,.16);border-radius:15px;padding:15px;background:linear-gradient(180deg,#0c2141,#091830)}.metric span{display:block;color:#91a5c2;font-size:12px}.metric strong{display:block;margin-top:4px;font-size:21px;color:#fff}.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}.tabs{display:flex;gap:8px;margin-bottom:18px}.tab{background:#102343;color:#cbd8eb;border:1px solid rgba(148,163,184,.14)}.tab.active{background:linear-gradient(135deg,#5652ff,#7b3cf4);color:#fff}.account-note{border-left:4px solid #54c7ff;padding:12px 14px;background:rgba(84,199,255,.08);border-radius:10px;color:#cbdcf0}.avatar-input-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.profile-actions{display:flex;gap:10px;flex-wrap:wrap}input[type=file]{color:#a8b8ce}input[type=checkbox]{accent-color:#665cf6}h2{color:#f8fbff}hr{border-color:rgba(148,163,184,.15)}@media(max-width:720px){.two{grid-template-columns:1fr}.shell{padding:28px 14px 50px}.topbar{padding:12px 14px}.card{padding:18px}.hero h1{font-size:40px}.button{width:100%}.actions{display:grid;grid-template-columns:1fr;width:100%}.profile-head{grid-template-columns:1fr;text-align:center}.profile-head .avatar-lg{margin:auto}.metric-grid,.split{grid-template-columns:1fr}.topbar .actions{display:flex;gap:10px}.topbar .actions .back{font-size:13px;width:auto}}
`

const testDark = String.raw`
/* v31 dark premium skin */
.battle-test-topbar{background:rgba(2,8,23,.90)!important;border-bottom-color:#1d3154!important;backdrop-filter:blur(16px)}
body{background:radial-gradient(circle at 15% 0%,rgba(43,91,218,.18),transparent 30rem),linear-gradient(180deg,#020817 0%,#07142f 100%)!important;color:#f8fbff!important}
.test-state-card,.review-card,.battle-result,.attempt-ticket,.question-card{background:linear-gradient(180deg,#0b1d3b,#07162e)!important;border-color:#203a61!important;box-shadow:0 24px 70px rgba(0,0,0,.3)!important;color:#f8fbff!important}
.test-state-card>p,.test-lobby>div>p,.attempt-ticket ul,.question-card>p,.review-domains span,.result-score span,.result-score small,.result-facts span,.locked-card p{color:#9fb1ca!important}
.test-clock{background:#0b1d3b!important;border-color:#203a61!important}.test-clock span{color:#9fb1ca!important}.test-progress{background:#102342!important}
.test-option{background:#0a1a35!important;color:#eff6ff!important;border-color:#29446f!important}.test-option:hover{border-color:#6d72ff!important;background:#0d2345!important}.test-option.is-selected{background:#1b2054!important;border-color:#7673ff!important}.test-option span{background:#12284a!important;color:#cbd8eb!important}.test-option.is-selected span{background:#665cf6!important;color:#fff!important}
.memory-stage{background:linear-gradient(135deg,#0f2042,#0b2c3d)!important;border-color:#244469!important}.memory-stage p{color:#a6b7cd!important}.review-domains div,.result-facts div{background:#102342!important}.result-score{border-color:#1a2c4d!important;border-top-color:#665cf6!important;border-right-color:#21c7bb!important}.locked-card{background:#081a35!important;border-color:#203a61!important}.battle-brand,.back-link{color:#f8fbff!important}.back-link:hover{background:#102343!important;color:#fff!important}
`


const testPolish = String.raw`
/* v32 battle-test visual polish */
.battle-test-shell{width:min(100% - 2rem,1120px)!important;padding-top:2.4rem!important}
.test-lobby{min-height:510px!important;grid-template-columns:minmax(0,1.35fr) minmax(340px,.65fr)!important;gap:3rem!important}
.test-lobby h1{max-width:650px!important;margin:.55rem 0 1rem!important;font-size:clamp(3.4rem,6.5vw,5.35rem)!important;line-height:.92!important;letter-spacing:-.065em!important;color:#f8fbff!important;text-shadow:0 10px 35px rgba(0,0,0,.28)!important}
.test-lobby>div>p{max-width:690px!important;color:#b8c8de!important;font-size:1.08rem!important;line-height:1.65!important}
.section-index{color:#766dff!important;font-weight:850!important;letter-spacing:.17em!important}
.attempt-ticket{position:relative!important;overflow:hidden!important;padding:1.65rem!important;border:1px solid rgba(93,142,211,.36)!important;border-top:1px solid rgba(103,212,255,.5)!important;border-radius:1.45rem!important;background:linear-gradient(180deg,rgba(13,39,78,.96),rgba(7,24,54,.98))!important;box-shadow:0 22px 70px rgba(0,0,0,.34),inset 0 1px rgba(255,255,255,.05)!important}
.attempt-ticket:before{content:""!important;position:absolute!important;inset:0 0 auto!important;height:1px!important;background:linear-gradient(90deg,transparent,rgba(84,199,255,.8),rgba(118,87,255,.7),transparent)!important}
.attempt-ticket>strong{color:#fff!important;font-size:1.55rem!important;letter-spacing:-.02em!important}
.attempt-ticket ul{color:#b7c8df!important;line-height:1.65!important}
.attempt-ticket li::marker{color:#65d6ff!important}

.integrity-check{display:grid!important;grid-template-columns:26px minmax(0,1fr)!important;align-items:flex-start!important;gap:12px!important;margin-top:1.15rem!important;padding:15px 16px!important;border:1px solid rgba(121,158,211,.38)!important;border-radius:15px!important;background:linear-gradient(180deg,#0b2143,#081a36)!important;color:#eef6ff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;cursor:pointer!important}
.integrity-check:hover{border-color:rgba(101,214,255,.62)!important;background:linear-gradient(180deg,#0d2850,#0a1e3e)!important}
.integrity-check span{display:block!important;color:#eef6ff!important;opacity:1!important;font-weight:650!important;font-size:.88rem!important;line-height:1.5!important;text-shadow:none!important}
.integrity-check input[type="checkbox"]{-webkit-appearance:none!important;appearance:none!important;width:22px!important;height:22px!important;margin:0!important;border:1.5px solid #6f86aa!important;border-radius:6px!important;background:#06142d!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.02)!important;display:grid!important;place-content:center!important;cursor:pointer!important;transition:.18s ease!important}
.integrity-check input[type="checkbox"]:hover{border-color:#67d4ff!important;box-shadow:0 0 0 4px rgba(84,199,255,.1)!important}
.integrity-check input[type="checkbox"]:checked{border-color:#766dff!important;background:linear-gradient(135deg,#4f55ff,#7c3cf3)!important;box-shadow:0 0 0 4px rgba(118,109,255,.13),0 0 18px rgba(118,109,255,.28)!important}
.integrity-check input[type="checkbox"]:checked:after{content:"✓"!important;color:white!important;font-size:14px!important;font-weight:900!important;line-height:1!important}

#begin-test{min-height:48px!important;border-radius:13px!important;background:linear-gradient(135deg,#5357ff,#7e3df3)!important;color:#fff!important;font-weight:850!important;box-shadow:0 14px 32px rgba(91,80,245,.34)!important}
#begin-test:disabled{opacity:.58!important;background:linear-gradient(135deg,#3b456f,#4d4778)!important;color:#d9e1ef!important;box-shadow:none!important}
#begin-test:not(:disabled):hover{transform:translateY(-1px)!important;box-shadow:0 18px 38px rgba(91,80,245,.42)!important}

.battle-test-topbar .battle-brand{gap:.75rem!important}
.battle-test-topbar .battle-brand img{width:42px!important;height:42px!important;padding:7px!important;border-radius:12px!important;background:linear-gradient(145deg,#22d3ee,#3b82f6 55%,#7c3aed)!important;box-shadow:0 0 24px rgba(59,130,246,.34)!important}
.battle-test-topbar .battle-brand span{font-weight:850!important;letter-spacing:-.02em!important}
.battle-test-topbar .battle-brand strong{color:#fff!important}
.battle-test-topbar .battle-brand i{color:#8077ff!important;font-style:normal!important}

.field-error{color:#ff9da8!important;font-weight:650!important}

@media(max-width:760px){
  .test-lobby{grid-template-columns:1fr!important;gap:1.5rem!important;min-height:0!important}
  .test-lobby h1{font-size:clamp(3rem,15vw,4.5rem)!important}
  .attempt-ticket{padding:1.25rem!important}
}
`

const textFiles = [
  "account.html", "account.js",
  "payment.html", "payment.js",
  "admin.html", "admin.js",
  "battle-test.html", "battle-test.js",
  "battle.css", "battle-test.css",
]

for (const file of textFiles) {
  let text = await fetchStable(file)

  text = text.replaceAll("./assets/nalariq-mark.png", "/icon.svg")
  text = text.replaceAll('content="#F7F9FD"', 'content="#06142f"')
  text = text.replaceAll("./account.css?v=2", "./account.css?v=5")
  text = text.replaceAll("./battle.css?v=3", "./battle.css?v=5")
  text = text.replaceAll("./battle-test.css?v=3", "./battle-test.css?v=5")
  text = text.replaceAll("./battle-test.js?v=3", "./battle-test.js?v=6")

  /* Cloudflare route hygiene */
  text = text.replaceAll('href="./battle"', 'href="/battle"')
  text = text.replaceAll('href="./account"', 'href="/account"')
  text = text.replaceAll('href="./payment"', 'href="/payment"')
  text = text.replaceAll('href="./battle-test"', 'href="/battle-test"')
  text = text.replaceAll('location.replace("https://indonesia-battle-iq.netlify.app/battle-test")', 'location.replace("/battle-test")')
  text = text.replaceAll("location.replace('https://indonesia-battle-iq.netlify.app/battle-test')", "location.replace('/battle-test')")
  text = text.replaceAll("https://indonesia-battle-iq.netlify.app/battle-test", "/battle-test")

  if (file === "battle-test.css") text += "\n" + testDark + "\n" + testPolish
  await writeFile(join(out, file), text)
}

await writeFile(join(out, "account.css"), accountCss)
await writeFile(join(out, "assets", "qris-alzava.jpg"), await fetchStable("assets/qris-alzava.jpg", true))

await writeFile(join(out, "service-worker.js"),
  "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).then(()=>self.clients.claim())));self.addEventListener('fetch',()=>{});"
)

await writeFile(join(out, "_redirects"), String.raw`
/battle        /battle/index.html  200
/battle/       /battle/index.html  200
/account       /account.html       200
/account/      /account.html       200
/payment       /payment.html       200
/payment/      /payment.html       200
/admin         /admin.html         200
/admin/        /admin.html         200
/battle-test   /battle-test.html   200
/battle-test/  /battle-test.html   200
`.trimStart())

console.log("Merged stable Battle IQ functionality with v31 dark premium UI.")
