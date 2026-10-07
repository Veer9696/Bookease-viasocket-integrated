// Runs a local MongoDB replica set for development and demoing — no Atlas
// account needed. Fixed port and an on-disk data folder (server/.dev-db) mean
// DATABASE_URL never changes and data survives restarts. Not for production:
// use your Atlas connection string there.
const fs = require("fs");
const path = require("path");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const PORT = Number(process.env.DEV_DB_PORT) || 27117;
const DB_PATH = path.join(__dirname, "..", ".dev-db");

async function main() {
  fs.mkdirSync(DB_PATH, { recursive: true });

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, name: "rs0", storageEngine: "wiredTiger" },
    instanceOpts: [{ port: PORT, dbPath: DB_PATH, storageEngine: "wiredTiger" }],
  });

  console.log("Local dev MongoDB is running.");
  console.log(`DATABASE_URL=mongodb://127.0.0.1:${PORT}/bookease?replicaSet=rs0`);
  console.log(`Data is saved in ${DB_PATH}. Press Ctrl+C to stop.`);

  const shutdown = async () => {
    // Keep the data folder: stopping must not wipe the dev database.
    await replSet.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start local dev MongoDB:", err);
  process.exit(1);
});
