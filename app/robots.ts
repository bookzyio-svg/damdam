import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    // On ne référence PAS le chemin d'administration ici (le citer révélerait
    // le slug secret). Il est de toute façon protégé par le portail d'accès.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
