import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import log from "@/utils/logger.js";

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? "comm_ng",
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "",
  ssl:
    process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: Number(process.env.POSTGRES_POOL_SIZE ?? 20),
});

pool.on("error", (err) => {
  log.error(err, "Postgres error");
});

export const db = drizzle(pool);

export async function connectPostgres() {
  const client = await pool.connect();
  client.release();
  log.info("Postgres connection established");
}

export async function shutdownPostgres() {
  await pool.end();
  log.info("Postgres shut down");
}
