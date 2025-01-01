import type { NextConfig } from "next";

 /** @type {import('next').NextConfig} */
 const nextConfig = {
  env: {
      REACT_APP_GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY,
  },
}

module.exports = nextConfig
