import { registerAs } from '@nestjs/config';
import { getDatabaseSsl } from './database-ssl';

export default registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    type: 'mysql' as const,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    autoLoadEntities: true,
    ssl: getDatabaseSsl(),
    poolSize: Number(process.env.DATABASE_POOL_SIZE ?? 10),
  },
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM,
  },
  frontendUrl: process.env.FRONTEND_URL,
}));
