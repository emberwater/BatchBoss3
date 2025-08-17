const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || "./data/batchboss.db";
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

function runSQL(file) { db.exec(fs.readFileSync(file, "utf-8")); }
runSQL(path.join(__dirname, "schema.sql"));
const has = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
if (has === 0) runSQL(path.join(__dirname, "seed.sql"));
module.exports = db;