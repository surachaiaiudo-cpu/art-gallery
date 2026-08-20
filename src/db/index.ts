import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'path';

// Database file path in root
const dbPath = path.resolve(process.cwd(), 'art_gallery.sqlite');

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });
export { schema };
