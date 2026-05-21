/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["chrome-aws-lambda", "puppeteer-core"],
  turbopack: {
    resolveAlias: {
      // Keep these server-only packages out of client bundles.
      chrome_aws_lambda: "chrome-aws-lambda",
      puppeteer_core: "puppeteer-core",
    },
  },
}

export default nextConfig
