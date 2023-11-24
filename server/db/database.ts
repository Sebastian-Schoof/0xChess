import Database from "better-sqlite3";

const db = new Database("games.db", { fileMustExist: true });
db.pragma("journal_mode = WAL");

export default db;
