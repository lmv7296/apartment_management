import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const ALLOWED_FIELDS = ["name", "email", "phone", "apartment_id"];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requested =
      searchParams
        .get("fields")
        ?.split(",")
        .map((f) => f.trim()) ?? ALLOWED_FIELDS;

    const selectedFields = requested.filter((f) => ALLOWED_FIELDS.includes(f));

    if (selectedFields.length === 0) {
      return NextResponse.json(
        { error: "No valid fields requested" },
        { status: 400 },
      );
    }

    const { rows } = await query(
      `SELECT ${selectedFields.join(", ")} FROM users WHERE role = 'tenant' AND active = true ORDER BY id ASC`,
    );

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load tenants", detail: err.message },
      { status: 500 },
    );
  }
}
