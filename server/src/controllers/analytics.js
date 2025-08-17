const db = require("../db");

function topProducts(req, res) {
  const days = Number(req.query.days || 30);
  const rows = db.prepare(`
    SELECT p.name, p.size, COALESCE(v.label,'') AS variant, SUM(b.quantity) AS qty
    FROM batch_log b
    LEFT JOIN products p ON p.id=b.product_id
    LEFT JOIN product_variants v ON v.id=b.variant_id
    WHERE datetime(b.created_at) >= datetime('now', ?)
    GROUP BY b.product_id, b.variant_id
    ORDER BY qty DESC LIMIT 50
  `).all(`-${days} days`);
  res.json(rows);
}

function expandUsage(batches) {
  const usage = { ingredients:{}, packaging:{}, fragrances:{} };
  for (const b of batches) {
    const recipe = db.prepare("SELECT * FROM recipe_items WHERE product_id=?").all(b.product_id);
    let factor = 1.0; const map = {};
    if (b.variant_id) {
      const v = db.prepare("SELECT * FROM product_variants WHERE id=?").get(b.variant_id);
      if (v) factor = Number(v.size_factor || 1.0);
      const maps = db.prepare("SELECT * FROM variant_packaging_map WHERE variant_id=?").all(b.variant_id);
      for (const m of maps) map[m.placeholder_key] = m.packaging_id;
    }
    for (const r of recipe) {
      const amt = Number(r.amount_per_unit) * factor * Number(b.quantity);
      if (r.kind === "ingredient") usage.ingredients[r.ref_id] = (usage.ingredients[r.ref_id] || 0) + amt;
      else if (r.kind === "packaging") usage.packaging[r.ref_id] = (usage.packaging[r.ref_id] || 0) + amt;
      else if (r.kind === "fragrance") usage.fragrances[r.ref_id] = (usage.fragrances[r.ref_id] || 0) + amt;
      else if (r.kind === "packaging_placeholder") {
        const pkgId = map[r.placeholder_key];
        if (pkgId) usage.packaging[pkgId] = (usage.packaging[pkgId] || 0) + amt;
      } else if (r.kind === "fragrance_variable") {
        if (b.fragrance_id) usage.fragrances[b.fragrance_id] = (usage.fragrances[b.fragrance_id] || 0) + amt;
      }
    }
  }
  return usage;
}

function topUsage(req, res) {
  const days = Number(req.query.days || 30);
  const batches = db.prepare("SELECT * FROM batch_log WHERE datetime(created_at) >= datetime('now', ?)").all(`-${days} days`);
  const usage = expandUsage(batches);
  function attach(table, map) {
    const out = [];
    for (const id of Object.keys(map)) {
      const row = db.prepare(`SELECT name, unit FROM ${table} WHERE id=?`).get(Number(id));
      out.push({ id: Number(id), name: row?.name || `id:${id}`, unit: row?.unit || "", used: map[id] });
    }
    out.sort((a,b)=>b.used-a.used);
    return out.slice(0,50);
  }
  res.json({ ingredients: attach("ingredients", usage.ingredients), packaging: attach("packaging", usage.packaging), fragrances: attach("fragrances", usage.fragrances) });
}

function forecast(req, res) {
  const horizon = Number(req.query.horizon || 30);
  const lookback = Number(req.query.lookback || 60);
  const batches = db.prepare("SELECT * FROM batch_log WHERE datetime(created_at) >= datetime('now', ?)").all(`-${lookback} days`);
  const usage = expandUsage(batches);

  function build(table, map) {
    const results = [];
    for (const id of Object.keys(map)) {
      const total = map[id]; const avg = total / Math.max(1, lookback); const need = avg * horizon;
      const stock = db.prepare(`SELECT name, unit, on_hand, min_level FROM ${table} WHERE id=?`).get(Number(id)) || {};
      const projected = (stock.on_hand || 0) - need;
      const suggest = projected < (stock.min_level || 0) ? Math.ceil((stock.min_level || 0) - projected) : 0;
      results.push({ table, id: Number(id), name: stock.name || `id:${id}`, unit: stock.unit || "", avg_daily_usage: avg, projected_need: need, on_hand: stock.on_hand || 0, projected_after_horizon: projected, reorder_point: stock.min_level || 0, suggest_order: suggest });
    }
    return results;
  }
  const rows = [ ...build("ingredients", usage.ingredients), ...build("packaging", usage.packaging), ...build("fragrances", usage.fragrances) ];
  res.json(rows);
}
module.exports = { topProducts, topUsage, forecast };