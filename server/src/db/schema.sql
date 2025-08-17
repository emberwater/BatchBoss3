
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  supplier TEXT,
  unit TEXT NOT NULL,
  on_hand REAL NOT NULL DEFAULT 0,
  min_level REAL NOT NULL DEFAULT 0,
  cost_per_unit REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS packaging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  supplier TEXT,
  unit TEXT NOT NULL DEFAULT 'each',
  on_hand REAL NOT NULL DEFAULT 0,
  min_level REAL NOT NULL DEFAULT 0,
  cost_per_unit REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fragrances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  supplier TEXT,
  unit TEXT NOT NULL DEFAULT 'oz',
  on_hand REAL NOT NULL DEFAULT 0,
  min_level REAL NOT NULL DEFAULT 0,
  cost_per_unit REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  sku TEXT UNIQUE,
  list_price REAL DEFAULT 0,
  CONSTRAINT uq_product UNIQUE(name, size)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sku TEXT UNIQUE,
  size_value REAL,
  size_factor REAL NOT NULL DEFAULT 1.0,
  list_price_override REAL
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('ingredient','packaging','fragrance','fragrance_variable','packaging_placeholder')),
  ref_id INTEGER,
  amount_per_unit REAL NOT NULL,
  unit TEXT NOT NULL,
  placeholder_key TEXT
);

CREATE TABLE IF NOT EXISTS variant_packaging_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  placeholder_key TEXT NOT NULL,
  packaging_id INTEGER NOT NULL REFERENCES packaging(id),
  UNIQUE(variant_id, placeholder_key)
);

CREATE TABLE IF NOT EXISTS batch_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER,
  fragrance_id INTEGER,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  note TEXT
);
