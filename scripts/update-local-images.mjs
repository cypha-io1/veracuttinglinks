import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const localImages = [
  '/products/kids_caftan_blue.jpg',
  '/products/kids_summer_dress.jpg',
  '/products/kids_caftan_moroccan.jpg',
  '/products/kids_party_dress.jpg',
  '/products/kids_caftan_green.jpg',
  '/products/kids_linen_set.jpg'
];

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to database.');

    const res = await client.query('SELECT id FROM "Product" ORDER BY id ASC');
    
    for (let i = 0; i < res.rows.length; i++) {
      const id = res.rows[i].id;
      
      const primaryImage = localImages[i % localImages.length];
      const secondImage = localImages[(i + 1) % localImages.length];
      const thirdImage = localImages[(i + 2) % localImages.length];
      
      const imageUrls = JSON.stringify([primaryImage, secondImage, thirdImage]);
      
      await client.query(
        'UPDATE "Product" SET image = $1, "imageUrls" = $2 WHERE id = $3',
        [primaryImage, imageUrls, id]
      );
    }

    console.log('Local images updated successfully!');
    client.release();
  } catch (error) {
    console.error('Error updating images:', error);
  } finally {
    pool.end();
  }
}

main();
