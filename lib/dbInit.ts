import { pool } from '@/lib/db';

let dbInitPromise: Promise<void> | null = null;

export function ensureDbInitialized() {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    const client = await pool.connect();

    try {
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
          "showStockOnProductPage" BOOLEAN NOT NULL DEFAULT FALSE,
          stock INTEGER,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

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
          "communicationCredits" INTEGER NOT NULL DEFAULT 0,
          "smsCredits" INTEGER NOT NULL DEFAULT 0,
          "emailCredits" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

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
          "userProfileId" INTEGER REFERENCES "UserProfile"(id) ON DELETE SET NULL,
          "paymentReference" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "OrderItem" (
          id SERIAL PRIMARY KEY,
          "orderId" INTEGER NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
          "productId" INTEGER REFERENCES "Product"(id) ON DELETE SET NULL,
          "productName" VARCHAR(255) NOT NULL,
          "variationKey" TEXT,
          "variationLabel" TEXT,
          price NUMERIC(12,2) NOT NULL,
          quantity INTEGER NOT NULL,
          "lineTotal" NUMERIC(12,2) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "UserSession" (
          id SERIAL PRIMARY KEY,
          "userProfileId" INTEGER NOT NULL REFERENCES "UserProfile"(id) ON DELETE CASCADE,
          "tokenHash" TEXT NOT NULL UNIQUE,
          "expiresAt" TIMESTAMP NOT NULL,
          "lastSeenAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "PasswordReset" (
          id SERIAL PRIMARY KEY,
          "userProfileId" INTEGER NOT NULL REFERENCES "UserProfile"(id) ON DELETE CASCADE,
          "codeHash" TEXT NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "usedAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
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
        )
      `);

      await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS scope VARCHAR(50)');
      await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS identifier VARCHAR(255)');
      await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0');
      await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "windowStart" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
      await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP');
      await client.query('ALTER TABLE "PasswordResetThrottle" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

      await client.query(`
        CREATE TABLE IF NOT EXISTS "Category" (
          id SERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          slug VARCHAR(140) NOT NULL UNIQUE,
          "imageUrl" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT');
      await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "regularPrice" VARCHAR(50)');
      await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "salePrice" VARCHAR(50)');
      await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hasVariations" BOOLEAN NOT NULL DEFAULT FALSE');
      await client.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS variations JSONB NOT NULL DEFAULT '[]'::jsonb`);
      await client.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" JSONB NOT NULL DEFAULT '[]'::jsonb`);
      await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS stock INTEGER');
      await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "showStockOnProductPage" BOOLEAN NOT NULL DEFAULT FALSE');
      await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentCompleted" BOOLEAN NOT NULL DEFAULT FALSE');
      await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT');
      await client.query('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variationKey" TEXT');
      await client.query('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variationLabel" TEXT');
      await client.query('ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "communicationCredits" INTEGER NOT NULL DEFAULT 0');
      await client.query('ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "smsCredits" INTEGER NOT NULL DEFAULT 0');
      await client.query('ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "emailCredits" INTEGER NOT NULL DEFAULT 0');

      await client.query(`
        CREATE TABLE IF NOT EXISTS "CommunicationCreditTopup" (
          id SERIAL PRIMARY KEY,
          "userProfileId" INTEGER NOT NULL REFERENCES "UserProfile"(id) ON DELETE CASCADE,
          reference TEXT NOT NULL UNIQUE,
          channel VARCHAR(20) NOT NULL DEFAULT 'sms',
          amount NUMERIC(12,2) NOT NULL,
          credits INTEGER NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS "CommunicationCreditBalance" (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          "smsCredits" INTEGER NOT NULL DEFAULT 0,
          "emailCredits" INTEGER NOT NULL DEFAULT 0,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        INSERT INTO "CommunicationCreditBalance" (id, "smsCredits", "emailCredits", "updatedAt")
        SELECT
          1,
          COALESCE(SUM(CASE WHEN role = 'admin' THEN COALESCE("smsCredits", 0) ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN role = 'admin' THEN COALESCE("emailCredits", 0) ELSE 0 END), 0),
          CURRENT_TIMESTAMP
        FROM "UserProfile"
        ON CONFLICT (id) DO NOTHING
      `);
      await client.query("ALTER TABLE \"CommunicationCreditTopup\" ADD COLUMN IF NOT EXISTS channel VARCHAR(20) NOT NULL DEFAULT 'sms'");

      await client.query('CREATE INDEX IF NOT EXISTS "idx_product_category_lower" ON "Product" (LOWER(category))');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_product_category_lower_id_desc" ON "Product" (LOWER(category), id DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_product_isFeatured" ON "Product" ("isFeatured")');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_category_name" ON "Category" (name)');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_product_updated_at" ON "Product" ("updatedAt" DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_order_user_profile" ON "Order" ("userProfileId")');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_order_phone_created_at" ON "Order" (phone, "createdAt" DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_order_item_order_id" ON "OrderItem" ("orderId")');
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_order_payment_reference_unique" ON "Order" ("paymentReference") WHERE "paymentReference" IS NOT NULL');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_credit_topup_user_created" ON "CommunicationCreditTopup" ("userProfileId", "createdAt" DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_credit_topup_user_channel_created" ON "CommunicationCreditTopup" ("userProfileId", channel, "createdAt" DESC)');
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_password_reset_throttle_scope_identifier" ON "PasswordResetThrottle" (scope, identifier)');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_password_reset_throttle_lock_until" ON "PasswordResetThrottle" ("lockUntil")');
      await client.query('CREATE INDEX IF NOT EXISTS "idx_password_reset_throttle_updated_at" ON "PasswordResetThrottle" ("updatedAt")');

      await client.query(`
        CREATE TABLE IF NOT EXISTS "SupportMessage" (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'open',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query('CREATE INDEX IF NOT EXISTS "idx_supportmessage_createdat" ON "SupportMessage" ("createdAt" DESC)');
    } finally {
      client.release();
    }
  })().catch(error => {
    dbInitPromise = null;
    throw error;
  });

  return dbInitPromise;
}
