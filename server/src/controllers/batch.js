const db = require("../db");
const { addBatch, listBatches } = require("../models/batch");

function applyDeductions(product_id, variant_id, fragrance_id, quantity) {
  const recipe = db.prepare("SELECT * FROM recipe_items WHERE product_id=?").all(product_id);
  let factor = 1.0; const mapping = {};
  if (variant_id) {
    const v = db.prepare("SELECT * FROM product_variants WHERE id=?").get(variant_id);
    if (v) factor = Number(v.size_factor || 1.0);
    const maps = db.prepare("SELECT * FROM variant_packaging_map WHERE variant_id=?").all(variant_id);
    for (const m of maps) mapping[m.placeholder_key] = m.packaging_id;
  }
  const missing = [];
  for (const r of recipe) {
    const needed = Number(r.amount_per_unit) * factor * Number(quantity);
    let table = null, id = null;
    if (r.kind === "ingredient") { table="ingredients"; id=r.ref_id; }
    else if (r.kind === "packaging") { table="packaging"; id=r.ref_id; }
    else if (r.kind === "fragrance") { table="fragrances"; id=r.ref_id; }
    else if (r.kind === "packaging_placeholder") { table="packaging"; id=mapping[r.placeholder_key]; }
    else if (r.kind === "fragrance_variable") { table="fragrances"; id=fragrance_id; }
    if (!table || !id) continue;
    const row = db.prepare(`SELECT on_hand, name FROM ${table} WHERE id=?`).get(id);
    const next = (row?.on_hand || 0) - needed;
    if (next < -1e-9) missing.push(`${table}:${row?.name} need ${needed}, have ${row?.on_hand}`);
  }
  if (missing.length) throw new Error("Insufficient inventory: " + missing.join("; "));
  const tx = db.transaction(()=>{
    for (const r of recipe) {
      const needed = Number(r.amount_per_unit) * factor * Number(quantity);
      let table = null, id = null;
      if (r.kind === "ingredient") { table="ingredients"; id=r.ref_id; }
      else if (r.kind === "packaging") { table="packaging"; id=r.ref_id; }
      else if (r.kind === "fragrance") { table="fragrances"; id=r.ref_id; }
      else if (r.kind === "packaging_placeholder") { table="packaging"; id=mapping[r.placeholder_key]; }
      else if (r.kind === "fragrance_variable") { table="fragrances"; id=fragrance_id; }
      if (!table || !id) continue;
      db.prepare(`UPDATE ${table} SET on_hand = on_hand - ? WHERE id=?`).run(needed, id);
    }
  });
  tx();
}

function create(req, res) {
  try {
    const b = req.body || {};
    if (!b.product_id || !b.quantity) return res.status(400).json({ error: "product_id and quantity are required" });
    applyDeductions(Number(b.product_id), b.variant_id ? Number(b.variant_id) : null, b.fragrance_id ? Number(b.fragrance_id) : null, Number(b.quantity));
    const id = addBatch({ product_id: Number(b.product_id), variant_id: b.variant_id ? Number(b.variant_id) : null, fragrance_id: b.fragrance_id ? Number(b.fragrance_id) : null, quantity: Number(b.quantity), note: b.note || null });
    res.status(201).json({ id });
  } catch (e) { res.status(400).json({ error: e.message }); }
}
function list(req, res) { res.json(listBatches()); }
module.exports = { create, list };