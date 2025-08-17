const db = require("../db");
function list(table) { return db.prepare(`SELECT * FROM ${table} ORDER BY name`).all(); }
function getById(table, id) { return db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id); }
function getByName(table, name) { return db.prepare(`SELECT * FROM ${table} WHERE lower(name)=lower(?)`).get(name); }
function upsertAdd(table, row) {
  const name = row.name; if (!name) throw new Error("name is required");
  const existing = getByName(table, name);
  if (existing) {
    const next = {
      supplier: row.supplier !== undefined ? row.supplier : existing.supplier,
      unit: row.unit !== undefined ? row.unit : existing.unit,
      min_level: row.min_level !== undefined ? Number(row.min_level) : existing.min_level,
      cost_per_unit: row.cost_per_unit !== undefined ? Number(row.cost_per_unit) : existing.cost_per_unit,
      on_hand: Number(existing.on_hand || 0) + Number(row.on_hand || 0)
    };
    db.prepare(`UPDATE ${table} SET supplier=?, unit=?, min_level=?, cost_per_unit=?, on_hand=? WHERE id=?`)
      .run(next.supplier || null, next.unit, next.min_level, next.cost_per_unit, next.on_hand, existing.id);
    return getById(table, existing.id);
  } else {
    const info = db.prepare(`INSERT INTO ${table} (name, supplier, unit, on_hand, min_level, cost_per_unit) VALUES (?,?,?,?,?,?)`)
      .run(name, row.supplier || null, row.unit || "each", Number(row.on_hand || 0), Number(row.min_level || 0), Number(row.cost_per_unit || 0));
    return getById(table, info.lastInsertRowid);
  }
}
function update(table, id, row) {
  const keys = Object.keys(row); if (keys.length === 0) return getById(table, id);
  const set = keys.map(k=>`${k}=?`).join(",");
  db.prepare(`UPDATE ${table} SET ${set} WHERE id=?`).run(...Object.values(row), id);
  return getById(table, id);
}
module.exports = { list, getById, getByName, upsertAdd, update };