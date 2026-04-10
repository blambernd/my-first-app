import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://oldtimer-docs.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/faq", "/kontakt", "/login", "/register"],
        disallow: [
          "/dashboard",
          "/vehicles/",
          "/settings",
          "/api/",
          "/profil/",
          "/transfer/",
          "/invite/",
          "/r/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
