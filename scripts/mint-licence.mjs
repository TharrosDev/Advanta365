// Prints the licence link for a paid order: node scripts/mint-licence.mjs A365-261013-ABCDEF
//
// Reads LICENCE_SECRET (the site's own, at least 32 characters) and SITE_ORIGIN (default
// https://advanta365.com) from the environment. Send the link to the buyer; opening it once puts the
// licence in their browser and lands them on /library. Needs Node 22.18 or later, which runs the
// TypeScript module below directly.
import { signLicence } from "../lib/licence/token.ts";

const [code] = process.argv.slice(2);
const secret = process.env.LICENCE_SECRET ?? "";
const origin = (process.env.SITE_ORIGIN ?? "https://advanta365.com").replace(/\/+$/, "");

if (!code) {
  console.error("Usage: node scripts/mint-licence.mjs <order code>");
  process.exit(1);
}

try {
  const token = signLicence(code, secret);
  console.log(`${origin}/licence?t=${token}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
