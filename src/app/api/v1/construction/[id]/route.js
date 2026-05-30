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
              SELECT label, progress, status, "PhaseSteps"
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

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phases, total_completion_pct } = body;

    if (!phases || !Array.isArray(phases)) {
      return NextResponse.json(
        { error: "Invalid request body: 'phases' array is required" },
        { status: 400 },
      );
    }

    return await withRLS(session.user, async (tx) => {
      // Update the property's overall completion percentage
      if (typeof total_completion_pct === "number") {
        await tx.query(
          `UPDATE properties SET total_completion_pct = $1 WHERE id = $2`,
          [total_completion_pct, id],
        );
      }

      // Update each phase's progress and individual steps
      for (const phase of phases) {
        const { label, progress, PhaseSteps, steps } = phase;
        // Use PhaseSteps if present, fallback to steps (handles frontend variations)
        const stepsToUpdate = PhaseSteps || steps;

        await tx.query(
          `
          UPDATE project_phases 
          SET progress = $1, "PhaseSteps" = $4
          WHERE project_id = $2 AND label = $3
        `,
          [progress, id, label, JSON.stringify(stepsToUpdate)],
        );
      }

      // Fetch the updated project data to return
      const updatedProjectRes = await tx.query(
        `
        SELECT 
          p.*,
          (
            SELECT json_agg(phases_sorted)
            FROM (
              SELECT label, progress, status, "PhaseSteps"
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

      if (updatedProjectRes.rows.length === 0) {
        return NextResponse.json(
          { error: "Project not found after update" },
          { status: 404 },
        );
      }

      return NextResponse.json(updatedProjectRes.rows[0]);
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update construction progress", detail: err.message },
      { status: 500 },
    );
  }
}
