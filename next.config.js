/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

// We'll manually handle the service worker without next-pwa
module.exports = nextConfig;
