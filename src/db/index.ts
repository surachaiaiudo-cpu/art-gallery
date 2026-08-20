import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Mock D1 binding for build time / SSG
const mockD1: any = {
  prepare: () => ({
    bind: () => ({
      all: async () => ({ results: [] }),
      first: async () => null,
      run: async () => ({ success: true }),
      values: async () => [],
    }),
    all: async () => ({ results: [] }),
    first: async () => null,
    run: async () => ({ success: true }),
    values: async () => [],
  }),
  batch: async () => [],
  exec: async () => ({ count: 0, duration: 0 }),
};

// Global DB instance connecting to Cloudflare D1
const binding = (globalThis as any).DB || (process.env as any).DB || mockD1;
export const db = drizzle(binding, { schema });
export { schema };
