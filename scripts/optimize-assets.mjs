import sharp from "sharp"
import { access } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const imageDir = join(root, "public", "images")

const exists = async (name) => {
  try {
    await access(join(imageDir, name))
  } catch {
    throw new Error(`Missing source asset: ${name}`)
  }
}

// Hero: keep the exact original PNG as the visual source, but publish modern,
// bandwidth-friendly AVIF + WebP variants.
await exists("hero-bg.png")
await sharp(join(imageDir, "hero-bg.png"), { failOn: "warning" })
  .avif({ quality: 52, effort: 8, chromaSubsampling: "4:2:0" })
  .toFile(join(imageDir, "hero-bg.avif"))
await sharp(join(imageDir, "hero-bg.png"), { failOn: "warning" })
  .webp({ quality: 76, effort: 6, smartSubsample: true })
  .toFile(join(imageDir, "hero-bg.webp"))
console.log("optimized hero-bg.png -> hero-bg.avif + hero-bg.webp")

// Decorative podium assets: preserve the exact original proportions and alpha.
// Resize only to a sensible display density instead of forcing every file to
// the same 512px box. This avoids distorted/odd crowns while keeping transfer low.
const transparentJobs = [
  { input: "crown-gold.png", output: "crown-gold.webp", width: 192 },
  { input: "crown-silver.png", output: "crown-silver.webp", width: 192 },
  { input: "crown-bronze.png", output: "crown-bronze.webp", width: 192 },
  { input: "laurel-gold.png", output: "laurel-gold.webp", width: 384 },
  { input: "laurel-silver.png", output: "laurel-silver.webp", width: 384 },
  { input: "laurel-bronze.png", output: "laurel-bronze.webp", width: 384 },
]

for (const job of transparentJobs) {
  await exists(job.input)
  await sharp(join(imageDir, job.input), { failOn: "warning" })
    .resize({
      width: job.width,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality: 92,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: false,
    })
    .toFile(join(imageDir, job.output))
  console.log(`optimized ${job.input} -> ${job.output}`)
}

await exists("trophy-banner.png")
await sharp(join(imageDir, "trophy-banner.png"), { failOn: "warning" })
  .webp({ quality: 78, alphaQuality: 100, effort: 6, smartSubsample: true })
  .toFile(join(imageDir, "trophy-banner.webp"))
console.log("optimized trophy-banner.png -> trophy-banner.webp")
