import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withRLS } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      zip,
      country,
      permit_number,
      budget_total,
      estimated_completion,
      contractor_name,
      phases,
    } = body;

    // Validation: Ensure required fields are present
    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and Address are required" },
        { status: 400 },
      );
    }

    return await withRLS(session.user, async (tx) => {
      // 1. Insert the main property record
      // company_id is pulled from the session user to maintain multi-tenant integrity
      const result = await tx.query(
        `
        INSERT INTO properties (
          name, 
          address, 
          city,
          state,
          zip,
          country,
          permit_number, 
          budget_total, 
          estimated_completion, 
          contractor_name,
          under_construction,
          company_id,
          total_completion_pct
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7,$8, $9, $10,TRUE, $11, 0)
        RETURNING id, name
      `,
        [
          name,
          address,
          city,
          state,
          zip || body.zipcode,
          country,
          permit_number,
          budget_total || 0,
          estimated_completion || null,
          contractor_name || null,
          session.user.company_id, // Ensure this matches your session user object structure
        ],
      );

      const newProject = result.rows[0];

      // 2. Insert Custom or Default Phases
      const phasesToInsert =
        phases && Array.isArray(phases) && phases.length > 0
          ? phases
          : [
              { label: "Excavation", progress: 0, PhaseSteps: [] },
              { label: "Structure", progress: 0, PhaseSteps: [] },
              { label: "Facade", progress: 0, PhaseSteps: [] },
              { label: "Interior", progress: 0, PhaseSteps: [] },
            ];

      for (let i = 0; i < phasesToInsert.length; i++) {
        const p = phasesToInsert[i];
        await tx.query(
          `
          INSERT INTO project_phases (project_id, label, progress, status, step_order, "PhaseSteps")
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            newProject.id,
            p.label,
            p.progress || 0,
            p.progress === 100 ? "Completed" : "Pending",
            i + 1,
            JSON.stringify(p.PhaseSteps || []),
          ],
        );
      }

      return NextResponse.json(
        {
          message: "Project initialized successfully",
          project: newProject,
        },
        { status: 201 },
      );
    });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json(
      { error: "Failed to initialize project", detail: err.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withRLS(session.user, async (tx) => {
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
          ) as phases
        FROM properties p
        WHERE p.under_construction = TRUE
        ORDER BY p.created_at DESC
      `,
      );

      return NextResponse.json(unitsRes.rows);
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch construction projects", detail: err.message },
      { status: 500 },
    );
  }
}
