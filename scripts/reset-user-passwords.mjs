import pg from "pg";
import { Algorithm, hash } from "@node-rs/argon2";

const { Pool } = pg;

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const demoPassword = String(
    process.env.NEXTAUTH_DEMO_PASSWORD || "demo123",
  ).trim();

  const passwordHash = await hash(demoPassword, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const pool = new Pool({
    host: requiredEnv("PGHOST"),
    port: Number(process.env.PGPORT || 5432),
    user: requiredEnv("PGUSER"),
    password: process.env.PGPASSWORD,
    database: requiredEnv("PGDATABASE"),
  });

  try {
    const updated = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE password_hash IS NULL`,
      [passwordHash],
    );

    const counts = await pool.query(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE password_hash IS NULL)::int AS missing FROM users`,
    );

    console.log({ updated: updated.rowCount, ...counts.rows[0] });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
