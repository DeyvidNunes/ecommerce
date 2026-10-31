import type { ConnectionOptions } from 'node:tls';

export function getDatabaseSsl(): ConnectionOptions | undefined {
  if (process.env.DATABASE_SSL !== '1') {
    return undefined;
  }

  // Alguns provedores usam uma autoridade própria e entregam o certificado (CA).
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');

  return ca
    ? { ca, rejectUnauthorized: true }
    : { rejectUnauthorized: true };
}