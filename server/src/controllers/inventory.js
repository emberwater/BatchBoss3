const inv = require("../models/inventory");
const tables = { ingredients: "ingredients", packaging: "packaging", fragrances: "fragrances" };
function list(req, res) { const t = tables[req.params.type]; if (!t) return res.status(400).json({ error: "Invalid type" }); res.json(inv.list(t)); }
function create(req, res) {
  const t = tables[req.params.type]; if (!t) return res.status(400).json({ error: "Invalid type" });
  try {
    const b = req.body || {}; if (!b.unit && req.params.type === "fragrances") b.unit = "oz";
    const row = inv.upsertAdd(t, { name: b.name, supplier: b.supplier, unit: b.unit || "each", on_hand: Number(b.on_hand || 0), min_level: Number(b.min_level || 0), cost_per_unit: Number(b.cost_per_unit || 0) });
    res.status(201).json(row);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
function update(req, res) {
  const t = tables[req.params.type]; if (!t) return res.status(400).json({ error: "Invalid type" });
  try {
    const patch = Object.assign({}, req.body || {});
    if (patch.on_hand != null) patch.on_hand = Number(patch.on_hand);
    if (patch.min_level != null) patch.min_level = Number(patch.min_level);
    if (patch.cost_per_unit != null) patch.cost_per_unit = Number(patch.cost_per_unit);
    res.json(inv.update(t, Number(req.params.id), patch));
  } catch (e) { res.status(400).json({ error: e.message }); }
}
module.exports = { list, create, update };