import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const DEMO_PASSWORD = process.env.NEXTAUTH_DEMO_PASSWORD || "demo123";

function isValidDemoPassword(inputPassword) {
  const value = String(inputPassword || "").trim();
  const allowed = new Set([String(DEMO_PASSWORD || "").trim(), "demo123"]);
  return allowed.has(value);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const { rows } = await query(
      `
        SELECT id, name, email, role, password_hash
        FROM users
        WHERE LOWER(email) = LOWER($1)
          AND active = TRUE
        LIMIT 1
      `,
      [email],
    );

    const user = rows[0];

    const hasPasswordHash = Boolean(user?.password_hash);
    const isValidPassword = hasPasswordHash
      ? await verifyPassword(user.password_hash, password)
      : isValidDemoPassword(password);

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!hasPasswordHash) {
      const newHash = await hashPassword(password);
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
        newHash,
        user.id,
      ]);
    }

    return NextResponse.json(
      {
        message: "Sign in successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sign in", detail: error.message },
      { status: 500 },
    );
  }
}
