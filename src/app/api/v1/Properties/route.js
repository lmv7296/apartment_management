import { NextResponse } from "next/server";
import { transaction, query } from "@/lib/db";

const queryGetProperties = `
  SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.created_at AS "createdAt",
    COUNT(DISTINCT u.id)::int AS "unitCount",
    COUNT(DISTINCT l.user_id)::int AS "tenantCount"
  FROM public.properties p
  LEFT JOIN public.units u ON u.property_id = p.id
  LEFT JOIN public.leases l ON l.unit_id = u.id AND l.status = 'active'
  GROUP BY p.id
  ORDER BY p.name ASC
`;

const queryCreateProperty = `
  INSERT INTO public.properties
    (name, address, city, state, zip, property_type, total_units, year_built, square_feet, amenities, under_construction)
  VALUES
    ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), $6, $7, $8, $9, $10, $11)
  RETURNING
    id,
    name,
    address,
    city,
    state,
    zip,
    property_type AS "propertyType",
    total_units AS "totalUnits",
    year_built AS "yearBuilt",
    square_feet AS "squareFeet",
    amenities,
    under_construction AS "underConstruction",
    created_at AS "createdAt"
`;

const queryCreateUnits = `
  INSERT INTO public.units (property_id, unit_code, bedrooms, bathrooms)
  SELECT
    $1::uuid,
    CASE
      WHEN $3::text = '' THEN gs::text
      ELSE CONCAT($3::text, $4::text, gs::text)
    END,
    0,
    1
  FROM generate_series(1, $2::int) AS gs
`;

export async function GET() {
  try {
    const { rows } = await query(queryGetProperties);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load properties", detail: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const address = String(body?.address || "").trim();
    const city = String(body?.city || "").trim();
    const state = String(body?.state || "").trim();
    const zip = String(body?.zip || "").trim();
    const propertyType = String(body?.propertyType || "Apartment").trim();
    const parsedUnits = Number.parseInt(String(body?.totalUnits ?? 0), 10);
    const totalUnits = Number.isNaN(parsedUnits) ? 0 : parsedUnits;
    const parsedYear = Number.parseInt(
      String(body?.yearBuilt ?? new Date().getFullYear()),
      10,
    );
    const yearBuilt = Number.isNaN(parsedYear) ? null : parsedYear;
    const parsedSqft = Number.parseInt(String(body?.squareFeet ?? 0), 10);
    const squareFeet =
      Number.isNaN(parsedSqft) || parsedSqft === 0 ? null : parsedSqft;
    const amenities =
      body?.amenities && typeof body.amenities === "object"
        ? body.amenities
        : {};

    const requestedUnitPrefix = String(body?.unitPrefix ?? "Unit").trim();
    const unitPrefix = requestedUnitPrefix;
    const unitSeparator = unitPrefix && unitPrefix !== "#" ? " " : "";

    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 },
      );
    }

    if (totalUnits < 0) {
      return NextResponse.json(
        { error: "Total units cannot be negative" },
        { status: 400 },
      );
    }

    const created = await transaction(async (client) => {
      const propertyRes = await client.query(queryCreateProperty, [
        name,
        address,
        city,
        state,
        zip,
        propertyType,
        totalUnits,
        yearBuilt,
        squareFeet,
        JSON.stringify(amenities),
        Boolean(body?.underConstruction),
      ]);

      const property = propertyRes.rows[0];

      if (totalUnits > 0) {
        await client.query(queryCreateUnits, [
          property.id,
          totalUnits,
          unitPrefix,
          unitSeparator,
        ]);
      }

      return property;
    });

    return NextResponse.json(
      {
        ...created,
        unitCount: totalUnits,
        tenantCount: 0,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create property", detail: err.message },
      { status: 500 },
    );
  }
}
