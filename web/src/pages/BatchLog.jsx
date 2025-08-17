import { useEffect, useState } from "react";
import { get, post } from "../api";

export default function BatchLog() {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [fragrances, setFragrances] = useState([]);
  const [batches, setBatches] = useState([]);

  const [product_id, setProductId] = useState("");
  const [variant_id, setVariantId] = useState("");
  const [fragrance_id, setFragranceId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [p, f, b] = await Promise.all([ get("/products"), get("/inventory/fragrances"), get("/batches") ]);
    setProducts(p); setFragrances(f); setBatches(b);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!product_id) { setVariants([]); return; }
    get(`/products/${product_id}/variants`).then(setVariants);
  }, [product_id]);

  async function submit() {
    setError("");
    try {
      await post("/batches", {
        product_id: Number(product_id),
        variant_id: variant_id ? Number(variant_id) : null,
        fragrance_id: fragrance_id ? Number(fragrance_id) : null,
        quantity: Number(quantity),
        note
      });
      setQuantity(1); setNote("");
      load();
    } catch (e) {
      try { const obj = JSON.parse(e.message); setError(obj.error || e.message); } catch { setError(String(e)); }
    }
  }

  return (
    <div>
      <h3>Log a Batch</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <select value={product_id} onChange={e=>setProductId(e.target.value)}>
          <option value="">Select product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.size}</option>)}
        </select>
        <select value={variant_id} onChange={e=>setVariantId(e.target.value)}>
          <option value="">(optional) variant</option>
          {variants.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <select value={fragrance_id} onChange={e=>setFragranceId(e.target.value)}>
          <option value="">(optional) fragrance</option>
          {fragrances.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)} />
        <input placeholder="Note" value={note} onChange={e=>setNote(e.target.value)} />
        <button onClick={submit}>Save</button>
      </div>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      <h3>Recent Batches</h3>
      <table border="1" cellPadding="6">
        <thead><tr><th>Date</th><th>Product</th><th>Variant</th><th>Fragrance</th><th>Qty</th><th>Note</th></tr></thead>
        <tbody>
          {batches.map(b => (
            <tr key={b.id}>
              <td>{new Date(b.created_at).toLocaleString()}</td>
              <td>{b.product_name} — {b.product_size}</td>
              <td>{b.variant_label || ""}</td>
              <td>{b.fragrance_name || ""}</td>
              <td>{b.quantity}</td>
              <td>{b.note || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}