import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withRLS } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

const queryGetUnitById = `
  SELECT
    u.id,
    u.property_id AS "propertyId",
    u.unit_code AS "unitCode",
    u.bedrooms,
    u.bathrooms,
    u.square_feet AS "squareFeet",
    u.created_at AS "createdAt",
    p.name AS "propertyName",
    p.address AS "propertyAddress",
    p.city AS "propertyCity",
    p.state AS "propertyState",
    l.status AS "leaseStatus",
    l.start_date AS "leaseStartDate",
    l.end_date AS "leaseEndDate",
    l.monthly_rent AS "monthlyRent",
    l.leave_date AS "leaveDate",
    tenant.id AS "tenantId",
    tenant.name AS "tenantName",
    tenant.email AS "tenantEmail",
    tenant.phone AS "tenantPhone"
  FROM units u
  JOIN properties p ON p.id = u.property_id
  LEFT JOIN LATERAL (
    SELECT lx.user_id, lx.status, lx.start_date, lx.end_date, lx.monthly_rent, lx.leave_date
    FROM leases lx
    WHERE lx.unit_id = u.id
    ORDER BY
      CASE WHEN lx.status = 'active' THEN 0 ELSE 1 END,
      lx.end_date DESC NULLS LAST
    LIMIT 1
  ) l ON TRUE
  LEFT JOIN users tenant ON tenant.id = l.user_id
  WHERE u.id = $1::uuid
  LIMIT 1
`;

const queryGetLeaseHistory = `
  SELECT
    l.id,
    l.status,
    l.start_date AS "startDate",
    l.end_date AS "endDate",
    l.monthly_rent AS "monthlyRent",
    l.leave_date AS "leaveDate",
    tenant.name AS "tenantName"
  FROM leases l
  LEFT JOIN users tenant ON tenant.id = l.user_id
  WHERE l.unit_id = $1::uuid
  ORDER BY l.end_date DESC NULLS LAST, l.start_date DESC NULLS LAST
`;

export async function GET(_request, { params: paramsPromise }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;
    const unitId = String(params?.id || "").trim();

    if (!unitId) {
      return NextResponse.json(
        { error: "Unit id is required" },
        { status: 400 },
      );
    }

    // Pass the session user to withRLS
    return await withRLS(session.user, async (tx) => {
      const [unitRes, leaseHistoryRes] = await Promise.all([
        tx.query(queryGetUnitById, [unitId]),
        tx.query(queryGetLeaseHistory, [unitId]),
      ]);
      const unit = unitRes.rows[0];

      if (!unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
      }

      return NextResponse.json({
        ...unit,
        leaseHistory: leaseHistoryRes.rows,
      });
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch unit", detail: error.message },
      { status: 500 },
    );
  }
}
