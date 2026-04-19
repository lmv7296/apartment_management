// import { NextResponse } from "next/server";
// import { query } from "@/lib/db";

// const queryAddUnit = `
//   INSERT INTO units (property_id, unit_code, bedrooms, bathrooms, square_feet)
//   VALUES ($1::uuid, $2, $3::int, $4::int, $5::int)
//   RETURNING
//     id,
//     unit_code AS "unitCode",
//     bedrooms,
//     bathrooms,
//     square_feet AS "squareFeet";
// `;

// export async function POST(_request, { params: paramsPromise }) {
//   try {
//     const params = await paramsPromise;
//     const body = await _request.json();

//     const { unitCode, bedrooms, bathrooms, squareFeet } = body;
//     const propertyId = String(params?.id || "").trim();

//     if (!propertyId) {
//       return NextResponse.json(
//         { error: "Property id is required" },
//         { status: 400 },
//       );
//     }

//     if (!unitCode) {
//       return NextResponse.json(
//         { error: "Unit code is required" },
//         { status: 400 },
//       );
//     }

//     const result = await query(queryAddUnit, [
//       propertyId,
//       unitCode,
//       bedrooms || 0,
//       bathrooms || 1,
//       squareFeet || null,
//     ]);

//     if (result.rows.length === 0) {
//       return NextResponse.json(
//         { error: "Failed to create unit" },
//         { status: 500 },
//       );
//     }

//     return NextResponse.json(result.rows[0], { status: 201 });
//   } catch (err) {
//     // Check for unique constraint violation on (property_id, unit_code)
//     if (err.code === "23505") {
//       return NextResponse.json(
//         { error: "A unit with this code already exists in this property" },
//         { status: 409 },
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to add unit", detail: err.message },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { withRLS } from "@/lib/db"; // Use withRLS instead of query
import { auth } from "@/auth";     // Import your NextAuth helper

const queryAddUnit = `
  INSERT INTO units (property_id, unit_code, bedrooms, bathrooms, square_feet, company_id)
  VALUES ($1::uuid, $2, $3::int, $4::int, $5::int, current_setting('app.current_company_id')::uuid)
  RETURNING
    id,
    unit_code AS "unitCode",
    bedrooms,
    bathrooms,
    square_feet AS "squareFeet";
`;

export async function POST(_request, { params: paramsPromise }) {
  try {
    // 1. Get the session to pass to withRLS
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;
    const body = await _request.json();
    const { unitCode, bedrooms, bathrooms, squareFeet } = body;
    const propertyId = String(params?.id || "").trim();

    // 2. Wrap the execution in withRLS
    const result = await withRLS(session.user, async (tx) => {
      return await tx.query(queryAddUnit, [
        propertyId,
        unitCode,
        bedrooms || 0,
        bathrooms || 1,
        squareFeet || null,
      ]);
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
    }

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (err) {
    // If the propertyId belongs to ANOTHER company, RLS will throw an error 
    // or the insert will fail if you have a foreign key check.
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "A unit with this code already exists in this property" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add unit", detail: err.message },
      { status: 500 }
    );
  }
}