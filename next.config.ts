import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'image.tmdb.org',
      'images-na.ssl-images-amazon.com', 
      'images.igdb.com',
      'covers.openlibrary.org',
      'cdn.myanimelist.net',
      's4.anilist.co' // Added AniList CDN
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https', 
        hostname: 'images-na.ssl-images-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        port: '',
        pathname: '/file/anilistcdn/**',
      }
    ]
  }
};

export default nextConfig;
