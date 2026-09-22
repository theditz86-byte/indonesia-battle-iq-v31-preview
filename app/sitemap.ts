import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base="https://alzava-battle-iq.pages.dev"
  return [
    { url: `${base}/battle`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/battle-test`, changeFrequency: "weekly", priority: .9 },
    { url: `${base}/account`, changeFrequency: "monthly", priority: .6 },
    { url: `${base}/result`, changeFrequency: "weekly", priority: .7 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: .3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: .3 },
    { url: `${base}/refund`, changeFrequency: "yearly", priority: .3 },
    { url: `${base}/help`, changeFrequency: "monthly", priority: .4 },
  ]
}
