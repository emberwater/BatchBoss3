import { useEffect, useMemo, useState } from "react";
import { get, post } from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [packaging, setPackaging] = useState([]);
  const [fragrances, setFragrances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [variants, setVariants] = useState([]);
  const [variantMaps, setVariantMaps] = useState({});

  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [sku, setSku] = useState("");
  const [listPrice, setListPrice] = useState("");

  async function loadBase() {
    const [p, i, pk, fr] = await Promise.all([
      get("/products"),
      get("/inventory/ingredients"),
      get("/inventory/packaging"),
      get("/inventory/fragrances"),
    ]);
    setProducts(p); setIngredients(i); setPackaging(pk); setFragrances(fr);
  }
  useEffect(() => { loadBase(); }, []);

  async function loadDetails(pid) {
    setRecipe(await get(`/products/${pid}/recipe`));
    const v = await get(`/products/${pid}/variants`);
    setVariants(v);
    const mapObj = {};
    for (const row of v) mapObj[row.id] = await get(`/products/variants/${row.id}/packaging`);
    setVariantMaps(mapObj);
  }
  useEffect(() => { if (selected) loadDetails(selected); }, [selected]);

  async function addProduct() {
    const res = await post("/products", { name, size, sku, list_price: Number(listPrice || 0) });
    setName(""); setSize(""); setSku(""); setListPrice("");
    await loadBase(); setSelected(res.id);
  }

  function CatalogSelect({ value, onChange }) {
    return (
      <select value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">Select item…</option>
        <optgroup label="Ingredients">
          {ingredients.map(x => <option key={`i-${x.id}`} value={`ingredient:${x.id}`}>{x.name}</option>)}
        </optgroup>
        <optgroup label="Packaging">
          {packaging.map(x => <option key={`p-${x.id}`} value={`packaging:${x.id}`}>{x.name}</option>)}
        </optgroup>
        <optgroup label="Fragrances">
          {fragrances.map(x => <option key={`f-${x.id}`} value={`fragrance:${x.id}`}>{x.name}</option>)}
        </optgroup>
        <optgroup label="Special">
          <option value={"fragrance_variable:"}>Selected Fragrance (variable)</option>
          <option value={"packaging_placeholder:bottle_color"}>Bottle (by color)</option>
        </optgroup>
      </select>
    );
  }

  const [newItem, setNewItem] = useState({ key: "", amount: "", unit: "each" });
  async function addRecipeItem() {
    if (!selected || !newItem.key) return;
    const [kind, rest] = newItem.key.split(":");
    const payload = { items: [] };
    if (kind === "packaging_placeholder") payload.items.push({ kind, amount_per_unit: Number(newItem.amount || 0), unit: newItem.unit || "each", placeholder_key: rest });
    else if (kind === "fragrance_variable") payload.items.push({ kind, amount_per_unit: Number(newItem.amount || 0), unit: newItem.unit || "oz" });
    else payload.items.push({ kind, ref_id: Number(rest), amount_per_unit: Number(newItem.amount || 0), unit: newItem.unit || "each" });
    await post(`/products/${selected}/recipe`, payload);
    setNewItem({ key: "", amount: "", unit: "each" }); loadDetails(selected);
  }

  const [vmColors, setVmColors] = useState("Amber,Black");
  const [vmSizes, setVmSizes] = useState("16,32");
  const [vmSkuPrefix, setVmSkuPrefix] = useState("");
  const [vmBaseIs, setVmBaseIs] = useState(16);
  async function generateVariants() {
    if (!selected) return;
    const colors = vmColors.split(",").map(s=>s.trim()).filter(Boolean);
    const sizes = vmSizes.split(",").map(s=>s.trim()).filter(Boolean);
    for (const c of colors) for (const s of sizes) {
      const factor = Number(s) / Number(vmBaseIs || s);
      const label = `${c} ${s} oz`;
      const sku = vmSkuPrefix ? `${vmSkuPrefix}-${c.slice(0,3).toUpperCase()}-${s}` : undefined;
      await post(`/products/${selected}/variants`, { label, sku, size_value: Number(s), size_factor: factor });
    }
    loadDetails(selected);
  }

  async function mapBottle(variantId, packagingId) {
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/products/variants/${variantId}/packaging`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeholder_key: "bottle_color", packaging_id: Number(packagingId) })
    });
    loadDetails(selected);
  }

  const bottleOptions = useMemo(() => packaging.filter(p => /bottle/i.test(p.name)), [packaging]);

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 360 }}>
          <h3>All Products</h3>
          <table border="1" cellPadding="6" style={{ width: "100%" }}>
            <thead><tr><th>Name</th><th>Size</th><th>SKU</th><th>List Price</th><th></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.size}</td>
                  <td>{p.sku || ""}</td>
                  <td>${Number(p.list_price||0).toFixed(2)}</td>
                  <td><button onClick={()=>setSelected(p.id)}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 16 }}>Add Product</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="Base Size (e.g., 16 oz)" value={size} onChange={e=>setSize(e.target.value)} />
            <input placeholder="SKU (optional)" value={sku} onChange={e=>setSku(e.target.value)} />
            <input placeholder="List Price" value={listPrice} onChange={e=>setListPrice(e.target.value)} />
            <button onClick={addProduct}>Save</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 420 }}>
          {!selected ? <div>Select a product to view.</div> : (
            <>
              <h3>Recipe</h3>
              <table border="1" cellPadding="6" style={{ width: "100%", marginBottom: 12 }}>
                <thead><tr><th>Kind</th><th>Item</th><th>Amount per unit</th><th>Unit</th></tr></thead>
                <tbody>
                  {recipe.map(r => (
                    <tr key={r.id}>
                      <td>{r.kind}</td>
                      <td>{r.ref_name}</td>
                      <td>{r.amount_per_unit}</td>
                      <td>{r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <CatalogSelect value={newItem.key} onChange={(v)=>setNewItem(s=>({ ...s, key: v }))} />
                <input placeholder="Amount per unit" value={newItem.amount} onChange={e=>setNewItem(s=>({ ...s, amount: e.target.value }))} />
                <input placeholder="Unit" value={newItem.unit} onChange={e=>setNewItem(s=>({ ...s, unit: e.target.value }))} />
                <button onClick={addRecipeItem}>Add</button>
              </div>

              <h3 style={{ marginTop: 16 }}>Variants</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Generate (colors × sizes)</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <input placeholder="Colors (comma-separated)" value={vmColors} onChange={e=>setVmColors(e.target.value)} />
                    <input placeholder="Sizes (comma-separated)" value={vmSizes} onChange={e=>setVmSizes(e.target.value)} />
                    <input placeholder="Base size for factor (e.g., 16)" value={vmBaseIs} onChange={e=>setVmBaseIs(e.target.value)} style={{ width: 120 }} />
                    <input placeholder="SKU prefix (optional)" value={vmSkuPrefix} onChange={e=>setVmSkuPrefix(e.target.value)} />
                    <button onClick={generateVariants}>Generate</button>
                  </div>
                </div>
              </div>

              {variants.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 6 }}>Map bottle color (per variant)</div>
                  <table border="1" cellPadding="6" style={{ width: "100%" }}>
                    <thead><tr><th>Variant</th><th>SKU</th><th>Size factor</th><th>Bottle</th></tr></thead>
                    <tbody>
                      {variants.map(v => {
                        const mapping = (variantMaps[v.id] || []).find(m => m.placeholder_key === "bottle_color");
                        const selectedPkg = mapping ? mapping.packaging_id : "";
                        return (
                          <tr key={v.id}>
                            <td>{v.label}</td>
                            <td>{v.sku || ""}</td>
                            <td>{v.size_factor}</td>
                            <td>
                              <select value={selectedPkg} onChange={e=>mapBottle(v.id, e.target.value)}>
                                <option value="">Select bottle…</option>
                                {bottleOptions.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}