import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

// Environment lives at the monorepo root; fall back to a local .env if present.
loadEnv({ path: [resolve(import.meta.dirname, '../../.env'), resolve(import.meta.dirname, '.env')] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read directly so `prisma generate` works without a database configured.
    url: process.env.DATABASE_URL ?? 'postgresql://invalid',
  },
});
