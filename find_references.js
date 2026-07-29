import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function main() {
  try {
    // 1. Get all tables and columns of type uuid
    const { rows: columns } = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND (data_type = 'uuid' OR data_type = 'character varying' OR data_type = 'text')
    `);

    const oldId = 'de132322-a936-4384-9cd0-07c938f0c572';
    console.log(`Searching for references to ${oldId}...`);

    for (const col of columns) {
      const { table_name, column_name } = col;
      try {
        const { rows } = await pool.query(
          `SELECT COUNT(*)::int as count FROM "${table_name}" WHERE "${column_name}"::text = $1`,
          [oldId]
        );
        if (rows[0].count > 0) {
          console.log(`Found in table "${table_name}" column "${column_name}": ${rows[0].count} row(s)`);
        }
      } catch (err) {
        // Ignore column types that can't be converted/compared easily
      }
    }
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await pool.end();
  }
}

main();
