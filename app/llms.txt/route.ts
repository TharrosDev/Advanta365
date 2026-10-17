import { llmsIndex } from "@/lib/seo/llms";
import { textResponse } from "@/lib/seo/text-response";

export const dynamic = "force-static";

/** `/llms.txt`: the site in brief, for AI tools (lib/seo/llms.ts). */
export async function GET(): Promise<Response> {
  return textResponse(await llmsIndex());
}
