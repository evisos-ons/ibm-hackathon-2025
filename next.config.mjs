/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["geist"],
  trailingSlash: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org",
      },
      {
        protocol: "https",
        hostname: "world.openfoodfacts.org",
      },
    ],
  },
};

export default nextConfig;
