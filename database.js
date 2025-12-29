const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./shop.db");

// Tabla de usuarios
db.run(`
CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0
)`);

// Tabla de compras
db.run(`
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  item TEXT,
  price INTEGER,
  date TEXT
)`);

module.exports = db;
