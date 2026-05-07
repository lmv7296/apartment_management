import { Pool } from "pg";

const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE
    ? `postgresql://${encodeURIComponent(process.env.PGUSER)}:${encodeURIComponent(
        process.env.PGPASSWORD || "",
      )}@${process.env.PGHOST}:${process.env.PGPORT || "5432"}/${encodeURIComponent(
        process.env.PGDATABASE,
      )}`
    : null);

if (!connectionString) {
  throw new Error(
    "Missing database connection. Set SUPABASE_DB_URL (preferred) or DATABASE_URL.",
  );
}

const useSsl =
  process.env.DB_SSL === "true" ||
  connectionString.includes("supabase.co") ||
  connectionString.includes("pooler.supabase.com");

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

/** *
 * Use this for: Login, Sign up, or Public data.
 */
export async function query(text, params) {
  return pool.query(text, params);
}

/** *
 * Use this for: Everything else (Properties, Units, Payments).
 */
export async function withRLS(user, callback) {
  if (!user) throw new Error("No user session provided to withRLS");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Injecting the "Passport" into the database session
    if (user.company_id) {
      await client.query(
        `SELECT set_config('app.current_company_id', $1::text, true)`,
        [user.company_id],
      );
    }
    if (user.role) {
      await client.query(`SELECT set_config('app.user_role', $1::text, true)`, [
        user.role,
      ]);
    }

    if (user.unit_id) {
      await client.query(
        `SELECT set_config('app.user_unit_id', $1::text, true)`,
        [user.unit_id],
      );
    }

    const result = await callback(client);

    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
/**
 * Use this for: any multi-statement operation that must be atomic.
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
