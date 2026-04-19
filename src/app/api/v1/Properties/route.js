import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const queryGetProperties = `
  SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.created_at AS "createdAt",
    COUNT(DISTINCT u.id)::int AS "unitCount",
    COUNT(DISTINCT l.user_id)::int AS "tenantCount"
  FROM properties p
  LEFT JOIN units u ON u.property_id = p.id
  LEFT JOIN leases l ON l.unit_id = u.id AND l.status = 'active'
  GROUP BY p.id
  ORDER BY p.name ASC
`;

export async function GET() {
  try {
    const { rows } = await query(queryGetProperties);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load properties", detail: err.message },
      { status: 500 },
    );
  }
}
