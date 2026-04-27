import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withRLS } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pass the session user to withRLS
    return await withRLS(session.user, async (tx) => {
      const [unitsRes] = await Promise.all([
        tx.query(`
          SELECT
            u.*,
            l.status AS lease_status,
            l.monthly_rent,
            l.start_date AS lease_start,
            l.end_date AS lease_end,
            CASE WHEN l.status = 'active' THEN TRUE ELSE FALSE END AS is_rented,
            t.name AS tenant_name,
            t.email AS tenant_email
          FROM units u
          LEFT JOIN LATERAL (
            SELECT lx.status, lx.monthly_rent, lx.start_date, lx.end_date, lx.user_id
            FROM leases lx
            WHERE lx.unit_id = u.id
            ORDER BY
              CASE WHEN lx.status = 'active' THEN 0 ELSE 1 END,
              lx.end_date DESC NULLS LAST
            LIMIT 1
          ) l ON TRUE
          LEFT JOIN users t ON t.id = l.user_id
          ORDER BY u.unit_code ASC
        `),
      ]);

      return NextResponse.json(unitsRes.rows);
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch", detail: err.message },
      { status: 500 },
    );
  }
}
