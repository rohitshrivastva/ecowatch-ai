/** Dashboard URL for CTAs (subdomain in prod, /app in dev). */
export function getAppUrl(path = "/app"): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (base) return `${base.replace(/\/$/, "")}${path === "/app" ? "" : path}`;
  return path;
}
