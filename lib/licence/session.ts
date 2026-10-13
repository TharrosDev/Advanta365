import { cookies } from "next/headers";
import { LICENCE_COOKIE } from "./cookie";
import { licenceEnv, verifyLicence } from "./token";

/**
 * Whether this request comes from a browser holding a valid licence (the cookie /licence sets). A
 * page that calls it renders on every request. It only decides what a page shows: every file route
 * checks the licence again for itself.
 */
export async function hasLicence(): Promise<boolean> {
  const jar = await cookies();
  return verifyLicence(jar.get(LICENCE_COOKIE)?.value, licenceEnv()) !== null;
}
