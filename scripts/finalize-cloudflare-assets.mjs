import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const srcDir = join(root, "public", "images")
const outDir = join(root, "out", "images")
await mkdir(outDir, { recursive: true })

async function webp(inputName, outputName, options = {}) {
  let pipeline = sharp(join(srcDir, inputName), { failOn: "warning" })
  if (options.width) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.width,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
  }
  await pipeline
    .webp({
      quality: options.quality ?? 88,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: options.alpha ? false : true,
    })
    .toFile(join(outDir, outputName))
  console.log(`finalized ${outputName}`)
}

// IMPORTANT: generate straight into /out AFTER Next static export.
// This guarantees Cloudflare Pages actually receives the optimized binaries.
await webp("hero-bg.png", "hero-bg-cf.webp", { quality: 80 })
await webp("trophy-banner.png", "trophy-banner-cf.webp", { quality: 80 })

await webp("crown-gold.png", "crown-gold-cf.webp", { width: 512, quality: 92, alpha: true })
await webp("crown-silver.png", "crown-silver-cf.webp", { width: 512, quality: 92, alpha: true })
await webp("crown-bronze.png", "crown-bronze-cf.webp", { width: 512, quality: 92, alpha: true })

await webp("laurel-gold.png", "laurel-gold-cf.webp", { width: 512, quality: 92, alpha: true })
await webp("laurel-silver.png", "laurel-silver-cf.webp", { width: 512, quality: 92, alpha: true })
await webp("laurel-bronze.png", "laurel-bronze-cf.webp", { width: 512, quality: 92, alpha: true })
