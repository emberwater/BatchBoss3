const db = require("../db");
function addBatch({ product_id, variant_id, fragrance_id, quantity, note }) {
  const info = db.prepare("INSERT INTO batch_log (product_id, variant_id, fragrance_id, quantity, note) VALUES (?,?,?,?,?)")
    .run(product_id, variant_id || null, fragrance_id || null, quantity, note || null);
  return info.lastInsertRowid;
}
function listBatches() {
  return db.prepare(`SELECT b.*, p.name as product_name, p.size as product_size, v.label as variant_label, f.name as fragrance_name
    FROM batch_log b
    LEFT JOIN products p ON p.id=b.product_id
    LEFT JOIN product_variants v ON v.id=b.variant_id
    LEFT JOIN fragrances f ON f.id=b.fragrance_id
    ORDER BY b.created_at DESC, b.id DESC`).all();
}
module.exports = { addBatch, listBatches };