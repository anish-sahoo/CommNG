import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import log from "@/utils/logger.js";
import { secretsManager } from "@/utils/secrets-manager.js";

type ConnectionCredentials = {
  user: string;
  password: string;
};

/**
 * Get database configuration from environment or Secrets Manager
 */
function getPoolConfig(overrides?: Partial<ConnectionCredentials>): PoolConfig {
  const config: PoolConfig = {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? "comm_ng",
    user: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "",
    ssl:
      process.env.POSTGRES_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
    max: Number(process.env.POSTGRES_POOL_SIZE ?? 20),
  };

  if (overrides?.user !== undefined) {
    config.user = overrides.user;
  }
  if (overrides?.password !== undefined) {
    config.password = overrides.password;
  }

  return config;
}

const initialPoolConfig = getPoolConfig();
const initialPassword =
  typeof initialPoolConfig.password === "function"
    ? ""
    : (initialPoolConfig.password ?? "");

let activeCredentials: ConnectionCredentials = {
  user: initialPoolConfig.user ?? "",
  password: initialPassword,
};

export let pool = new Pool(initialPoolConfig);

pool.on("error", (err) => {
  log.error(err, "Postgres error");
});

// keep a stable exported object reference for consumers (like better-auth)
// so that swapping the underlying connection doesn't break references.
let internalDb: NodePgDatabase = drizzle(pool);

export const db: NodePgDatabase = new Proxy(internalDb, {
  get(_target, prop) {
    // forward property access to the current internalDb
    const v = (internalDb as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof v === "function") {
      return (...args: unknown[]) => v.apply(internalDb, args);
    }
    return v;
  },
});

function credentialsChanged(next: ConnectionCredentials): boolean {
  return (
    next.user !== activeCredentials.user ||
    next.password !== activeCredentials.password
  );
}

async function swapPool(next: ConnectionCredentials): Promise<void> {
  log.debug("swapPool called");
  const newPool = new Pool(
    getPoolConfig({ user: next.user, password: next.password }),
  );

  newPool.on("error", (err) => {
    log.error(err, "Postgres error");
  });

  const testClient = await newPool.connect();
  testClient.release();

  const oldPool = pool;
  pool = newPool;
  // replace the internal underlying db instance while keeping the exported
  // "db" reference stable so adapters that captured it continue to work.
  internalDb = drizzle(newPool);
  activeCredentials = next;

  // Gracefully close old pool after a delay to allow in-flight queries to complete
  setTimeout(async () => {
    try {
      await oldPool.end();
      log.info("Old database pool closed gracefully after swap");
    } catch (err) {
      log.warn({ err }, "Failed to close old database pool");
    }
  }, 30000); // 30 second grace period
}

/**
 * Refresh database connection with new credentials
 * Called when secret rotation is detected
 */
async function refreshDatabaseConnection(credentials: {
  username: string;
  password: string;
}): Promise<void> {
  log.info("Refreshing database connection with rotated credentials");

  try {
    // Create new pool with updated credentials from Secrets Manager
    // Connection details (host, port, database) come from environment variables
    const nextCredentials: ConnectionCredentials = {
      user: credentials.username,
      password: credentials.password,
    };

    if (!credentialsChanged(nextCredentials)) {
      log.debug("Skipping pool refresh - credentials unchanged");
      return;
    }

    await swapPool(nextCredentials);

    log.info("Database connection successfully refreshed with new credentials");
  } catch (error) {
    log.error(error, "Failed to refresh database connection");
    throw error;
  }
}

export async function connectPostgres() {
  // If Secrets Manager is enabled, fetch credentials and set up auto-refresh
  if (secretsManager.isEnabled()) {
    try {
      const credentials = await secretsManager.getCredentials();

      if (credentials) {
        log.info("Using credentials from AWS Secrets Manager");

        const nextCredentials: ConnectionCredentials = {
          user: credentials.username,
          password: credentials.password,
        };

        if (credentialsChanged(nextCredentials)) {
          await swapPool(nextCredentials);
        } else {
          log.info(
            "Secrets Manager credentials match existing pool - no swap performed",
          );
        }

        // Start auto-refresh (check every 5 minutes by default)
        const refreshIntervalMs = Number(
          process.env.DB_SECRET_REFRESH_INTERVAL_MS ?? 5 * 60 * 1000,
        );
        await secretsManager.startAutoRefresh(
          refreshIntervalMs,
          refreshDatabaseConnection,
        );

        log.info("Database secret auto-refresh enabled");
      }
    } catch (error) {
      log.warn(
        {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : "Unknown",
        },
        "Failed to initialize Secrets Manager, falling back to environment variables",
      );
    }
  }

  // Test connection
  const client = await pool.connect();
  client.release();
  log.info("Postgres connection established");
}

export async function shutdownPostgres() {
  if (secretsManager.isEnabled()) {
    secretsManager.stopAutoRefresh();
  }
  await pool.end();
  log.info("Postgres shut down");
}
