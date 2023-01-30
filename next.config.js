/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
        // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
        config.resolve.fallback = {
            fs: false
        }
    }

    return config;
  },
  serverRuntimeConfig: {
    SENDER_MAIL_HOST: process.env.SENDER_MAIL_HOST,
    SENDER_MAIL_PORT: process.env.SENDER_MAIL_PORT,
    SENDER_MAIL_USER: process.env.SENDER_MAIL_USER,
    SENDER_USER_PASSWORD: process.env.SENDER_USER_PASSWORD,
    SECURE_CONNECTION: process.env.SECURE_CONNECTION,
    TLS_CIPHERS: process.env.TLS_CIPHERS,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  },
  //output: 'standalone',
}

module.exports = nextConfig
