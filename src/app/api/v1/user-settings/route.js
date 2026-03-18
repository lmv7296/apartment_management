import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { query } from "@/lib/db";
import userPreferences from "@/config/user-preferences.json";

const DEFAULT_SETTINGS = userPreferences.defaultSettings;
const ALLOWED_CURRENCIES = new Set(
  userPreferences.currencies.map((item) => item.code),
);
const ALLOWED_LANGUAGES = new Set(
  userPreferences.languages.map((item) => item.code),
);

let ensureColumnsPromise;

async function ensureUserSettingsColumns() {
  if (!ensureColumnsPromise) {
    ensureColumnsPromise = Promise.all([
      query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10)`,
      ),
      query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10)`,
      ),
    ]).catch((error) => {
      ensureColumnsPromise = undefined;
      throw error;
    });
  }

  await ensureColumnsPromise;
}

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserSettingsColumns();

    const { rows } = await query(
      `
        SELECT
          preferred_currency AS currency,
          preferred_language AS language
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      currency: rows[0].currency || DEFAULT_SETTINGS.currency,
      language: rows[0].language || DEFAULT_SETTINGS.language,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load user settings", detail: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const currency = body?.currency;
    const language = body?.language;

    if (!currency && !language) {
      return NextResponse.json(
        { error: "No settings provided" },
        { status: 400 },
      );
    }

    if (currency && !ALLOWED_CURRENCIES.has(currency)) {
      return NextResponse.json(
        { error: "Unsupported currency" },
        { status: 400 },
      );
    }

    if (language && !ALLOWED_LANGUAGES.has(language)) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 },
      );
    }

    await ensureUserSettingsColumns();

    const { rows } = await query(
      `
        UPDATE users
        SET
          preferred_currency = COALESCE($2, preferred_currency, $4),
          preferred_language = COALESCE($3, preferred_language, $5)
        WHERE id = $1
        RETURNING
          preferred_currency AS currency,
          preferred_language AS language
      `,
      [
        userId,
        currency || null,
        language || null,
        DEFAULT_SETTINGS.currency,
        DEFAULT_SETTINGS.language,
      ],
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Settings saved",
      settings: {
        currency: rows[0].currency || DEFAULT_SETTINGS.currency,
        language: rows[0].language || DEFAULT_SETTINGS.language,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save user settings", detail: error.message },
      { status: 500 },
    );
  }
}
