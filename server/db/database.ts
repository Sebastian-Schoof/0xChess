import Database from "better-sqlite3";

const db = new Database("games.db");
db.exec("PRAGMA temp_store = memory");
db.exec("PRAGMA journal_mode = WAL");

export default db;
