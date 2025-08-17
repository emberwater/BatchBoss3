import { useEffect, useState } from "react";
import { get } from "../api";

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [h, setH] = useState(30);
  const [lb, setLb] = useState(60);
  const [topProducts, setTopProducts] = useState([]);
  const [topUsage, setTopUsage] = useState({ ingredients: [], packaging: [], fragrances: [] });
  const [forecast, setForecast] = useState([]);

  async function load() {
    setTopProducts(await get(`/analytics/top-products?days=${days}`));
    setTopUsage(await get(`/analytics/top-usage?days=${days}`));
    setForecast(await get(`/analytics/forecast?horizon=${h}&lookback=${lb}`));
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h3>Analytics</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>Lookback (days): <input value={days} onChange={e=>setDays(e.target.value)} style={{ width: 70 }} /></label>
        <label>Forecast horizon (days): <input value={h} onChange={e=>setH(e.target.value)} style={{ width: 70 }} /></label>
        <label>Forecast lookback (days): <input value={lb} onChange={e=>setLb(e.target.value)} style={{ width: 70 }} /></label>
        <button onClick={load}>Refresh</button>
      </div>

      <h4>Top Products</h4>
      <table border="1" cellPadding="6">
        <thead><tr><th>Product</th><th>Variant</th><th>Qty</th></tr></thead>
        <tbody>{topProducts.map((r, i) => (
          <tr key={i}><td>{r.name} — {r.size}</td><td>{r.variant}</td><td>{r.qty}</td></tr>
        ))}</tbody>
      </table>

      <h4 style={{ marginTop: 12 }}>Top Inventory Usage</h4>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {["ingredients", "packaging", "fragrances"].map(k => (
          <div key={k} style={{ minWidth: 260 }}>
            <h5 style={{ textTransform: "capitalize" }}>{k}</h5>
            <table border="1" cellPadding="6">
              <thead><tr><th>Item</th><th>Used</th><th>Unit</th></tr></thead>
              <tbody>{topUsage[k].map((r, i) => (
                <tr key={i}><td>{r.name}</td><td>{r.used}</td><td>{r.unit}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </div>

      <h4 style={{ marginTop: 12 }}>Forecast</h4>
      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead><tr><th>Table</th><th>Item</th><th>Avg/day</th><th>Projected need</th><th>On hand</th><th>Projected after</th><th>Reorder pt</th><th>Suggest order</th></tr></thead>
        <tbody>{forecast.map((r, i) => (
          <tr key={i} style={{ background: r.projected_after_horizon < r.reorder_point ? "#ffe6e6" : "transparent" }}>
            <td>{r.table}</td><td>{r.name}</td><td>{r.avg_daily_usage.toFixed(3)}</td><td>{r.projected_need.toFixed(2)}</td>
            <td>{r.on_hand}</td><td>{r.projected_after_horizon.toFixed(2)}</td><td>{r.reorder_point}</td><td>{r.suggest_order}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}