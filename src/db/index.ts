import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export function getD1Binding() {
  try {
    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    if (ctx?.env?.DB && typeof ctx.env.DB.prepare === 'function') {
      return ctx.env.DB;
    }
  } catch {}

  if (typeof (globalThis as any).DB !== 'undefined' && typeof (globalThis as any).DB?.prepare === 'function') {
    return (globalThis as any).DB;
  }

  if (typeof process !== 'undefined' && (process.env as any).DB && typeof (process.env as any).DB?.prepare === 'function') {
    return (process.env as any).DB;
  }

  return null;
}

export function hasD1Binding(): boolean {
  return getD1Binding() !== null;
}

let localLibsqlDb: any = null;

export function getDb() {
  const binding = getD1Binding();
  if (binding) {
    try {
      return drizzleD1(binding, { schema });
    } catch {}
  }

  // Fallback to local SQLite when running locally
  if (typeof process !== 'undefined' && process.cwd) {
    if (!localLibsqlDb) {
      try {
        const dbPath = process.cwd() + '/art_gallery.sqlite';
        const client = createClient({
          url: `file:${dbPath}`,
        });
        localLibsqlDb = drizzleLibsql(client, { schema });
      } catch (err) {
        console.warn('Local SQLite init error:', err);
      }
    }
    return localLibsqlDb;
  }

  return null;
}

// Safe Dynamic Proxy
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const activeDb = getDb();
    if (!activeDb) {
      return () => ({
        from: () => ({
          where: () => ({ limit: async () => [] }),
          orderBy: () => ({ limit: async () => [], values: async () => [] }),
          innerJoin: () => ({ leftJoin: () => ({ where: () => ({ orderBy: async () => [] }) }) }),
          leftJoin: () => ({ orderBy: async () => [] }),
          limit: async () => [],
        }),
        insert: () => ({ values: async () => ({ success: true }) }),
        update: () => ({ set: () => ({ where: async () => ({ success: true }) }) }),
        delete: () => ({ where: async () => ({ success: true }) }),
      });
    }
    const val = (activeDb as any)[prop];
    if (typeof val === 'function') {
      return val.bind(activeDb);
    }
    return val;
  },
});

export { schema };
