import type {NextConfig} from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@docally/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
