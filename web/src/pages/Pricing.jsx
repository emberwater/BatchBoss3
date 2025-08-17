import { useEffect, useState } from "react";
import { get, put } from "../api";

export default function Pricing() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() { setRows(await get("/pricing/summary")); }
  useEffect(() => { load(); }, []);

  async function save(pId, variant, price) {
    setError("");
    try {
      if (variant) {
        // variant price override
        await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/products/variants/${variant}/`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ list_price_override: Number(price) })
        });
      } else {
        await put(`/products/${pId}`, { list_price: Number(price) });
      }
      load();
    } catch (e) { setError("Save failed: " + (e.message || e)); }
  }

  return (
    <div>
      <h3>Pricing Dashboard</h3>
      {error && <div style={{ color:"red" }}>{error}</div>}
      <table border="1" cellPadding="6" style={{ width:"100%" }}>
        <thead><tr><th>Product</th><th>Variant</th><th>Unit Cost</th><th>List Price</th><th>Margin</th><th>Margin %</th><th></th></tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const [price, setPrice] = [r.list_price, (v)=>{}]; // placeholder
            return (
              <Row key={i} r={r} onSave={save} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({ r, onSave }) {
  const [price, setPrice] = useState(r.list_price);
  const low = (r.list_price - r.unit_cost) / (r.list_price || 1) < 0.6;
  return (
    <tr style={{ background: low ? "#fff0f0" : "transparent" }}>
      <td>{r.name} — {r.size}</td>
      <td>{r.variant || ""}</td>
      <td>${r.unit_cost.toFixed(2)}</td>
      <td><input style={{ width: 90 }} value={price} onChange={e=>setPrice(e.target.value)} /></td>
      <td>${(r.list_price - r.unit_cost).toFixed(2)}</td>
      <td>{r.list_price ? (((r.list_price - r.unit_cost)/r.list_price)*100).toFixed(1) : "0.0"}%</td>
      <td><button onClick={()=>onSave(r.id, r.variant_id, price)}>Save</button></td>
    </tr>
  );
}