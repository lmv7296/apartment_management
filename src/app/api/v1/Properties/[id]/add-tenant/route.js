import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { transaction } from "@/lib/db";

const queryGetUnit = `
  SELECT id, unit_code AS "unitCode"
  FROM units
  WHERE id = $1::uuid
    AND property_id = $2::uuid
  LIMIT 1
`;

const queryActiveLeaseOnUnit = `
  SELECT id
  FROM leases
  WHERE unit_id = $1::uuid
    AND status = 'active'
  LIMIT 1
`;

const queryFindUserByEmail = `
  SELECT id
  FROM users
  WHERE LOWER(email) = LOWER($1)
  LIMIT 1
`;

const queryGetUsersColumns = `
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = ANY (current_schemas(true))
    AND table_name = 'users'
`;

const queryCreateLease = `
  INSERT INTO leases (unit_id, user_id, start_date, end_date, status, monthly_rent)
  VALUES ($1::uuid, $2::uuid, $3::date, ($3::date + INTERVAL '12 months')::date, 'active', $4::numeric)
  RETURNING
    id,
    unit_id AS "unitId",
    user_id AS "userId",
    start_date AS "startDate",
    end_date AS "endDate",
    monthly_rent AS "monthlyRent",
    status
`;

function hasColumn(columns, name) {
  return columns.has(name);
}

function buildCreateUserStatement(columns) {
  const insertColumns = ["name", "email", "phone", "role", "active"];
  const values = ["$1", "$2", "$3", "'tenant'", "TRUE"];
  let nextIndex = 4;

  if (hasColumn(columns, "apartment_id")) {
    insertColumns.push("apartment_id");
    values.push(`$${nextIndex++}::uuid`);
  }

  if (hasColumn(columns, "unit_id")) {
    insertColumns.push("unit_id");
    values.push(`$${nextIndex++}::uuid`);
  }

  const sql = `
    INSERT INTO users (${insertColumns.join(", ")})
    VALUES (${values.join(", ")})
    RETURNING id
  `;

  return {
    sql,
    usesApartmentId: hasColumn(columns, "apartment_id"),
    usesUnitId: hasColumn(columns, "unit_id"),
  };
}

function buildUpdateUserStatement(columns) {
  const setParts = [
    "name = $2",
    "phone = $3",
    "role = 'tenant'",
    "active = TRUE",
  ];
  let nextIndex = 4;

  if (hasColumn(columns, "apartment_id")) {
    setParts.push(`apartment_id = $${nextIndex++}::uuid`);
  }

  if (hasColumn(columns, "unit_id")) {
    setParts.push(`unit_id = $${nextIndex++}::uuid`);
  }

  const sql = `
    UPDATE users
    SET ${setParts.join(", ")}
    WHERE id = $1::uuid
    RETURNING id
  `;

  return {
    sql,
    usesApartmentId: hasColumn(columns, "apartment_id"),
    usesUnitId: hasColumn(columns, "unit_id"),
  };
}

function buildUserArgs(baseArgs, unitId, flags) {
  const args = [...baseArgs];

  if (flags.usesApartmentId) {
    args.push(unitId);
  }

  if (flags.usesUnitId) {
    args.push(unitId);
  }

  return args;
}

export async function POST(request, { params: paramsPromise }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;
    const propertyId = String(params?.id || "").trim();

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property id is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const unitId = String(body?.unitId || "").trim();
    const fullName = String(body?.fullName || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body?.phone || "").trim();
    const startDate = String(body?.startDate || "").trim();
    const monthlyRent = Number.parseFloat(String(body?.monthlyRent || ""));

    if (
      !unitId ||
      !fullName ||
      !email ||
      !startDate ||
      Number.isNaN(monthlyRent)
    ) {
      return NextResponse.json(
        {
          error:
            "unitId, fullName, email, startDate, and monthlyRent are required",
        },
        { status: 400 },
      );
    }

    const result = await transaction(async (tx) => {
      const columnsRes = await tx.query(queryGetUsersColumns);
      const usersColumns = new Set(
        columnsRes.rows.map((row) =>
          String(row.column_name || "").toLowerCase(),
        ),
      );

      const unitRes = await tx.query(queryGetUnit, [unitId, propertyId]);
      const unit = unitRes.rows[0];

      if (!unit) {
        const error = new Error("Unit not found in this property");
        error.status = 404;
        throw error;
      }

      const activeLeaseRes = await tx.query(queryActiveLeaseOnUnit, [unitId]);
      if (activeLeaseRes.rows.length > 0) {
        const error = new Error("This unit already has an active tenant");
        error.status = 409;
        throw error;
      }

      const existingUserRes = await tx.query(queryFindUserByEmail, [email]);
      let userId;
      let createdUser = false;

      if (existingUserRes.rows.length > 0) {
        userId = existingUserRes.rows[0].id;
        const updateStatement = buildUpdateUserStatement(usersColumns);
        await tx.query(
          updateStatement.sql,
          buildUserArgs(
            [userId, fullName, phone || null],
            unitId,
            updateStatement,
          ),
        );
      } else {
        const createStatement = buildCreateUserStatement(usersColumns);
        const createUserRes = await tx.query(
          createStatement.sql,
          buildUserArgs(
            [fullName, email, phone || null],
            unitId,
            createStatement,
          ),
        );
        userId = createUserRes.rows[0].id;
        createdUser = true;
      }

      const leaseRes = await tx.query(queryCreateLease, [
        unitId,
        userId,
        startDate,
        monthlyRent,
      ]);

      return {
        lease: leaseRes.rows[0],
        unit,
        createdUser,
        userId,
      };
    });

    return NextResponse.json(
      {
        message: result.createdUser
          ? "Tenant user created and assigned to unit"
          : "Existing tenant user updated and assigned to unit",
        ...result,
      },
      { status: 201 },
    );
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json(
      { error: error.message || "Failed to add tenant", detail: error.message },
      { status },
    );
  }
}
