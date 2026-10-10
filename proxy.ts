import { NextResponse, type NextRequest } from "next/server";

// URLs are lower-case. Redirecting mixed-case paths keeps behavior the same on
// every host, including case-insensitive file systems.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();
  if (pathname === lower) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = lower;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next.js internals and files with an extension.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
