// createDB.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('customdate.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS custom_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      preference TEXT,
      date TEXT,
      people INTEGER,
      duration TEXT,
      budget TEXT,
      notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  console.log("Tables created!");
});

db.close();
