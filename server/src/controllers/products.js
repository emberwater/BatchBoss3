const db = require("../db");
const products = require("../models/products");

function list(req, res) { res.json(products.listProducts()); }
function create(req, res) { try { res.status(201).json(products.createOrUpdateProduct(req.body || {})); } catch (e) { res.status(400).json({ error: e.message }); } }
function update(req, res) {
  try {
    const id = Number(req.params.id), row = db.prepare("SELECT * FROM products WHERE id=?").get(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const b = req.body || {};
    const nextName = (b.name !== undefined && b.name !== null) ? b.name : row.name;
    const nextSize = (b.size !== undefined && b.size !== null) ? b.size : row.size;
    const nextSku  = (b.sku  !== undefined && b.sku  !== null) ? b.sku  : row.sku;
    const nextList = (b.list_price !== undefined && b.list_price !== null) ? Number(b.list_price) : Number(row.list_price || 0);
    db.prepare("UPDATE products SET name=?, size=?, sku=?, list_price=? WHERE id=?").run(nextName, nextSize, nextSku || null, nextList, id);
    res.json(db.prepare("SELECT * FROM products WHERE id=?").get(id));
  } catch (e) { res.status(400).json({ error: e.message }); }
}
function recipe(req, res) { res.json(products.getRecipe(Number(req.params.id))); }
function upsertRecipe(req, res) { try { const items = Array.isArray(req.body.items) ? req.body.items : []; res.json({ updated: products.upsertRecipe(Number(req.params.id), items).length }); } catch (e) { res.status(400).json({ error: e.message }); } }
function deleteRecipeItem(req, res) { const ok = products.deleteRecipeItem(Number(req.params.id), Number(req.params.itemId)); if (!ok) return res.status(404).json({ error: "Recipe item not found" }); res.json({ deleted: true }); }
function updateRecipeItem(req, res) { try { products.updateRecipeItem(Number(req.params.id), Number(req.params.itemId), req.body || {}); res.json({ updated: true }); } catch (e) { res.status(400).json({ error: e.message }); } }
function replaceRecipeItem(req, res) { try { products.replaceRecipeItem(Number(req.params.id), Number(req.params.itemId), req.body || {}); res.json({ replaced: true }); } catch (e) { res.status(400).json({ error: e.message }); } }
function variants(req, res) { res.json(products.listVariants(Number(req.params.id))); }
function createVariant(req, res) { try { res.status(201).json(products.createVariant(Number(req.params.id), req.body || {})); } catch (e) { res.status(400).json({ error: e.message }); } }
function updateVariant(req, res) { try { res.json(products.updateVariant(Number(req.params.variantId), req.body || {})); } catch (e) { res.status(400).json({ error: e.message }); } }
function mapVariantPackaging(req, res) { try { res.json({ id: products.mapVariantPackaging(Number(req.params.variantId), req.body.placeholder_key, Number(req.body.packaging_id)) }); } catch (e) { res.status(400).json({ error: e.message }); } }
function getVariantPackaging(req, res) { res.json(products.getVariantPackagingMap(Number(req.params.variantId))); }
function cost(req, res) { res.json({ unit_cost: products.computeUnitCost(Number(req.params.id), req.query.variant_id ? Number(req.query.variant_id) : null) }); }
function pricingSummary(req, res) {
  const out = []; const plist = products.listProducts();
  for (const p of plist) {
    const vs = products.listVariants(p.id);
    if (vs.length === 0) {
      const unit_cost = products.computeUnitCost(p.id, null);
      const price = Number(p.list_price || 0), margin = price - unit_cost, margin_pct = price ? (margin/price)*100 : 0;
      out.push({ id: p.id, name: p.name, size: p.size, sku: p.sku, variant: null, list_price: price, unit_cost, margin, margin_pct });
    } else {
      for (const v of vs) {
        const price = v.list_price_override != null ? Number(v.list_price_override) : Number(p.list_price || 0);
        const unit_cost = products.computeUnitCost(p.id, v.id);
        const margin = price - unit_cost, margin_pct = price ? (margin/price)*100 : 0;
        out.push({ id: p.id, name: p.name, size: p.size, sku: p.sku, variant: v.label, list_price: price, unit_cost, margin, margin_pct });
      }
    }
  }
  res.json(out);
}
module.exports = {
  list, create, update, recipe, upsertRecipe, deleteRecipeItem, updateRecipeItem, replaceRecipeItem,
  variants, createVariant, updateVariant, mapVariantPackaging, getVariantPackaging, cost, pricingSummary
};