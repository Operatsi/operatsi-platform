import "server-only";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

let poolInstance: Pool | null = null;

/**
 * Sanitizes connection string or error message for logging to prevent credential leakage.
 */
export function sanitizeLog(input: string): string {
  if (!input) return "";
  // Strip postgres://user:password@host...
  return input.replace(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@/gi, "postgres://$1:***@");
}

/**
 * Validates whether the DATABASE_URL is configured with real credentials.
 */
export function isDatabaseConfigured(): boolean {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) return false;
  if (connStr.startsWith("REPLACE_WITH_") || connStr.includes("CHANGE_ME")) return false;
  return true;
}

/**
 * Retrieves the singleton PostgreSQL Pool instance.
 */
export function getDbPool(): Pool | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL!;

    // Supabase pooler connections require SSL
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

    poolInstance = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
      statement_timeout: 10000, // 10 second statement execution timeout
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });

    poolInstance.on("error", (err: Error) => {
      console.error("[PostgreSQL Pool Error]", sanitizeLog(err.message));
    });
  }

  return poolInstance;
}

/**
 * Executes a parameterized SQL query safely against PostgreSQL.
 * Automatically handles connection checkout and release.
 */
export async function sqlQuery<R extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<R> | null> {
  const pool = getDbPool();
  if (!pool) {
    // Database connection not yet configured
    return null;
  }

  const start = Date.now();
  try {
    const res = await pool.query<R>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 1000) {
      console.warn(`[PostgreSQL Slow Query] Execution time ${duration}ms`);
    }
    return res;
  } catch (err: any) {
    console.error("[PostgreSQL Query Execution Error]", {
      message: sanitizeLog(err.message),
      code: err.code,
    });
    throw new Error(`Database query failed: ${err.code || "UNKNOWN_ERROR"}`);
  }
}

/**
 * Executes operations inside an atomic PostgreSQL transaction.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T | null> {
  const pool = getDbPool();
  if (!pool) {
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[PostgreSQL Transaction Rolled Back]", {
      message: sanitizeLog(err.message),
      code: err.code,
    });
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Graceful pool shutdown for deployment lifecycle.
 */
export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
