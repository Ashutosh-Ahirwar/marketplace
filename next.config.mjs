/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // The standard path Farcaster clients check
        source: '/.well-known/farcaster.json',
        // REPLACE '1234567890' with your actual Hosted Manifest ID
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019ad0e2-533a-690c-cda1-8c0b83954e3e',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;