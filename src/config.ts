import { Currency } from '@common/Currency';

export const baseDomain = process.env.BASE_DOMAIN || 'http://localhost:3000';
export const environment = process.env.NODE_ENV || 'development';
export const port = process.env.PORT || 4000;

export const baseColor = process.env.BASE_COLOR || '#15BEFF';
export const systemCurrency = process.env.CURRENCY || Currency.USD;

export const db = {
  name: environment === 'development' ? 'test' : 'main',
  host: process.env.DB_HOST || '',
  port: process.env.DB_PORT || '',
  user:
    environment === 'development'
      ? process.env.DB_TEST_USER || ''
      : process.env.DB_MAIN_USER || '',
  pass:
    environment === 'development'
      ? process.env.DB_TEST_PASS || ''
      : process.env.DB_MAIN_PASS || '',
};

export const corsOptions = {
  development: {
    origin: '*',
    // methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
  },
  production: {
    origin: 'https://eloheaven.gg',
    // methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
  },
};

export const tokenInfo = {
  accessTokenValidityDays: parseInt(
    process.env.ACCESS_TOKEN_VALIDITY_DAYS || '0',
  ),
  refreshTokenValidityDays: parseInt(
    process.env.REFRESH_TOKEN_VALIDITY_DAYS || '0',
  ),
  issuer: process.env.TOKEN_ISSUER || '',
};

export const logDirectory = process.env.LOG_DIR;

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
export const stripeEndpointSecret = process.env.STRIPE_ENDPOINT_SECRET || '';

export const stripePaypalSecretKey = process.env.STRIPEPAYPAL_SECRET_KEY || '';
export const stripePaypalEndpointSecret =
  process.env.STRIPEPAYPAL_ENDPOINT_SECRET || '';

export const coinbaseApiKey = process.env.COINBASE_API_KEY || '';
export const coinbaseSecret = process.env.COINBASE_SECRET || '';

export const discordOauthAppId = process.env.DISCORD_AUTH_APP_ID || '';
export const discordOauthToken = process.env.DISCORD_AUTH_TOKEN || '';

export const facebookOauthAppId = process.env.FACEBOOK_AUTH_APP_ID || '';
export const facebookOauthToken = process.env.FACEBOOK_AUTH_TOKEN || '';

export const googleOauthAppId = process.env.GOOGLE_CLIENT_ID || '';
export const googleOauthToken = process.env.GOOGLE_CLIENT_SECRET || '';

export const discordAppId = process.env.DISCORD_APP_ID || '';
export const discordToken = process.env.DISCORD_TOKEN || '';

export const recaptchaSecretv2 = process.env.RECAPTCHA_SECRET_V2 || '';
export const recaptchaSecretv3 = process.env.RECAPTCHA_SECRET_V3 || '';

export const riotApiKey = process.env.RIOT_API_KEY || '';

export const spreadsheetId = process.env.SPREADSHEET_ID || '';
export const googleServiceAccountEmail =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
export const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY || '';

export const notificationCooldown = process.env.NOTIFICATION_COOLDOWN || 1;

export const redisUrl = process.env.REDIS_URL || '';
export const redisKeys = {
  currencyRates: 'currency_rates',
  trustpilot: 'trustpilot',
};

export const desktopAppVersion = process.env.DESKTOP_APP_VERSION || '';
export const fileKey = process.env.FILE_KEY || '';
export const fileIV = process.env.FILE_IV || '';

export const mailAddress = process.env.MAIL_ADDRESS || '';
export const mailClientId = process.env.MAIL_CLIENT_ID || '';
export const mailPrivateKey = process.env.MAIL_PRIVATE_KEY || '';

export const emojiList = {
  lanetop: '<:lanetop:1070311042707619980>',
  lanemid: '<:lanemid:1070311029420077067>',
  lanejungle: '<:lanejungle:1070311022444957706>',
  laneadc: '<:laneadc:1070311013829836811>',
  lanesupport: '<:lanesupport:1070311037452156998>',
  spellflash: '<:spellflash:1070313275352424548>',
};
