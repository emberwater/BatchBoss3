import { useEffect, useState } from "react";
import { get, post } from "../api";

function List({ title, path, defaultUnit }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [unit, setUnit] = useState(defaultUnit || "each");
  const [on_hand, setOnHand] = useState("");
  const [min_level, setMinLevel] = useState("");
  const [cost_per_unit, setCost] = useState("");
  const [error, setError] = useState("");

  async function load() { setRows(await get(`/inventory/${path}`)); }
  useEffect(() => { load(); }, []);

  async function receiveOrCreate() {
    setError("");
    try {
      await post(`/inventory/${path}`, {
        name,
        supplier: supplier || null,
        unit,
        on_hand: Number(on_hand || 0),
        min_level: Number(min_level || 0),
        cost_per_unit: Number(cost_per_unit || 0)
      });
      setName(""); setSupplier(""); setOnHand(""); setMinLevel(""); setCost("");
      await load();
    } catch (e) { setError("Save failed: " + (e.message || e)); }
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <h3>{title}</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Supplier" value={supplier} onChange={e=>setSupplier(e.target.value)} />
        <input placeholder="Unit" value={unit} onChange={e=>setUnit(e.target.value)} />
        <input placeholder="On hand (+receive)" value={on_hand} onChange={e=>setOnHand(e.target.value)} />
        <input placeholder="Reorder point" value={min_level} onChange={e=>setMinLevel(e.target.value)} />
        <input placeholder="Cost / unit" value={cost_per_unit} onChange={e=>setCost(e.target.value)} />
        <button onClick={receiveOrCreate}>Save</button>
        {error && <span style={{ color: "red" }}>{error}</span>}
      </div>

      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead><tr><th>Name</th><th>Supplier</th><th>On hand</th><th>Unit</th><th>Reorder pt</th><th>Cost/unit</th></tr></thead>
        <tbody>
          {rows.map(r => {
            const low = Number(r.on_hand||0) <= Number(r.min_level||0);
            return (
              <tr key={r.id} style={{ background: low ? "#ffe6e6" : "transparent" }}>
                <td>{r.name}</td>
                <td>{r.supplier || ""}</td>
                <td>{r.on_hand}</td>
                <td>{r.unit}</td>
                <td>{r.min_level || 0}</td>
                <td>{r.cost_per_unit || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Inventory() {
  return (
    <div>
      <List title="Ingredients" path="ingredients" defaultUnit="oz" />
      <List title="Packaging" path="packaging" defaultUnit="each" />
      <List title="Fragrance Oils" path="fragrances" defaultUnit="oz" />
    </div>
  );
}