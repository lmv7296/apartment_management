import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

function formatRelativeTime(dateString) {
  const value = new Date(dateString).getTime();

  if (Number.isNaN(value)) {
    return "just now";
  }

  const diffMs = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const mins = Math.max(1, Math.round(diffMs / minute));
    return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day) {
    const hours = Math.round(diffMs / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(diffMs / day);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const apartmentId = session?.user?.apartmentId || null;
    const role = String(session?.user?.role || "tenant").toLowerCase();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      propertyStats,
      paymentStats,
      expiringLeaseStats,
      openMaintenanceStats,
    ] = await Promise.all([
      query(
        `
            SELECT
              (SELECT COUNT(*)::int FROM properties) AS "totalProperties",
              (SELECT COUNT(*)::int FROM units WHERE occupied = TRUE) AS "occupiedUnits",
              (SELECT COUNT(*)::int FROM units WHERE occupied = FALSE) AS "vacantUnits"
          `,
      ),
      query(
        `
            SELECT
              COALESCE(SUM(amount) FILTER (
                WHERE status = 'paid'
                  AND paid_at >= DATE_TRUNC('month', NOW())
                  AND paid_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
              ), 0)::numeric(12,2) AS "rentCollectedMonth",
              COUNT(*) FILTER (WHERE status = 'overdue')::int AS "overduePayments"
            FROM payments
          `,
      ),
      query(
        `
            SELECT COUNT(*)::int AS count
            FROM leases
            WHERE status = 'active'
              AND end_date >= CURRENT_DATE
              AND end_date <= CURRENT_DATE + INTERVAL '30 days'
          `,
      ),
      query(
        `
            SELECT COUNT(*)::int AS count
            FROM maintenance_requests
            WHERE status IN ('open', 'in_progress')
          `,
      ),
    ]);

    const metrics = {
      ...(propertyStats.rows[0] || {
        totalProperties: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
      }),
      ...(paymentStats.rows[0] || {
        rentCollectedMonth: 0,
        overduePayments: 0,
      }),
    };

    const activityRes = await query(
      `
        SELECT id, message, level, occurred_at
        FROM activity_events
        ORDER BY occurred_at DESC
        LIMIT 8
      `,
    );

    const activity = activityRes.rows.map((item) => ({
      id: item.id,
      message: item.message,
      level: item.level || "low",
      time: formatRelativeTime(item.occurred_at),
    }));

    const portfolioQuery =
      role === "manager"
        ? {
            text: `
              SELECT
                p.id AS "propertyId",
                p.name AS "buildingName",
                p.address,
                p.city,
                p.state,
                u.id AS "unitId",
                u.unit_code AS "unitCode",
                COALESCE(u.occupied, FALSE) AS occupied,
                l.status AS "leaseStatus",
                tenant.name AS "tenantName"
              FROM properties p
              LEFT JOIN units u ON u.property_id = p.id
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
              ORDER BY p.name ASC, u.unit_code ASC
            `,
            values: [],
          }
        : {
            text: `
              SELECT
                p.id AS "propertyId",
                p.name AS "buildingName",
                p.address,
                p.city,
                p.state,
                u.id AS "unitId",
                u.unit_code AS "unitCode",
                COALESCE(u.occupied, FALSE) AS occupied,
                l.status AS "leaseStatus",
                tenant.name AS "tenantName"
              FROM units u
              INNER JOIN properties p ON p.id = u.property_id
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
              WHERE
                ($1::text IS NOT NULL AND u.id::text = $1)
                OR EXISTS (
                  SELECT 1
                  FROM leases ul
                  WHERE ul.unit_id = u.id
                    AND ul.user_id = $2
                    AND ul.status = 'active'
                )
              ORDER BY p.name ASC, u.unit_code ASC
            `,
            values: [apartmentId, userId],
          };

    const portfolioRes = await query(
      portfolioQuery.text,
      portfolioQuery.values,
    );
    const buildingsMap = new Map();

    for (const row of portfolioRes.rows) {
      const existing = buildingsMap.get(row.propertyId);

      if (!existing) {
        buildingsMap.set(row.propertyId, {
          id: row.propertyId,
          name: row.buildingName,
          address: row.address,
          city: row.city,
          state: row.state,
          units: [],
        });
      }

      if (row.unitId) {
        buildingsMap.get(row.propertyId).units.push({
          id: row.unitId,
          code: row.unitCode || "-",
          occupied: Boolean(row.occupied),
          leaseStatus: row.leaseStatus || null,
          tenantName: row.tenantName || null,
        });
      }
    }

    const portfolio = Array.from(buildingsMap.values());

    const alerts = [
      {
        id: "lease-expiring",
        title: "Lease expiring soon",
        detail: `${expiringLeaseStats.rows[0]?.count || 0} lease(s) end in the next 30 days.`,
        severity: "medium",
      },
      {
        id: "overdue-rent",
        title: "Overdue rent",
        detail: `${metrics.overduePayments || 0} payment(s) are currently overdue.`,
        severity: (metrics.overduePayments || 0) > 0 ? "high" : "low",
      },
      {
        id: "maintenance-open",
        title: "Open maintenance requests",
        detail: `${openMaintenanceStats.rows[0]?.count || 0} ticket(s) need assignment.`,
        severity:
          (openMaintenanceStats.rows[0]?.count || 0) > 5 ? "medium" : "low",
      },
    ];

    return NextResponse.json({ metrics, alerts, activity, portfolio });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load dashboard data", detail: error.message },
      { status: 500 },
    );
  }
}
