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
  if (!localLibsqlDb) {
    try {
      const client = createClient({
        url: 'file:art_gallery.sqlite',
      });
      localLibsqlDb = drizzleLibsql(client, { schema });
    } catch (err) {
      console.warn('Local SQLite init error:', err);
    }
  }
  return localLibsqlDb;
}

// Safe Dynamic Proxy
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const activeDb = getDb();
    if (activeDb) {
      const val = (activeDb as any)[prop];
      if (typeof val === 'function') {
        return val.bind(activeDb);
      }
      return val;
    }

    // Mock fallback when no DB binding is available
    if (prop === 'select') {
      return () => {
        const queryChain: any = {
          from: () => queryChain,
          where: () => queryChain,
          orderBy: () => queryChain,
          innerJoin: () => queryChain,
          leftJoin: () => queryChain,
          limit: () => Promise.resolve([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        };
        return queryChain;
      };
    }

    if (prop === 'insert') {
      return (_table: any) => ({
        values: (_vals: any) => ({
          returning: () => Promise.resolve([{ id: `mock-${Date.now()}` }]),
          then: (resolve: any) => Promise.resolve({ success: true }).then(resolve),
        }),
      });
    }

    if (prop === 'update') {
      return (_table: any) => ({
        set: (_data: any) => ({
          where: () => Promise.resolve({ success: true }),
          then: (resolve: any) => Promise.resolve({ success: true }).then(resolve),
        }),
      });
    }

    if (prop === 'delete') {
      return (_table: any) => ({
        where: () => Promise.resolve({ success: true }),
        then: (resolve: any) => Promise.resolve({ success: true }).then(resolve),
      });
    }

    return () => ({});
  },
});

export { schema };
