// import pg from "pg";

// const { Pool } = pg;

// let pool;

// function getPool() {
//   if (!pool) {
//     pool = new Pool({
//       host: process.env.PGHOST,
//       port: Number(process.env.PGPORT || 5432),
//       user: process.env.PGUSER,
//       password: process.env.PGPASSWORD,
//       database: process.env.PGDATABASE,
//       max: 10,
//       idleTimeoutMillis: 30000,
//       connectionTimeoutMillis: 5000,
//     });
//   }

//   return pool;
// }

// export async function query(text, params = []) {
//   const client = getPool();
//   return client.query(text, params);
// }

// export async function closePool() {
//   if (pool) {
//     await pool.end();
//     pool = undefined;
//   }
// }

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
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
    await client.query('BEGIN');
    
    // Injecting the "Passport" into the database session
    await client.query(`SELECT set_config('app.current_company_id', $1::text, true)`, [user.company_id]);
    await client.query(`SELECT set_config('app.user_role', $1::text, true)`, [user.role]);
    
    if (user.unit_id) {
      await client.query(`SELECT set_config('app.user_unit_id', $1::text, true)`, [user.unit_id]);
    }

    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
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
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
