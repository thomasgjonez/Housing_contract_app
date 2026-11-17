// Deletes the local database so the next `npm run dev` recreates it with fresh sample data.
import fs from "node:fs";
for (const f of ["data/app.db", "data/app.db-wal", "data/app.db-shm"]) fs.rmSync(f, { force: true });
console.log("Database removed. Start the app again to reseed it.");
