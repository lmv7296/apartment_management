import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "@/lib/db";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_STATUSES = new Set(["open", "in_progress", "closed"]);

async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) {
      return null;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      userId: user.id,
      role: String(profile?.role || "tenant").toLowerCase(),
    };
  } catch (error) {
    console.error("getAuthenticatedUser server error:", error);
    return null;
  }
}

async function getAssignedUnitId(userId) {
  const { rows } = await query(
    `
      SELECT COALESCE(
        (SELECT unit_id FROM users WHERE id = $1 AND unit_id IS NOT NULL),
        (
          SELECT unit_id
          FROM leases
          WHERE user_id = $1
            AND status = 'active'
          ORDER BY end_date DESC NULLS LAST
          LIMIT 1
        )
      ) AS unit_id
    `,
    [userId],
  );

  return rows[0]?.unit_id || null;
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const requestedUnitId = String(searchParams.get("unit") || "").trim() || null;

    if (user.role === "manager") {
      const { rows } = await query(
        `
          SELECT
            mr.id,
            mr.unit_id AS "unitId",
            u.unit_code AS "unitCode",
            mr.title,
            mr.detail,
            mr.status,
            mr.priority,
            mr.created_at AS "createdAt"
          FROM maintenance_requests mr
          LEFT JOIN units u ON u.id = mr.unit_id
          WHERE ($1::uuid IS NULL OR mr.unit_id = $1::uuid)
          ORDER BY mr.created_at DESC
          LIMIT 100
        `,
        [requestedUnitId],
      );

      return NextResponse.json({ items: rows });
    }

    const assignedUnitId = await getAssignedUnitId(user.userId);

    if (!assignedUnitId) {
      return NextResponse.json({ items: [] });
    }

    if (requestedUnitId && requestedUnitId !== assignedUnitId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await query(
      `
        SELECT
          mr.id,
          mr.unit_id AS "unitId",
          u.unit_code AS "unitCode",
          mr.title,
          mr.detail,
          mr.status,
          mr.priority,
          mr.created_at AS "createdAt"
        FROM maintenance_requests mr
        LEFT JOIN units u ON u.id = mr.unit_id
        WHERE mr.unit_id = $1
        ORDER BY mr.created_at DESC
        LIMIT 100
      `,
      [assignedUnitId],
    );

    return NextResponse.json({ items: rows });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load maintenance requests", detail: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = String(body?.title || "").trim();
    const detail = String(body?.detail || "").trim();
    const priority = String(body?.priority || "medium").toLowerCase();
    const requestedUnitId = String(body?.unitId || "").trim() || null;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!detail) {
      return NextResponse.json({ error: "Detail is required" }, { status: 400 });
    }

    if (!ALLOWED_PRIORITIES.has(priority)) {
      return NextResponse.json(
        { error: "Priority must be low, medium, or high" },
        { status: 400 },
      );
    }

    let unitId = requestedUnitId;

    if (user.role !== "manager") {
      const assignedUnitId = await getAssignedUnitId(user.userId);

      if (!assignedUnitId) {
        return NextResponse.json(
          { error: "No assigned unit found" },
          { status: 400 },
        );
      }

      if (requestedUnitId && requestedUnitId !== assignedUnitId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      unitId = assignedUnitId;
    }

    if (!unitId) {
      return NextResponse.json({ error: "Unit is required" }, { status: 400 });
    }

    const { rows } = await query(
      `
        INSERT INTO maintenance_requests (unit_id, title, detail, status, priority)
        VALUES ($1, $2, $3, 'open', $4)
        RETURNING
          id,
          unit_id AS "unitId",
          title,
          detail,
          status,
          priority,
          created_at AS "createdAt"
      `,
      [unitId, title, detail, priority],
    );

    return NextResponse.json(
      { message: "Maintenance request created", item: rows[0] },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create maintenance request", detail: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const requestId = String(body?.id || "").trim();
    const status = String(body?.status || "").trim().toLowerCase();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request id is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Status must be open, in_progress, or closed" },
        { status: 400 },
      );
    }

    const { rows } = await query(
      `
        UPDATE maintenance_requests mr
        SET status = $2
        WHERE mr.id = $1::uuid
        RETURNING
          mr.id,
          mr.unit_id AS "unitId",
          (
            SELECT unit_code
            FROM units u
            WHERE u.id = mr.unit_id
          ) AS "unitCode",
          mr.title,
          mr.detail,
          mr.status,
          mr.priority,
          mr.created_at AS "createdAt"
      `,
      [requestId, status],
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Status updated", item: rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update maintenance request", detail: error.message },
      { status: 500 },
    );
  }
}
