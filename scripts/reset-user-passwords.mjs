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

function buildConnectionString() {
  const fromUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (fromUrl) {
    return fromUrl;
  }

  return `postgresql://${encodeURIComponent(requiredEnv("PGUSER"))}:${encodeURIComponent(
    process.env.PGPASSWORD || "",
  )}@${requiredEnv("PGHOST")}:${process.env.PGPORT || "5432"}/${encodeURIComponent(
    requiredEnv("PGDATABASE"),
  )}`;
}

function shouldUseSsl(connectionString) {
  if (process.env.DB_SSL === "true") {
    return true;
  }

  return (
    connectionString.includes("supabase.co") ||
    connectionString.includes("pooler.supabase.com")
  );
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

  const connectionString = buildConnectionString();

  if (
    connectionString.startsWith("http://") ||
    connectionString.startsWith("https://")
  ) {
    throw new Error(
      "SUPABASE_DB_URL must be a Postgres URI (postgresql://...), not an https project URL.",
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
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
