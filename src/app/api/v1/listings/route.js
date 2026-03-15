import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await query(
      `
        SELECT
          id,
          name,
          address,
          price,
          type,
          image,
          bedrooms,
          bathrooms,
          square_feet AS "squareFeet",
          features
        FROM listings
        ORDER BY id ASC
      `,
    );

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load listings", detail: err.message },
      { status: 500 },
    );
  }
}
