/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config) => {
    // Webpack can resolve `micromatch` to a default-only export, which breaks
    // Tailwind/fast-glob (`micromatch.braces is not a function`) during CSS build.
    const micromatchPath = require.resolve("micromatch");
    const bracesPath = require.resolve("braces");
    if (Array.isArray(config.resolve.alias)) {
      config.resolve.alias.push(
        { name: "micromatch", alias: micromatchPath },
        { name: "braces", alias: bracesPath }
      );
    } else {
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias.micromatch = micromatchPath;
      config.resolve.alias.braces = bracesPath;
    }
    return config;
  },
};

module.exports = nextConfig;
