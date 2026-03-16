import sqlite3 from "sqlite3";
import fs from "fs";

const db = new sqlite3.Database("./exam_cache.db");

// load schema
const schema = fs.readFileSync("./src/controller/sql/schema.sql", "utf8");

db.exec(schema, (err) => {
    if (err) {
        console.error("SQLite schema init failed:", err);
    } else {
        console.log("SQLite schema loaded");
    }
});

export default db;