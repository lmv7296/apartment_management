import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withRLS } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withRLS(session.user, async (tx) => {
      // We use subqueries with json_agg to get related data in one trip
      const unitsRes = await tx.query(
        `
        SELECT 
          p.*,
          (
            SELECT json_agg(phases_sorted)
            FROM (
              SELECT label, progress, status 
              FROM project_phases 
              WHERE project_id = p.id 
              ORDER BY step_order ASC
            ) phases_sorted
          ) as phases,
          (
            SELECT json_agg(logs_sorted)
            FROM (
              SELECT title, description, author_role, created_at 
              FROM activity_logs 
              WHERE project_id = p.id 
              ORDER BY created_at DESC 
              LIMIT 5
            ) logs_sorted
          ) as activity
        FROM properties p
        WHERE p.id = $1
      `,
        [id],
      );

      if (unitsRes.rows.length === 0) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(unitsRes.rows[0]);
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch construction data", detail: err.message },
      { status: 500 },
    );
  }
}
