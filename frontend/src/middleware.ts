import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Legacy app subdomains → same path on apex domain (ecowatch.cloud/app/…). */
const LEGACY_APP_HOSTS = new Set(["app.ecowatchai.com", "app.ecowatch.cloud"]);

function apexHost(host: string): string {
  return host.replace(/^app\./, "");
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname } = request.nextUrl;

  if (LEGACY_APP_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.hostname = apexHost(host);
    if (pathname === "/") {
      url.pathname = "/app";
    }
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
