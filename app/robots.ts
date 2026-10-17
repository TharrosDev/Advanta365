import type { MetadataRoute } from "next";
import { absoluteUrl, isPublicDeployment, SITE_ORIGIN } from "@/lib/seo/origin";

/**
 * The crawlers of AI search and answer engines, named one by one. A crawler that finds a group with
 * its own name follows that group and ignores `*`, so each gets the same rules, spelled out: the
 * site wants to be read, cited and recommended by them. Only the marketing pages and the free
 * samples' descriptions are public; the toolkit's files stay behind the licence whoever asks.
 */
export const AI_CRAWLERS = [
  // OpenAI: ChatGPT search, the browsing of ChatGPT, and training.
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  // Anthropic: Claude's search, its fetching for a user, and training.
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "anthropic-ai",
  // Perplexity.
  "PerplexityBot",
  "Perplexity-User",
  // Google's and Apple's switches for their AI features.
  "Google-Extended",
  "Applebot-Extended",
  // Microsoft Copilot and Bing are served by Bingbot; DuckDuckGo's answers by DuckAssistBot.
  "Bingbot",
  "DuckAssistBot",
  // Others that answer questions from the web.
  "Amazonbot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "MistralAI-User",
  "cohere-ai",
  "YouBot",
  "CCBot",
] as const;

/**
 * What no crawler reads: the file addresses (free and licensed) and the licence link. They also
 * answer with `X-Robots-Tag: noindex` (next.config.ts).
 */
const PRIVATE = ["/api/", "/licence"];

/**
 * `/robots.txt`. In production every crawler may read every page but the private addresses, and
 * is pointed at the sitemap. A preview deployment turns every crawler away.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isPublicDeployment()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: PRIVATE },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
