const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

function splitCSVLine(line) {
  const out = []; let field = ""; let inQuotes = false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuotes && line[i+1] === '"') { field += '"'; i++; } else { inQuotes = !inQuotes; } }
    else if (ch === "," && !inQuotes) { out.push(field); field=""; }
    else { field += ch; }
  }
  out.push(field); return out;
}
function parseCSV(buf) {
  const text = buf.toString("utf8").replace(/^\uFEFF/,"").replace(/\r/g,"");
  const parts = text.trim().split("\n").filter(Boolean);
  if (!parts.length) return [];
  const cols = splitCSVLine(parts[0]).map(s=>s.trim().toLowerCase().replace(/\s+/g,"_"));
  return parts.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const obj = {}; cols.forEach((c,i)=>{ const v = vals[i] !== undefined ? vals[i].trim() : null; obj[c] = v === "" ? null : v; });
    return obj;
  });
}
const handleUpload = [
  upload.single("file"),
  (req, res) => {
    try {
      const type = req.params.type;
      if (!["ingredients","packaging","fragrances","products"].includes(type)) throw new Error("Invalid import type");
      const rows = parseCSV(req.file.buffer);
      const db = require("../db");
      if (!rows.length) return res.json({ imported: 0 });
      const cols = Object.keys(rows[0]);
      const placeholders = cols.map(()=>"?").join(",");
      const ins = db.prepare(`INSERT OR IGNORE INTO ${type} (${cols.join(",")}) VALUES (${placeholders})`);
      const tx = db.transaction((rows) => { for (const r of rows) ins.run(cols.map(c => r[c])); });
      tx(rows);
      res.json({ imported: rows.length });
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
];
module.exports = { handleUpload };