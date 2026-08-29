import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const storefrontUrl = process.env.STOREFRONT_URL || 'http://localhost:3000'

// emailpass всегда включён; Google/Facebook подключаются, когда в .env
// появляются ключи приложений (без ключей провайдер не регистрируется)
const authProviders: Record<string, unknown>[] = [
  { resolve: '@medusajs/medusa/auth-emailpass', id: 'emailpass' },
]
if (process.env.GOOGLE_CLIENT_ID) {
  authProviders.push({
    resolve: '@medusajs/medusa/auth-google',
    id: 'google',
    options: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL || `${storefrontUrl}/account/oauth/google`,
    },
  })
}
if (process.env.FACEBOOK_CLIENT_ID) {
  authProviders.push({
    resolve: './src/modules/auth-facebook',
    id: 'facebook',
    options: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackUrl:
        process.env.FACEBOOK_CALLBACK_URL ||
        `${storefrontUrl}/account/oauth/facebook`,
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: '@medusajs/medusa/auth',
      options: { providers: authProviders },
    },
  ],
})
