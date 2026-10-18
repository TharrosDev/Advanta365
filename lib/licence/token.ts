import { createHmac, timingSafeEqual } from "node:crypto";
import { ORDER_CODE } from "./order-code.ts";

// This module imports nothing but node:crypto and ./order-code.ts, by a relative path with its
// extension, so scripts/mint-licence.mjs can run it directly under Node's type stripping.

/**
 * A licence: proof that an order was paid, which the owner issues (scripts/mint-licence.mjs) and a
 * payment webhook will issue later. It is `v1.<payload>.<signature>`, both base64url: the payload is
 * `{"o":"<order code>","i":<issued, unix seconds>}` and the signature is HMAC-SHA256 over
 * `v1.<payload>`. It holds nothing personal, because it travels in an address once. It does not
 * expire; a revoked order (LICENCE_REVOKED) is the only way to withdraw one.
 */

export { ORDER_CODE };

/** The shortest secret that signs or verifies anything. */
const MIN_SECRET = 32;

const VERSION = "v1";

type LicenceEnv = {
  /** Signs new licences and verifies them. */
  secret?: string;
  /** The secret before the last rotation: verifies only. */
  previous?: string;
  /** Order codes whose licences no longer work. */
  revoked: ReadonlySet<string>;
};

export type Licence = { orderCode: string; issuedAt: number };

/** The licence settings from the environment: LICENCE_SECRET, LICENCE_SECRET_PREVIOUS, LICENCE_REVOKED. */
export function licenceEnv(env: Record<string, string | undefined> = process.env): LicenceEnv {
  const revoked = (env.LICENCE_REVOKED ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
  return {
    secret: env.LICENCE_SECRET || undefined,
    previous: env.LICENCE_SECRET_PREVIOUS || undefined,
    revoked: new Set(revoked),
  };
}

function sign(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`${VERSION}.${payload}`).digest();
}

/** A licence for an order. Throws on a code that is not an order code or a secret under 32 characters. */
export function signLicence(
  orderCode: string,
  secret: string,
  issuedAt: number = Math.floor(Date.now() / 1000),
): string {
  if (!ORDER_CODE.test(orderCode)) throw new Error(`Not an order code: ${orderCode}`);
  if (secret.length < MIN_SECRET) {
    throw new Error(`The licence secret must be at least ${MIN_SECRET} characters`);
  }
  const payload = Buffer.from(JSON.stringify({ o: orderCode, i: issuedAt })).toString("base64url");
  return `${VERSION}.${payload}.${sign(payload, secret).toString("base64url")}`;
}

function parsePayload(payload: string): Licence | null {
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const keys = Object.keys(data).sort();
  if (keys.length !== 2 || keys[0] !== "i" || keys[1] !== "o") return null;
  const { o, i } = data as { o: unknown; i: unknown };
  if (typeof o !== "string" || !ORDER_CODE.test(o)) return null;
  if (typeof i !== "number" || !Number.isSafeInteger(i) || i <= 0) return null;
  return { orderCode: o, issuedAt: i };
}

/**
 * The licence a token proves, or `null`: for a token that is malformed, signed with neither secret,
 * for a revoked order, or when no secret is configured. The reason is never told apart.
 */
export function verifyLicence(token: string | null | undefined, env: LicenceEnv): Licence | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const [, payload, signature] = parts as [string, string, string];

  const given = Buffer.from(signature, "base64url");
  const secrets = [env.secret, env.secret ? env.previous : undefined].filter(
    (secret): secret is string => typeof secret === "string" && secret.length >= MIN_SECRET,
  );
  const signed = secrets.some((secret) => {
    const expected = sign(payload, secret);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!signed) return null;

  const licence = parsePayload(payload);
  if (!licence || env.revoked.has(licence.orderCode)) return null;
  return licence;
}
