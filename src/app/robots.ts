import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://skillnote.lk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/teacher/",
        "/onboarding/",
        "/notifications/",
        "/settings/",
        "/profile/",
        "/study-plan/",
        "/skill-insights/",
        "/practice/",
        "/auth/",
        "/login/",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
