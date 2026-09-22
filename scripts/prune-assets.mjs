import { rm } from "node:fs/promises"
import { join } from "node:path"

const outImages = join(process.cwd(), "out", "images")
const heavyPngs = [
  "hero-bg.png",
  "trophy-banner.png",
  "crown-gold.png",
  "crown-silver.png",
  "crown-bronze.png",
  "laurel-gold.png",
  "laurel-silver.png",
  "laurel-bronze.png",
]

for (const name of heavyPngs) {
  await rm(join(outImages, name), { force: true })
}

console.log("Removed heavy PNG copies from deploy output; WebP variants remain.")
