import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const queryGetPropertyById = `
  SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.total_units AS "totalUnits",
    p.created_at AS "createdAt",
    COUNT(DISTINCT u.id)::int AS "unitCount",
    COUNT(DISTINCT l.user_id)::int AS "tenantCount"
  FROM properties p
  LEFT JOIN units u ON u.property_id = p.id
  LEFT JOIN leases l ON l.unit_id = u.id AND l.status = 'active'
  WHERE p.id = $1::uuid
  GROUP BY p.id
`;

const queryGetPropertyUnits = `
  SELECT
    u.id,
    u.unit_code AS "unitCode",
    u.bedrooms,
    u.bathrooms,
    u.square_feet AS "squareFeet",
    l.status AS "leaseStatus",
    tenant.name AS "tenantName"
  FROM units u
  LEFT JOIN LATERAL (
    SELECT lx.user_id, lx.status
    FROM leases lx
    WHERE lx.unit_id = u.id
    ORDER BY
      CASE WHEN lx.status = 'active' THEN 0 ELSE 1 END,
      lx.end_date DESC NULLS LAST
    LIMIT 1
  ) l ON TRUE
  LEFT JOIN users tenant ON tenant.id = l.user_id
  WHERE u.property_id = $1::uuid
  ORDER BY u.unit_code ASC
`;

export async function GET(_request, { params }) {
  try {
    const propertyId = String(params?.id || "").trim();

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property id is required" },
        { status: 400 },
      );
    }

    const [propertyRes, unitsRes] = await Promise.all([
      query(queryGetPropertyById, [propertyId]),
      query(queryGetPropertyUnits, [propertyId]),
    ]);

    const property = propertyRes.rows[0];

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...property,
      units: unitsRes.rows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load property", detail: err.message },
      { status: 500 },
    );
  }
}
