import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const products = [
  {
    name: "Royal Blue Kids Caftan",
    price: "45.00",
    regularPrice: "55.00",
    salePrice: "45.00",
    image: "https://images.unsplash.com/photo-1519238263530-99abad672f22?w=800&q=80",
    imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1519238263530-99abad672f22?w=800&q=80"]),
    category: "Caftans",
    description: "Elegant royal blue caftan with gold embroidery perfect for special occasions. Tailored for comfort and style.",
    isFeatured: true,
  },
  {
    name: "White Cotton Summer Dress",
    price: "30.00",
    regularPrice: "30.00",
    salePrice: null,
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80",
    imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80"]),
    category: "Dresses",
    description: "Light and breezy white cotton dress for warm summer days. Breathable fabric ensuring all-day comfort.",
    isFeatured: true,
  },
  {
    name: "Traditional Moroccan Boys Caftan",
    price: "55.00",
    regularPrice: "65.00",
    salePrice: "55.00",
    image: "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=800&q=80",
    imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=800&q=80"]),
    category: "Caftans",
    description: "Authentic two-piece Moroccan style caftan for boys. Features intricate detailing and a premium finish.",
    isFeatured: false,
  },
  {
    name: "Floral Girl's Party Dress",
    price: "40.00",
    regularPrice: "40.00",
    salePrice: null,
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&q=80",
    imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&q=80"]),
    category: "Dresses",
    description: "Beautiful floral print dress with a comfortable inner lining. Perfect for birthday parties and family gatherings.",
    isFeatured: true,
  },
  {
    name: "Green Silk Caftan for Girls",
    price: "65.00",
    regularPrice: "80.00",
    salePrice: "65.00",
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80",
    imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80"]),
    category: "Caftans",
    description: "Luxurious emerald green silk caftan with delicate details. A showstopper for any festive occasion.",
    isFeatured: true,
  },
  {
    name: "Boys Linen Shirt and Pants Set",
    price: "35.00",
    regularPrice: "35.00",
    salePrice: null,
    image: "https://images.unsplash.com/photo-1471286174890-9c11241eb958?w=800&q=80",
    imageUrls: JSON.stringify(["https://images.unsplash.com/photo-1471286174890-9c11241eb958?w=800&q=80"]),
    category: "Sets",
    description: "Comfortable and stylish linen set for boys. Easy to wear and perfect for both casual and formal outings.",
    isFeatured: false,
  }
];

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to database.');

    console.log('Deleting all existing products...');
    await client.query('DELETE FROM "Product"');

    console.log('Inserting kids clothing products...');
    for (const p of products) {
      await client.query(`
        INSERT INTO "Product" (
          name, price, "regularPrice", "salePrice", image, "imageUrls", category, description, "isFeatured"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [p.name, p.price, p.regularPrice, p.salePrice, p.image, p.imageUrls, p.category, p.description, p.isFeatured]);
    }

    console.log('Seeding complete!');
    client.release();
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    pool.end();
  }
}

main();
