import { llmsFull } from "@/lib/seo/llms";
import { textResponse } from "@/lib/seo/text-response";

export const dynamic = "force-static";

/** `/llms-full.txt`: the site in full, for AI tools (lib/seo/llms.ts). */
export async function GET(): Promise<Response> {
  return textResponse(await llmsFull());
}
