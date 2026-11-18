/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // sharp & SDK Gemini dijalankan sebagai paket Node biasa (tidak di-bundle)
    serverComponentsExternalPackages: ["sharp", "@google/genai"],
  },
};

export default nextConfig;
