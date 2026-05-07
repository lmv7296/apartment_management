import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withRLS } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: unitId } = await params;
    if (!unitId) {
      return NextResponse.json(
        { error: "Unit ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { endDate } = body;
    if (!endDate) {
      return NextResponse.json(
        { error: "New end date is required" },
        { status: 400 },
      );
    }

    // Validate date format
    const newEndDate = new Date(endDate);
    if (isNaN(newEndDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    const result = await withRLS(session.user, async (db) => {
      // First, find the active lease for this unit
      const leaseQuery = `
        SELECT id, end_date
        FROM leases
        WHERE unit_id = $1::uuid AND status = 'active'
        LIMIT 1
      `;
      const leaseResult = await db.query(leaseQuery, [unitId]);

      if (leaseResult.rows.length === 0) {
        throw new Error("No active lease found for this unit");
      }

      const leaseId = leaseResult.rows[0].id;
      const currentEndDate = leaseResult.rows[0].end_date;

      // Ensure new date is after current end date
      if (newEndDate <= new Date(currentEndDate)) {
        throw new Error("New end date must be after the current end date");
      }

      // Update the lease end_date
      const updateQuery = `
        UPDATE leases
        SET end_date = $1
        WHERE id = $2::uuid
        RETURNING id, end_date
      `;
      const updateResult = await db.query(updateQuery, [
        newEndDate.toISOString(),
        leaseId,
      ]);

      return updateResult.rows[0];
    });

    return NextResponse.json({
      success: true,
      lease: result,
    });
  } catch (error) {
    console.error("Error extending lease:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extend lease" },
      { status: 500 },
    );
  }
}
