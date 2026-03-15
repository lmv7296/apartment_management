import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existing = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );

    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const created = await query(
      `
        INSERT INTO users (name, email, role, active, password_hash)
        VALUES ($1, $2, 'tenant', TRUE, $3)
        RETURNING id, name, email, role, active, created_at
      `,
      [name, email, passwordHash],
    );

    const user = created.rows[0];

    return NextResponse.json(
      {
        message: "Signup successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
