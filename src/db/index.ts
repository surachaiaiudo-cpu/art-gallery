import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Mock D1 binding for fallback / build-time SSG
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

export function getD1Binding() {
  if (typeof (globalThis as any).DB !== 'undefined') {
    return (globalThis as any).DB;
  }

  if (typeof process !== 'undefined' && (process.env as any).DB) {
    return (process.env as any).DB;
  }

  return mockD1;
}

export function getDb() {
  const binding = getD1Binding();
  return drizzle(binding, { schema });
}

// Dynamic Proxy to always bind to the active request's D1 instance
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const activeDb = getDb();
    const val = (activeDb as any)[prop];
    if (typeof val === 'function') {
      return val.bind(activeDb);
    }
    return val;
  },
});

export { schema };
