/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async redirects() {
    const legacyAppHosts = ["app.ecowatch.cloud", "app.ecowatchai.com"];
    return legacyAppHosts.flatMap((host) => [
      {
        source: "/",
        has: [{ type: "host", value: host }],
        destination: "https://ecowatch.cloud/app",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: host }],
        destination: "https://ecowatch.cloud/:path*",
        permanent: true,
      },
    ]);
  },
};

module.exports = nextConfig;
