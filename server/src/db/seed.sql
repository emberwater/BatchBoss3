
INSERT OR IGNORE INTO ingredients (name, supplier, unit, on_hand, min_level, cost_per_unit) VALUES
('Distilled Water', 'Local', 'oz', 1024, 128, 0.01),
('Witch Hazel', 'Supplier A', 'oz', 256, 64, 0.05);

INSERT OR IGNORE INTO packaging (name, supplier, unit, on_hand, min_level, cost_per_unit) VALUES
('16 oz Amber Bottle', 'PackCo', 'each', 200, 50, 0.95),
('16 oz Black Bottle', 'PackCo', 'each', 200, 50, 0.95),
('Trigger Sprayer', 'PackCo', 'each', 220, 50, 0.42),
('3x3 Label', 'PrintHouse', 'each', 1000, 200, 0.06);

INSERT OR IGNORE INTO fragrances (name, supplier, unit, on_hand, min_level, cost_per_unit) VALUES
('Wild Ride', 'FO Mart', 'oz', 64, 10, 1.80),
('Main Character Energy', 'FO Mart', 'oz', 64, 10, 1.90);

INSERT OR IGNORE INTO products (name, size, sku, list_price) VALUES
('Room & Linen Spray', '16 oz', 'RLS-16', 14.00);

INSERT INTO recipe_items (product_id, kind, amount_per_unit, unit) 
SELECT p.id, 'fragrance_variable', 1.2, 'oz' FROM products p WHERE p.sku='RLS-16';

INSERT INTO recipe_items (product_id, kind, placeholder_key, amount_per_unit, unit) 
SELECT p.id, 'packaging_placeholder', 'bottle_color', 1, 'each' FROM products p WHERE p.sku='RLS-16';

INSERT INTO recipe_items (product_id, kind, ref_id, amount_per_unit, unit)
SELECT p.id, 'packaging', pk.id, 1, 'each' FROM products p, packaging pk WHERE p.sku='RLS-16' AND pk.name='Trigger Sprayer';

INSERT INTO recipe_items (product_id, kind, ref_id, amount_per_unit, unit)
SELECT p.id, 'packaging', pk.id, 1, 'each' FROM products p, packaging pk WHERE p.sku='RLS-16' AND pk.name='3x3 Label';

INSERT INTO product_variants (product_id, label, sku, size_value, size_factor, list_price_override)
SELECT id, 'Amber 16 oz', 'RLS-16-AMB', 16, 1.0, NULL FROM products WHERE sku='RLS-16';
INSERT INTO product_variants (product_id, label, sku, size_value, size_factor, list_price_override)
SELECT id, 'Black 16 oz', 'RLS-16-BLK', 16, 1.0, NULL FROM products WHERE sku='RLS-16';

INSERT INTO variant_packaging_map (variant_id, placeholder_key, packaging_id)
SELECT v.id, 'bottle_color', (SELECT id FROM packaging WHERE name='16 oz Amber Bottle')
FROM product_variants v WHERE v.sku='RLS-16-AMB';

INSERT INTO variant_packaging_map (variant_id, placeholder_key, packaging_id)
SELECT v.id, 'bottle_color', (SELECT id FROM packaging WHERE name='16 oz Black Bottle')
FROM product_variants v WHERE v.sku='RLS-16-BLK';
