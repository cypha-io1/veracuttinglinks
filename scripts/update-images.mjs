import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const imagePool = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
];

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to database.');

    const res = await client.query('SELECT id FROM "Product" ORDER BY id ASC');
    
    for (let i = 0; i < res.rows.length; i++) {
      const id = res.rows[i].id;
      
      const primaryImage = imagePool[i % imagePool.length];
      const secondImage = imagePool[(i + 1) % imagePool.length];
      const thirdImage = imagePool[(i + 2) % imagePool.length];
      
      const imageUrls = JSON.stringify([primaryImage, secondImage, thirdImage]);
      
      await client.query(
        'UPDATE "Product" SET image = $1, "imageUrls" = $2 WHERE id = $3',
        [primaryImage, imageUrls, id]
      );
    }

    console.log('Images updated successfully!');
    client.release();
  } catch (error) {
    console.error('Error updating images:', error);
  } finally {
    pool.end();
  }
}

main();
