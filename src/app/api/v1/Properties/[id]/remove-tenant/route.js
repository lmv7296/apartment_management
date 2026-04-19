import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const queryRemoveTenant = `
  UPDATE leases
  SET
    status = 'ended',
    leave_date = $1,
    forwarding_address = $2,
    leave_reason = $3,
    deposit_return_amount = $4,
    move_out_notes = $5
  WHERE
    unit_id = $6
    AND status = 'active'
  RETURNING id, unit_id, user_id, status;
`;

export async function POST(_request, { params: paramsPromise }) {
  try {
    const params = await paramsPromise;
    const body = await _request.json();

    const {
      unitId,
      leaveDate,
      forwardingAddress,
      reason,
      depositReturnAmount,
      notes,
    } = body;

    if (!unitId || !leaveDate) {
      return NextResponse.json(
        { error: "unitId and leaveDate are required" },
        { status: 400 },
      );
    }

    const result = await query(queryRemoveTenant, [
      leaveDate,
      forwardingAddress || null,
      reason || null,
      depositReturnAmount || null,
      notes || null,
      unitId,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No active lease found for this unit" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Tenant removed successfully",
      lease: result.rows[0],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to remove tenant", detail: err.message },
      { status: 500 },
    );
  }
}
