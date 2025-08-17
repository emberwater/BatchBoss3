const db = require("../db");

function listProducts() { return db.prepare("SELECT * FROM products ORDER BY name").all(); }
function createOrUpdateProduct(row) {
  const name = row.name, size = row.size, sku = row.sku || null;
  const list_price = Number(row.list_price || 0);
  if (!name || !size) throw new Error("name and size are required");
  const existing = db.prepare("SELECT * FROM products WHERE sku = ? OR (name = ? AND size = ?)").get(sku, name, size);
  if (existing) {
    db.prepare("UPDATE products SET name=?, size=?, sku=?, list_price=? WHERE id=?").run(name, size, sku, list_price, existing.id);
    return db.prepare("SELECT * FROM products WHERE id=?").get(existing.id);
  }
  const info = db.prepare("INSERT INTO products (name,size,sku,list_price) VALUES (?,?,?,?)").run(name, size, sku, list_price);
  return { id: info.lastInsertRowid, name, size, sku, list_price };
}
function upsertRecipeItem(product_id, kind, ref_id, amount_per_unit, unit, placeholder_key) {
  if (kind === "packaging_placeholder") {
    const exists = db.prepare("SELECT id FROM recipe_items WHERE product_id=? AND kind='packaging_placeholder' AND placeholder_key=?").get(product_id, placeholder_key);
    if (exists) {
      db.prepare("UPDATE recipe_items SET amount_per_unit=?, unit=? WHERE id=?").run(amount_per_unit, unit, exists.id);
      return exists.id;
    }
    return db.prepare("INSERT INTO recipe_items (product_id, kind, amount_per_unit, unit, placeholder_key) VALUES (?,?,?,?,?)")
      .run(product_id, kind, amount_per_unit, unit, placeholder_key).lastInsertRowid;
  } else {
    const exists = db.prepare("SELECT id FROM recipe_items WHERE product_id=? AND kind=? AND ref_id=?").get(product_id, kind, ref_id);
    if (exists) {
      db.prepare("UPDATE recipe_items SET amount_per_unit=?, unit=? WHERE id=?").run(amount_per_unit, unit, exists.id);
      return exists.id;
    }
    return db.prepare("INSERT INTO recipe_items (product_id, kind, ref_id, amount_per_unit, unit) VALUES (?,?,?,?,?)")
      .run(product_id, kind, ref_id, amount_per_unit, unit).lastInsertRowid;
  }
}
function upsertRecipe(product_id, items) {
  const tx = db.transaction((items)=>{ for (const it of items) upsertRecipeItem(product_id, it.kind, it.ref_id || null, Number(it.amount_per_unit || 0), it.unit || "each", it.placeholder_key || null); });
  tx(items); return items;
}
function getRecipe(product_id) {
  return db.prepare(`SELECT ri.*, CASE
    WHEN ri.kind='ingredient' THEN (SELECT name FROM ingredients WHERE id=ri.ref_id)
    WHEN ri.kind='packaging' THEN (SELECT name FROM packaging WHERE id=ri.ref_id)
    WHEN ri.kind='fragrance' THEN (SELECT name FROM fragrances WHERE id=ri.ref_id)
    WHEN ri.kind='fragrance_variable' THEN 'Selected Fragrance (variable)'
    WHEN ri.kind='packaging_placeholder' THEN printf('Placeholder:%s', ri.placeholder_key)
  END as ref_name FROM recipe_items ri WHERE product_id=? ORDER BY kind, ref_name`).all(product_id);
}
function deleteRecipeItem(product_id, itemId) {
  const row = db.prepare("SELECT * FROM recipe_items WHERE id=? AND product_id=?").get(itemId, product_id);
  if (!row) return false; db.prepare("DELETE FROM recipe_items WHERE id=?").run(itemId); return true;
}
function updateRecipeItem(product_id, itemId, patch) {
  const row = db.prepare("SELECT * FROM recipe_items WHERE id=? AND product_id=?").get(itemId, product_id);
  if (!row) throw new Error("Recipe item not found");
  const next = {
    kind: patch.kind != null ? patch.kind : row.kind,
    ref_id: patch.ref_id != null ? Number(patch.ref_id) : row.ref_id,
    amount_per_unit: patch.amount_per_unit != null ? Number(patch.amount_per_unit) : row.amount_per_unit,
    unit: patch.unit != null ? patch.unit : row.unit,
    placeholder_key: patch.placeholder_key != null ? patch.placeholder_key : row.placeholder_key
  };
  db.prepare("UPDATE recipe_items SET kind=?, ref_id=?, amount_per_unit=?, unit=?, placeholder_key=? WHERE id=?")
    .run(next.kind, next.ref_id, next.amount_per_unit, next.unit, next.placeholder_key, itemId);
  return true;
}
function replaceRecipeItem(product_id, itemId, it) {
  const tx = db.transaction(()=>{ db.prepare("DELETE FROM recipe_items WHERE id=? AND product_id=?").run(itemId, product_id);
    upsertRecipeItem(product_id, it.kind, it.ref_id || null, Number(it.amount_per_unit || 0), it.unit || "each", it.placeholder_key || null); });
  tx(); return true;
}
function listVariants(product_id) { return db.prepare("SELECT * FROM product_variants WHERE product_id=? ORDER BY label").all(product_id); }
function createVariant(product_id, v) {
  const info = db.prepare("INSERT INTO product_variants (product_id,label,sku,size_value,size_factor,list_price_override) VALUES (?,?,?,?,?,?)")
    .run(product_id, v.label, v.sku || null, v.size_value != null ? Number(v.size_value) : null, Number(v.size_factor || 1.0), v.list_price_override != null ? Number(v.list_price_override) : null);
  return db.prepare("SELECT * FROM product_variants WHERE id=?").get(info.lastInsertRowid);
}
function updateVariant(variant_id, patch) {
  const v = db.prepare("SELECT * FROM product_variants WHERE id=?").get(variant_id);
  if (!v) throw new Error("Variant not found");
  const next = {
    label: patch.label != null ? patch.label : v.label,
    sku: patch.sku != null ? patch.sku : v.sku,
    size_value: patch.size_value != null ? Number(patch.size_value) : v.size_value,
    size_factor: patch.size_factor != null ? Number(patch.size_factor) : v.size_factor,
    list_price_override: patch.list_price_override != null ? Number(patch.list_price_override) : v.list_price_override
  };
  db.prepare("UPDATE product_variants SET label=?, sku=?, size_value=?, size_factor=?, list_price_override=? WHERE id=?")
    .run(next.label, next.sku, next.size_value, next.size_factor, next.list_price_override, variant_id);
  return db.prepare("SELECT * FROM product_variants WHERE id=?").get(variant_id);
}
function mapVariantPackaging(variant_id, placeholder_key, packaging_id) {
  const exists = db.prepare("SELECT id FROM variant_packaging_map WHERE variant_id=? AND placeholder_key=?").get(variant_id, placeholder_key);
  if (exists) { db.prepare("UPDATE variant_packaging_map SET packaging_id=? WHERE id=?").run(packaging_id, exists.id); return exists.id; }
  return db.prepare("INSERT INTO variant_packaging_map (variant_id, placeholder_key, packaging_id) VALUES (?,?,?)").run(variant_id, placeholder_key, packaging_id).lastInsertRowid;
}
function getVariantPackagingMap(variant_id) { return db.prepare("SELECT * FROM variant_packaging_map WHERE variant_id=?").all(variant_id); }
function computeUnitCost(product_id, variant_id) {
  const recipe = db.prepare("SELECT * FROM recipe_items WHERE product_id=?").all(product_id);
  let size_factor = 1.0; const mapping = {};
  if (variant_id) {
    const v = db.prepare("SELECT * FROM product_variants WHERE id=?").get(variant_id);
    if (v) size_factor = Number(v.size_factor || 1.0);
    const maps = db.prepare("SELECT * FROM variant_packaging_map WHERE variant_id=?").all(variant_id);
    for (const m of maps) mapping[m.placeholder_key] = m.packaging_id;
  }
  let cost = 0;
  for (const r of recipe) {
    const amt = Number(r.amount_per_unit) * size_factor;
    if (r.kind === "ingredient") {
      const it = db.prepare("SELECT cost_per_unit FROM ingredients WHERE id=?").get(r.ref_id);
      if (it) cost += amt * Number(it.cost_per_unit || 0);
    } else if (r.kind === "packaging") {
      const it = db.prepare("SELECT cost_per_unit FROM packaging WHERE id=?").get(r.ref_id);
      if (it) cost += amt * Number(it.cost_per_unit || 0);
    } else if (r.kind === "fragrance") {
      const it = db.prepare("SELECT cost_per_unit FROM fragrances WHERE id=?").get(r.ref_id);
      if (it) cost += amt * Number(it.cost_per_unit || 0);
    } else if (r.kind === "packaging_placeholder") {
      const pkgId = mapping[r.placeholder_key];
      if (pkgId) {
        const it = db.prepare("SELECT cost_per_unit FROM packaging WHERE id=?").get(pkgId);
        if (it) cost += amt * Number(it.cost_per_unit || 0);
      }
    } else if (r.kind === "fragrance_variable") {
      // cost depends on chosen scent at batch time; ignore for base calc
    }
  }
  return cost;
}
module.exports = {
  listProducts, createOrUpdateProduct, upsertRecipeItem, upsertRecipe, getRecipe,
  deleteRecipeItem, updateRecipeItem, replaceRecipeItem,
  listVariants, createVariant, updateVariant, mapVariantPackaging, getVariantPackagingMap,
  computeUnitCost
};