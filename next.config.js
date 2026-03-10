/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@react-pdf/renderer"],
  watchOptions: {
    ignored: ["**/.claude/**", "**/.git/**"],
  },
};

module.exports = nextConfig;
