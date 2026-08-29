// Populates the database with development/test data:
// one admin, one normal user, one store owner, one store, a few ratings.
// Safe to re-run - it upserts on email / clears ratings for the demo store.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const DEV_PASSWORD = 'DevPass123!'; // meets the 8-16, uppercase + special rule

async function upsertUser({ name, email, address, role }) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, address = EXCLUDED.address, role = EXCLUDED.role
     RETURNING id, name, email, role`,
    [name, email, passwordHash, address, role]
  );
  return result.rows[0];
}

async function seed() {
  console.log('Seeding development data...');

  const admin = await upsertUser({
    name: 'Priya Administrator Ramanathan',
    email: 'admin@storerating.dev',
    address: '221 Baker Street, Springfield, IL 62701',
    role: 'admin',
  });

  const normalUser = await upsertUser({
    name: 'Daniel Robert Whitfield Junior',
    email: 'user@storerating.dev',
    address: '48 Maple Avenue, Riverside, CA 92501',
    role: 'user',
  });

  const secondUser = await upsertUser({
    name: 'Fatima Zahra Chowdhury Islam',
    email: 'user2@storerating.dev',
    address: '15 Elm Street, Brookfield, WI 53045',
    role: 'user',
  });

  const storeOwner = await upsertUser({
    name: 'Marcus Alexander Thornbury Reid',
    email: 'owner@storerating.dev',
    address: '9 Commerce Way, Georgetown, TX 78626',
    role: 'store_owner',
  });

  const storeResult = await pool.query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    ['Thornbury Hardware & Garden Supply', 'contact@thornburyhardware.dev', '9 Commerce Way, Georgetown, TX 78626', storeOwner.id]
  );

  let storeId = storeResult.rows[0] && storeResult.rows[0].id;
  if (!storeId) {
    const existing = await pool.query('SELECT id FROM stores WHERE owner_id = $1 LIMIT 1', [storeOwner.id]);
    storeId = existing.rows[0].id;
  }

  await pool.query(
    `INSERT INTO ratings (user_id, store_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, store_id) DO UPDATE SET rating = EXCLUDED.rating`,
    [normalUser.id, storeId, 4]
  );
  await pool.query(
    `INSERT INTO ratings (user_id, store_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, store_id) DO UPDATE SET rating = EXCLUDED.rating`,
    [secondUser.id, storeId, 5]
  );

  console.log('\nSeed complete. DEVELOPMENT/TEST CREDENTIALS ONLY:');
  console.log('----------------------------------------------------');
  console.log(`Admin       -> ${admin.email} / ${DEV_PASSWORD}`);
  console.log(`Normal User -> ${normalUser.email} / ${DEV_PASSWORD}`);
  console.log(`Normal User -> ${secondUser.email} / ${DEV_PASSWORD}`);
  console.log(`Store Owner -> ${storeOwner.email} / ${DEV_PASSWORD}`);
  console.log('----------------------------------------------------');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
