export function getDatabaseSsl():
  | { ca?: string; rejectUnauthorized: boolean }
  | undefined {
  if (process.env.DATABASE_SSL !== '1') {
    return undefined;
  }

  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');

  return ca
    ? { ca, rejectUnauthorized: true }
    : { rejectUnauthorized: true };
}