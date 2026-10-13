import { describe, expect, test } from "vitest";
import { orderCode } from "@/lib/checkout/order";
import { LICENCE_COOKIE, LICENCE_COOKIE_MAX_AGE, readCookie } from "@/lib/licence/cookie";
import { ORDER_CODE, licenceEnv, signLicence, verifyLicence } from "@/lib/licence/token";

const SECRET = "s".repeat(32);
const OTHER = "o".repeat(32);
const CODE = "A365-261013-ABCDEF";
const env = (overrides: Partial<ReturnType<typeof licenceEnv>> = {}) => ({
  secret: SECRET,
  revoked: new Set<string>(),
  ...overrides,
});

/** One character of `text` at `index`, changed to another character of the same alphabet. */
function flip(text: string, index: number): string {
  const swap = text[index] === "A" ? "B" : "A";
  return text.slice(0, index) + swap + text.slice(index + 1);
}

describe("licences", () => {
  test("a signed licence verifies to its order code and issue time", () => {
    const token = signLicence(CODE, SECRET, 1_760_000_000);
    expect(token.startsWith("v1.")).toBe(true);
    expect(verifyLicence(token, env())).toEqual({ orderCode: CODE, issuedAt: 1_760_000_000 });
  });

  test("the issue time defaults to now, in whole seconds", () => {
    const before = Math.floor(Date.now() / 1000);
    const result = verifyLicence(signLicence(CODE, SECRET), env());
    expect(result?.issuedAt).toBeGreaterThanOrEqual(before);
    expect(Number.isInteger(result?.issuedAt)).toBe(true);
  });

  test("a changed payload or signature fails", () => {
    const token = signLicence(CODE, SECRET, 1_760_000_000);
    const [, payload, signature] = token.split(".");
    expect(verifyLicence(`v1.${flip(payload!, 3)}.${signature}`, env())).toBeNull();
    expect(verifyLicence(`v1.${payload}.${flip(signature!, 3)}`, env())).toBeNull();
    expect(verifyLicence(`v1.${payload}.${signature!.slice(0, -2)}`, env())).toBeNull();
  });

  test("a licence signed with another secret fails", () => {
    expect(verifyLicence(signLicence(CODE, OTHER), env())).toBeNull();
  });

  test("a licence signed with the previous secret verifies while it is set", () => {
    const token = signLicence(CODE, OTHER);
    expect(verifyLicence(token, env({ previous: OTHER }))?.orderCode).toBe(CODE);
  });

  test("a revoked order fails, even with a good signature", () => {
    const token = signLicence(CODE, SECRET);
    expect(verifyLicence(token, env({ revoked: new Set([CODE]) }))).toBeNull();
  });

  test("nothing verifies without a secret", () => {
    const token = signLicence(CODE, SECRET);
    expect(verifyLicence(token, env({ secret: undefined }))).toBeNull();
    expect(verifyLicence(token, env({ secret: undefined, previous: SECRET }))).toBeNull();
  });

  test("a short secret configured on the server verifies nothing", () => {
    const token = signLicence(CODE, SECRET);
    expect(verifyLicence(token, env({ secret: "short" }))).toBeNull();
  });

  test.each([
    ["no token", null],
    ["an empty token", ""],
    ["another version", "v2.e30.e30"],
    ["too few parts", "v1.e30"],
    ["too many parts", "v1.e30.e30.e30"],
  ])("%s fails", (_, token) => {
    expect(verifyLicence(token, env())).toBeNull();
  });

  test("a well-signed payload that is not a licence fails", async () => {
    const { createHmac } = await import("node:crypto");
    const forge = (json: string) => {
      const payload = Buffer.from(json).toString("base64url");
      const signature = createHmac("sha256", SECRET).update(`v1.${payload}`).digest("base64url");
      return `v1.${payload}.${signature}`;
    };
    expect(verifyLicence(forge("not json"), env())).toBeNull();
    expect(verifyLicence(forge(`{"o":"A365-261013-ABCDE0","i":1}`), env())).toBeNull();
    expect(verifyLicence(forge(`{"o":"${CODE}","i":0}`), env())).toBeNull();
    expect(verifyLicence(forge(`{"o":"${CODE}","i":1.5}`), env())).toBeNull();
    expect(verifyLicence(forge(`{"o":"${CODE}","i":1,"e":"x"}`), env())).toBeNull();
    expect(verifyLicence(forge(`{"o":"${CODE}","i":1}`), env())?.orderCode).toBe(CODE);
  });

  test("signing refuses a bad order code or a short secret", () => {
    expect(() => signLicence("A365-261013-ABCDE0", SECRET)).toThrow();
    expect(() => signLicence("a365-261013-abcdef", SECRET)).toThrow();
    expect(() => signLicence(CODE, "s".repeat(31))).toThrow();
  });

  test("the order code pattern matches every code the checkout makes", () => {
    for (let draw = 0; draw < 200; draw += 1) {
      const code = orderCode(new Date(), crypto.getRandomValues(new Uint8Array(6)));
      expect(code).toMatch(ORDER_CODE);
    }
  });

  test("the environment gives the secrets and the revoked codes", () => {
    const read = licenceEnv({
      LICENCE_SECRET: SECRET,
      LICENCE_SECRET_PREVIOUS: OTHER,
      LICENCE_REVOKED: ` ${CODE} ,A365-261013-ZZZZZZ,, `,
    });
    expect(read.secret).toBe(SECRET);
    expect(read.previous).toBe(OTHER);
    expect([...read.revoked].sort()).toEqual([CODE, "A365-261013-ZZZZZZ"]);
    expect(licenceEnv({}).revoked.size).toBe(0);
  });
});

describe("the licence cookie", () => {
  test("is a host-only cookie that lasts 400 days", () => {
    expect(LICENCE_COOKIE).toBe("__Host-a365-licence");
    expect(LICENCE_COOKIE_MAX_AGE).toBe(400 * 24 * 60 * 60);
  });

  test("is read from a cookie header among others", () => {
    expect(readCookie(`a=1; ${LICENCE_COOKIE}=v1.x.y; b=2`, LICENCE_COOKIE)).toBe("v1.x.y");
    expect(readCookie(`x${LICENCE_COOKIE}=nope`, LICENCE_COOKIE)).toBeNull();
    expect(readCookie("a=1", LICENCE_COOKIE)).toBeNull();
    expect(readCookie(null, LICENCE_COOKIE)).toBeNull();
  });
});
