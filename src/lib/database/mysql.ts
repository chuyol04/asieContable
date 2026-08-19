import "server-only";

import { createPool, type Pool, type PoolOptions } from "mysql2/promise";

declare global {
  var asieContableMysqlPool: Pool | undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function databaseConfig(): PoolOptions {
  const port = Number(requiredEnv("DB_PORT"));

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535");
  }

  return {
    host: requiredEnv("DB_HOST"),
    port,
    database: requiredEnv("DB_NAME"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    waitForConnections: true,
    connectionLimit: 10,
  };
}

export function getMysqlPool(): Pool {
  const pool = globalThis.asieContableMysqlPool ?? createPool(databaseConfig());

  if (process.env.NODE_ENV !== "production") {
    globalThis.asieContableMysqlPool = pool;
  }

  return pool;
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await getMysqlPool().execute("SELECT 1");
    return true;
  } catch {
    console.error("[database] MySQL connection check failed.");
    return false;
  }
}
