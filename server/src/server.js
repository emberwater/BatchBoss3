require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
require("./db");

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));