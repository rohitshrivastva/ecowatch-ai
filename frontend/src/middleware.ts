import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_HOSTS = new Set(["app.ecowatchai.com", "app.ecowatch.cloud"]);
const MARKETING_HOSTS = new Set(["ecowatchai.com", "www.ecowatchai.com", "ecowatch.cloud", "www.ecowatch.cloud"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname } = request.nextUrl;

  if (APP_HOSTS.has(host)) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
  }

  if (MARKETING_HOSTS.has(host) && pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.hostname = host.startsWith("www.") ? `app.${host.slice(4)}` : `app.${host}`;
    url.protocol = request.nextUrl.protocol;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
