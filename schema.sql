-- Grabnext D1 Schema
-- Run with: npx wrangler d1 execute grabnow_db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  imageUrl TEXT,
  productCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  originalPrice REAL,
  category TEXT NOT NULL,
  tags TEXT,
  imageUrl TEXT,
  downloadUrl TEXT,
  isActive INTEGER DEFAULT 1,
  salesCount INTEGER DEFAULT 0,
  pageCode TEXT,
  pageType TEXT DEFAULT 'shop',
  createdBy TEXT,
  displayOrder INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userEmail TEXT,
  userName TEXT,
  userPhone TEXT,
  items TEXT NOT NULL,
  totalAmount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  paymentId TEXT,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  passwordHash TEXT,
  displayName TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  isGuest INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_isActive ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_products_displayOrder ON products(displayOrder);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_reviews_productId ON reviews(productId);
