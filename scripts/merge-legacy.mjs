import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const out = join(process.cwd(), "public")
await mkdir(out, { recursive: true })
await mkdir(join(out, "assets"), { recursive: true })

await writeFile(
  join(out, "service-worker.js"),
  "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).then(()=>self.clients.claim())));self.addEventListener('fetch',()=>{});"
)

console.log("Prepared native Battle IQ production assets.")
