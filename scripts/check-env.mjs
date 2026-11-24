import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYSTACK_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  console.error(`Missing required launch environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

try {
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
  if (!['https:', 'http:'].includes(appUrl.protocol)) throw new Error('Unsupported protocol');
  if (appUrl.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(appUrl.hostname)) {
    throw new Error('Production site URL must use HTTPS');
  }
} catch {
  console.error('NEXT_PUBLIC_APP_URL must be a valid HTTPS production URL (or localhost for development).');
  process.exit(1);
}

console.log('Required launch environment variables are configured.');
