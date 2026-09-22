import sharp from "sharp"
import { access } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const imageDir = join(root, "public", "images")

const jobs = [
  { input: "hero-bg.png", output: "hero-bg.webp", quality: 82 },
  { input: "trophy-banner.png", output: "trophy-banner.webp", quality: 78 },
  { input: "crown-gold.png", output: "crown-gold.webp", quality: 88, width: 512 },
  { input: "crown-silver.png", output: "crown-silver.webp", quality: 88, width: 512 },
  { input: "crown-bronze.png", output: "crown-bronze.webp", quality: 88, width: 512 },
  { input: "laurel-gold.png", output: "laurel-gold.webp", quality: 88, width: 512 },
  { input: "laurel-silver.png", output: "laurel-silver.webp", quality: 88, width: 512 },
  { input: "laurel-bronze.png", output: "laurel-bronze.webp", quality: 88, width: 512 },
]

for (const job of jobs) {
  const input = join(imageDir, job.input)
  const output = join(imageDir, job.output)
  try {
    await access(input)
  } catch {
    throw new Error(`Missing source asset: ${job.input}`)
  }

  let pipeline = sharp(input, { failOn: "warning" })
  if (job.width) {
    pipeline = pipeline.resize({
      width: job.width,
      height: job.width,
      fit: "inside",
      withoutEnlargement: true,
    })
  }

  await pipeline
    .webp({
      quality: job.quality,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(output)

  console.log(`optimized ${job.input} -> ${job.output}`)
}
