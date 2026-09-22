import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/","/battle","/battle-test","/challenge","/privacy","/terms","/refund","/help"],
      disallow: ["/admin","/payment","/account","/result"],
    },
    sitemap: "https://alzava-battle-iq.pages.dev/sitemap.xml",
  }
}
