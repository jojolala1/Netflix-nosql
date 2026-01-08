import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Important pour Docker en production
};

module.exports = nextConfig;
