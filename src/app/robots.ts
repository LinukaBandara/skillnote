import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
