const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'bazaar_mitr',
  user: 'bazaar_user',
  password: 'bazaar_pass'
});

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations', 'local');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

async function applyMigrations() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    for (const file of migrationFiles) {
      console.log(`\nApplying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✓ ${file} applied successfully`);
      } catch (err) {
        console.error(`✗ ${file} failed:`, err.message);
        // Continue with other migrations
      }
    }

    console.log('\n✓ All migrations completed');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

applyMigrations();
