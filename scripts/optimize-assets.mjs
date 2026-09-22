import sharp from "sharp"
import { access } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const imageDir = join(root, "public", "images")

async function mustExist(name) {
  try { await access(join(imageDir, name)) }
  catch { throw new Error(`Missing source asset: ${name}`) }
}

// Always derive optimized deploy assets from the exact committed PNG masters.
// New filenames avoid stale old WebP files/caches from earlier migrations.
await mustExist("hero-bg.png")
await sharp(join(imageDir, "hero-bg.png"), { failOn: "warning" })
  .webp({ quality: 80, effort: 6, smartSubsample: true })
  .toFile(join(imageDir, "hero-bg-opt.webp"))
console.log("built hero-bg-opt.webp from exact hero-bg.png")

const podium = [
  ["crown-gold.png", "crown-gold-opt.webp"],
  ["crown-silver.png", "crown-silver-opt.webp"],
  ["crown-bronze.png", "crown-bronze-opt.webp"],
  ["laurel-gold.png", "laurel-gold-opt.webp"],
  ["laurel-silver.png", "laurel-silver-opt.webp"],
  ["laurel-bronze.png", "laurel-bronze-opt.webp"],
]

for (const [inputName, outputName] of podium) {
  await mustExist(inputName)
  await sharp(join(imageDir, inputName), { failOn: "warning" })
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 92, alphaQuality: 100, effort: 6, smartSubsample: false })
    .toFile(join(imageDir, outputName))
  console.log(`built ${outputName} from exact ${inputName}`)
}

await mustExist("trophy-banner.png")
await sharp(join(imageDir, "trophy-banner.png"), { failOn: "warning" })
  .webp({ quality: 80, alphaQuality: 100, effort: 6, smartSubsample: true })
  .toFile(join(imageDir, "trophy-banner-opt.webp"))
console.log("built trophy-banner-opt.webp from exact trophy-banner.png")
