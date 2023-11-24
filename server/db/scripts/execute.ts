import db from "db/database";
import * as fs from "fs";

const scriptPath = "server/db/scripts/";
//TODO: execute based on tableVersions
const migration = fs.readFileSync(scriptPath + "0.0.1.sql", "utf8");
db.exec(migration);
