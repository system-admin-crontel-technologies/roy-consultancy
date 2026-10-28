import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo: trace files from the workspace root so workspace packages are bundled into the standalone build.
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@roy/types"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
