import { useState } from "react";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import BatchLog from "./pages/BatchLog";
import Pricing from "./pages/Pricing";
import Analytics from "./pages/Analytics";

export default function App() {
  const [tab, setTab] = useState("pricing");
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <h1>BatchBoss</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTab("pricing")}>Pricing</button>
        <button onClick={() => setTab("products")}>Products</button>
        <button onClick={() => setTab("batch")}>Batch Log</button>
        <button onClick={() => setTab("inventory")}>Inventory</button>
        <button onClick={() => setTab("analytics")}>Analytics</button>
      </div>
      {tab === "pricing" ? <Pricing /> :
       tab === "products" ? <Products /> :
       tab === "batch" ? <BatchLog /> :
       tab === "inventory" ? <Inventory /> :
       <Analytics />}
    </div>
  );
}