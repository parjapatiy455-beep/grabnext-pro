-- GrabNext Full Migration — Run this to add ALL new tables and columns
-- Command: npx wrangler d1 execute grabnow_db --remote --file=migration.sql
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT COLUMN checks)

-- =============================================
-- 1. REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  userId TEXT,
  userName TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  createdAt INTEGER,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- 2. BANNERS TABLE (for admin-managed home banners)
-- =============================================
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  imageUrl TEXT,
  linkUrl TEXT,
  buttonText TEXT DEFAULT 'Shop Now',
  bgColor TEXT DEFAULT '#1e40af',
  isActive INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- =============================================
-- 3. ADD MISSING COLUMNS TO EXISTING TABLES
-- (Wrap in separate statements — D1 handles one at a time)
-- =============================================

-- Products: add originalPrice if missing
ALTER TABLE products ADD COLUMN originalPrice REAL;

-- Products: add slug for SEO-friendly URLs
ALTER TABLE products ADD COLUMN slug TEXT;

-- Products: add images JSON column
ALTER TABLE products ADD COLUMN images TEXT;

-- Products: add pageType for landing page toggle
ALTER TABLE products ADD COLUMN pageType TEXT DEFAULT 'shop';

-- Products: add pageCode for landing page content JSON
ALTER TABLE products ADD COLUMN pageCode TEXT;

-- Products: add displayOrder for custom sorting
ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0;

-- =============================================
-- 5. LANDING PAGE ANALYTICS & FORM SUBMISSIONS
-- =============================================

-- Landing page analytics events (views, clicks)
CREATE TABLE IF NOT EXISTS lp_analytics (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productSlug TEXT,
  event TEXT NOT NULL,
  data TEXT,
  ip TEXT,
  createdAt INTEGER
);

-- Form submissions from landing pages
CREATE TABLE IF NOT EXISTS lp_form_submissions (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productTitle TEXT,
  fields TEXT NOT NULL,
  ip TEXT,
  createdAt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_lp_analytics_productId ON lp_analytics(productId);
CREATE INDEX IF NOT EXISTS idx_lp_submissions_productId ON lp_form_submissions(productId);

-- Orders: add guest info columns
ALTER TABLE orders ADD COLUMN userEmail TEXT;
ALTER TABLE orders ADD COLUMN userName TEXT;
ALTER TABLE orders ADD COLUMN userPhone TEXT;

-- Users: add extra profile fields
ALTER TABLE users ADD COLUMN state TEXT;
ALTER TABLE users ADD COLUMN isGuest INTEGER DEFAULT 0;

-- Categories: make sure imageUrl exists
ALTER TABLE categories ADD COLUMN imageUrl TEXT;

-- =============================================
-- 4. PERFORMANCE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_isActive ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_products_displayOrder ON products(displayOrder);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_reviews_productId ON reviews(productId);
CREATE INDEX IF NOT EXISTS idx_banners_isActive ON banners(isActive);
CREATE INDEX IF NOT EXISTS idx_banners_sortOrder ON banners(sortOrder);
