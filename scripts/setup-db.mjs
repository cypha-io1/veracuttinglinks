import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Creating/updating products table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Product" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price VARCHAR(50) NOT NULL,
        "regularPrice" VARCHAR(50),
        "salePrice" VARCHAR(50),
        "hasVariations" BOOLEAN NOT NULL DEFAULT FALSE,
        variations JSONB NOT NULL DEFAULT '[]'::jsonb,
        image TEXT NOT NULL,
        "imageUrls" JSONB NOT NULL DEFAULT '[]'::jsonb,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        "isFeatured" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Handle existing tables from older app versions.
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS description TEXT');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "regularPrice" VARCHAR(50)');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "salePrice" VARCHAR(50)');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hasVariations" BOOLEAN NOT NULL DEFAULT FALSE');
    await client.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS variations JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await client.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await client.query('UPDATE "Product" SET "regularPrice" = price WHERE "regularPrice" IS NULL AND price IS NOT NULL');
    await client.query(`UPDATE "Product" SET "imageUrls" = jsonb_build_array(image) WHERE ("imageUrls" IS NULL OR jsonb_typeof("imageUrls") <> 'array' OR jsonb_array_length("imageUrls") = 0) AND image IS NOT NULL`);

    console.log('Creating/updating orders tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Order" (
        id SERIAL PRIMARY KEY,
        "orderNumber" VARCHAR(40) UNIQUE,
        "customerName" VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        address TEXT NOT NULL,
        city VARCHAR(120) NOT NULL,
        notes TEXT,
        "paymentMethod" VARCHAR(40) NOT NULL,
        "paymentCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(40) NOT NULL DEFAULT 'Pending',
        subtotal NUMERIC(12,2) NOT NULL,
        delivery NUMERIC(12,2) NOT NULL,
        total NUMERIC(12,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentCompleted" BOOLEAN NOT NULL DEFAULT FALSE');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        id SERIAL PRIMARY KEY,
        "orderId" INTEGER NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
        "productId" INTEGER REFERENCES "Product"(id) ON DELETE SET NULL,
        "productName" VARCHAR(255) NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        quantity INTEGER NOT NULL,
        "lineTotal" NUMERIC(12,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS order_item_order_id_idx ON "OrderItem" ("orderId")');

    console.log('Creating/updating user profiles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserProfile" (
        id SERIAL PRIMARY KEY,
        "fullName" VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL UNIQUE,
        role VARCHAR(40) NOT NULL DEFAULT 'user',
        "passwordHash" TEXT,
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(120),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("ALTER TABLE \"UserProfile\" ADD COLUMN IF NOT EXISTS role VARCHAR(40) NOT NULL DEFAULT 'user'");
    await client.query('ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT');

    // Normalize invalid roles and enforce strict role set.
    await client.query("UPDATE \"UserProfile\" SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'admin')");
    await client.query('ALTER TABLE "UserProfile" ALTER COLUMN role SET DEFAULT \'user\'');
    await client.query('ALTER TABLE "UserProfile" ALTER COLUMN role SET NOT NULL');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'user_profile_role_check'
            AND conrelid = '"UserProfile"'::regclass
        ) THEN
          ALTER TABLE "UserProfile"
          ADD CONSTRAINT user_profile_role_check
          CHECK (role IN ('user', 'admin'));
        END IF;
      END
      $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserSession" (
        id SERIAL PRIMARY KEY,
        "userProfileId" INTEGER NOT NULL REFERENCES "UserProfile"(id) ON DELETE CASCADE,
        "tokenHash" TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP NOT NULL,
        "lastSeenAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "PasswordReset" (
        id SERIAL PRIMARY KEY,
        "userProfileId" INTEGER NOT NULL REFERENCES "UserProfile"(id) ON DELETE CASCADE,
        "codeHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "PasswordResetThrottle" (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(50) NOT NULL,
        identifier VARCHAR(255) NOT NULL,
        "attemptCount" INTEGER NOT NULL DEFAULT 0,
        "windowStart" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lockUntil" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS scope VARCHAR(50)');
    await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS identifier VARCHAR(255)');
    await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0');
    await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "windowStart" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP');
    await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    await client.query('CREATE INDEX IF NOT EXISTS user_session_user_profile_id_idx ON "UserSession" ("userProfileId")');
    await client.query('CREATE INDEX IF NOT EXISTS password_reset_user_profile_id_idx ON "PasswordReset" ("userProfileId")');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_throttle_scope_identifier ON "PasswordResetThrottle" (scope, identifier)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_reset_throttle_lock_until ON "PasswordResetThrottle" ("lockUntil")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_reset_throttle_updated_at ON "PasswordResetThrottle" ("updatedAt")');

    console.log('Creating/updating categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(140) NOT NULL UNIQUE,
        "imageUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT');

    // Remove duplicate rows from earlier seed runs before adding uniqueness guard.
    await client.query(`
      DELETE FROM "Product" a
      USING "Product" b
      WHERE a.id > b.id
      AND LOWER(a.name) = LOWER(b.name)
      AND LOWER(a.category) = LOWER(b.category)
    `);

    // Prevent duplicate inserts across repeated seed runs.
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS product_name_category_unique_idx
      ON "Product" (LOWER(name), LOWER(category))
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_product_category_lower ON "Product" (LOWER(category))');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_category_lower_id_desc ON "Product" (LOWER(category), id DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_isFeatured ON "Product" ("isFeatured")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_category_name ON "Category" (name)');
    
    console.log('Seeding products...');
    const products = [
      { name: 'Straight Hair Wig', price: 'GH₵85', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', category: 'Wigs', description: 'Premium straight wig with natural volume and soft texture.', isFeatured: false },
      { name: 'Body Wave 24"', price: 'GH₵95', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', category: 'Wigs', description: '24 inch body wave unit with long-lasting bounce.', isFeatured: false },
      { name: 'Kinky Curly Bundle', price: 'GH₵120', image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&q=80', category: 'Bundles', description: 'Defined curls with dense volume and minimal shedding.', isFeatured: false },
      { name: 'Lace Frontal Wig', price: 'GH₵145', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', category: 'Wigs', description: 'Natural-looking frontal lace with breathable cap comfort.', isFeatured: false },
      { name: 'Hair Extensions', price: 'GH₵75', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', category: 'Extensions', description: 'Daily-wear extensions designed for easy styling.', isFeatured: false },
      { name: 'Premium Silk Wig', price: 'GH₵180', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', category: 'Premium', description: 'Silk-based premium line with elevated shine and softness.', isFeatured: false },
      { name: 'HD Lace Wig', price: 'GH₵190', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', category: 'Premium', description: 'Ultra-thin HD lace for a seamless scalp effect.', isFeatured: false },
      { name: 'Luxury Closure', price: 'GH₵145', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', category: 'Premium', description: 'High-grade closure with smooth, natural parting.', isFeatured: false },
      { name: 'Body Wave Bundle', price: 'GH₵135', image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&q=80', category: 'Bundles', description: 'Multi-bundle body wave set for full styling flexibility.', isFeatured: false },
      { name: 'Deep Wave 22"', price: 'GH₵105', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', category: 'Wigs', description: 'Deep wave texture for bold shape and movement.', isFeatured: false },
      { name: 'Straight Extensions Pack', price: 'GH₵85', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', category: 'Extensions', description: 'Sleek extensions that blend naturally and style fast.', isFeatured: false },
      { name: 'Curly Lace Wig', price: 'GH₵165', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', category: 'Premium', description: 'Premium curly lace wig with rich, springy definition.', isFeatured: false },
      { name: 'Margherita Pizza', price: 'GH₵42', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', category: 'Pizza', description: 'Classic tomato and mozzarella, baked fresh.', isFeatured: false },
      { name: 'Pepperoni Pizza', price: 'GH₵45', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', category: 'Pizza', description: 'Spicy pepperoni and gooey cheese on crispy crust.', isFeatured: true },
      { name: 'BBQ Chicken Pizza', price: 'GH₵48', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', category: 'Pizza', description: 'Smoky BBQ base with grilled chicken and onions.', isFeatured: true },
      { name: 'Vegetarian Pizza', price: 'GH₵40', image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400&q=80', category: 'Pizza', description: 'Loaded veggies and balanced seasoning.', isFeatured: false },
      { name: 'Hawaiian Pizza', price: 'GH₵46', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', category: 'Pizza', description: 'Pineapple and ham with sweet-savory flavor.', isFeatured: false },
      { name: 'Meat Lovers Pizza', price: 'GH₵52', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96f47?w=400&q=80', category: 'Pizza', description: 'Heavy meat topping for extra protein and flavor.', isFeatured: false },
      { name: 'Fried Chicken', price: 'GH₵35', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', category: 'Chicken', description: 'Crispy fried chicken with house seasoning.', isFeatured: true },
      { name: 'BBQ Wings', price: 'GH₵40', image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&q=80', category: 'Chicken', description: 'Sticky BBQ wings with charred finish.', isFeatured: false },
      { name: 'Grilled Chicken', price: 'GH₵38', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&q=80', category: 'Chicken', description: 'Lean grilled cuts with pepper herb rub.', isFeatured: false },
      { name: 'Chicken Tenders', price: 'GH₵32', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80', category: 'Chicken', description: 'Tender strips with crunchy coating.', isFeatured: false },
      { name: 'Spicy Wings', price: 'GH₵42', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80', category: 'Chicken', description: 'Hot wings with chili-forward glaze.', isFeatured: false },
      { name: 'Chicken Bucket', price: 'GH₵65', image: 'https://images.unsplash.com/photo-1569058242252-92bd747b78c2?w=400&q=80', category: 'Chicken', description: 'Family-sized bucket for sharing.', isFeatured: false },
      { name: 'French Fries', price: 'GH₵15', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', category: 'Sides', description: 'Golden fries with sea-salt finish.', isFeatured: false },
      { name: 'Chicken Burger', price: 'GH₵30', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', category: 'Sides', description: 'Juicy patty with fresh lettuce and sauce.', isFeatured: false },
      { name: 'Onion Rings', price: 'GH₵18', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80', category: 'Sides', description: 'Crunchy battered onion rings.', isFeatured: false },
      { name: 'Coleslaw', price: 'GH₵12', image: 'https://images.unsplash.com/photo-1610419913848-aeae5eae13e3?w=400&q=80', category: 'Sides', description: 'Creamy slaw for a cool side balance.', isFeatured: false },
      { name: 'Mozzarella Sticks', price: 'GH₵22', image: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&q=80', category: 'Sides', description: 'Cheesy fried sticks served hot.', isFeatured: false },
      { name: 'Garlic Bread', price: 'GH₵16', image: 'https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=400&q=80', category: 'Sides', description: 'Toasted bread with rich garlic butter.', isFeatured: false },
      { name: 'Family Package', price: 'GH₵120', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', category: 'Packages', description: 'Mixed meal package sized for families.', isFeatured: false },
      { name: 'Party Package', price: 'GH₵200', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', category: 'Packages', description: 'Party tray bundle for larger groups.', isFeatured: false },
      { name: 'Couple Package', price: 'GH₵80', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', category: 'Packages', description: 'Perfect mix for two people.', isFeatured: false },
      { name: 'Student Package', price: 'GH₵55', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', category: 'Packages', description: 'Affordable meal combo for students.', isFeatured: false },
      { name: 'Office Package', price: 'GH₵150', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96f47?w=400&q=80', category: 'Packages', description: 'Group package tuned for office lunches.', isFeatured: false },
      { name: 'Weekend Special', price: 'GH₵95', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', category: 'Packages', description: 'Weekend-only combo with extra sides.', isFeatured: false },
      { name: 'Coca Cola', price: 'GH₵8', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', category: 'Drinks', description: 'Chilled fizzy cola drink.', isFeatured: false },
      { name: 'Sprite', price: 'GH₵8', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80', category: 'Drinks', description: 'Lemon-lime soda served cold.', isFeatured: false },
      { name: 'Fanta', price: 'GH₵8', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&q=80', category: 'Drinks', description: 'Orange soda with bright citrus flavor.', isFeatured: false },
      { name: 'Bottled Water', price: 'GH₵5', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', category: 'Drinks', description: 'Still bottled water.', isFeatured: false },
      { name: 'Fresh Juice', price: 'GH₵12', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', category: 'Drinks', description: 'Fruit juice made fresh daily.', isFeatured: false },
      { name: 'Smoothie', price: 'GH₵18', image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80', category: 'Drinks', description: 'Thick blended smoothie for energy.', isFeatured: false },
      { name: 'Chocolate Cake', price: 'GH₵25', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', category: 'Desserts', description: 'Moist chocolate slice with rich frosting.', isFeatured: false },
      { name: 'Ice Cream', price: 'GH₵15', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', category: 'Desserts', description: 'Cold creamy scoop selection.', isFeatured: false },
      { name: 'Cheesecake', price: 'GH₵28', image: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400&q=80', category: 'Desserts', description: 'Smooth cheesecake with biscuit base.', isFeatured: false },
      { name: 'Brownie', price: 'GH₵20', image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400&q=80', category: 'Desserts', description: 'Dense cocoa brownie square.', isFeatured: false },
      { name: 'Apple Pie', price: 'GH₵22', image: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400&q=80', category: 'Desserts', description: 'Spiced apple pie slice.', isFeatured: false },
      { name: 'Donut Box', price: 'GH₵30', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80', category: 'Desserts', description: 'Assorted mini donuts in one box.', isFeatured: false },
    ];
    
    for (const product of products) {
      await client.query(
        `
          INSERT INTO "Product" (name, price, image, category, description, "isFeatured")
          SELECT $1::varchar, $2::varchar, $3::text, $4::varchar, $5::text, $6::boolean
          WHERE NOT EXISTS (
            SELECT 1 FROM "Product"
            WHERE LOWER(name) = LOWER($1::text) AND LOWER(category) = LOWER($4::text)
          )
        `,
        [product.name, product.price, product.image, product.category, product.description, product.isFeatured]
      );
    }
    
    console.log('✅ Database setup complete!');
    console.log(`✅ ${products.length} products seeded!`);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
