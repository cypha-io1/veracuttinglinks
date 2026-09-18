import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding userProfileId column to Order table...');
    await client.query(`
      ALTER TABLE "Order" 
      ADD COLUMN IF NOT EXISTS "userProfileId" INT 
      REFERENCES "UserProfile"(id) ON DELETE SET NULL
    `);
    console.log('✓ Column added successfully');

    console.log('Creating index on userProfileId...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_user_profile_id 
      ON "Order"("userProfileId")
    `);
    console.log('✓ Index created successfully');

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

migrate();
