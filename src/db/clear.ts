import { createClient } from '@libsql/client';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'art_gallery.sqlite');
const client = createClient({
  url: `file:${dbPath}`,
});

async function clear() {
  console.log('🧹 Clearing all data from database tables...');

  await client.executeMultiple(`
    DELETE FROM inquiries;
    DELETE FROM guestbook_entries;
    DELETE FROM exhibition_artworks;
    DELETE FROM artworks;
    DELETE FROM exhibitions;
    DELETE FROM users;
  `);

  console.log('✨ All mockup data and records successfully removed from database!');
}

clear().catch((err) => {
  console.error('Error clearing database:', err);
  process.exit(1);
});
