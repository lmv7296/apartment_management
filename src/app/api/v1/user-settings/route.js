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
const ALLOWED_UNIT_PREFIXES = new Set(
  userPreferences.unitPrefixes.map((item) => item.code),
);

let ensureColumnsPromise;

async function ensureUserSettingsColumns() {
  if (!ensureColumnsPromise) {
    ensureColumnsPromise = Promise.all([
      query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10)`),
      query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10)`),
      query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_unit_prefix VARCHAR(20)`),
      query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_unit_count INTEGER`),
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
          preferred_language AS language,
          preferred_unit_prefix AS "unitPrefix",
          preferred_unit_count AS "unitCount"
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
      unitPrefix: rows[0].unitPrefix ?? DEFAULT_SETTINGS.unitPrefix,
      unitCount: rows[0].unitCount ?? DEFAULT_SETTINGS.unitCount,
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
    const unitPrefix = body?.unitPrefix;
    const rawUnitCount = body?.unitCount;
    const unitCount =
      rawUnitCount !== undefined && rawUnitCount !== null
        ? Number.parseInt(String(rawUnitCount), 10)
        : undefined;

    if (currency === undefined && language === undefined && unitPrefix === undefined && unitCount === undefined) {
      return NextResponse.json(
        { error: "No settings provided" },
        { status: 400 },
      );
    }

    if (currency !== undefined && !ALLOWED_CURRENCIES.has(currency)) {
      return NextResponse.json(
        { error: "Unsupported currency" },
        { status: 400 },
      );
    }

    if (language !== undefined && !ALLOWED_LANGUAGES.has(language)) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 },
      );
    }

    if (unitPrefix !== undefined && !ALLOWED_UNIT_PREFIXES.has(unitPrefix)) {
      return NextResponse.json(
        { error: "Unsupported unit prefix" },
        { status: 400 },
      );
    }

    if (unitCount !== undefined && (Number.isNaN(unitCount) || unitCount < 0)) {
      return NextResponse.json(
        { error: "Unit count must be a non-negative number" },
        { status: 400 },
      );
    }

    await ensureUserSettingsColumns();

    const { rows } = await query(
      `
        UPDATE users
        SET
          preferred_currency   = COALESCE($2, preferred_currency, $6),
          preferred_language   = COALESCE($3, preferred_language, $7),
          preferred_unit_prefix = COALESCE($4, preferred_unit_prefix, $8),
          preferred_unit_count  = COALESCE($5, preferred_unit_count, $9)
        WHERE id = $1
        RETURNING
          preferred_currency AS currency,
          preferred_language AS language,
          preferred_unit_prefix AS "unitPrefix",
          preferred_unit_count AS "unitCount"
      `,
      [
        userId,
        currency ?? null,
        language ?? null,
        unitPrefix !== undefined ? unitPrefix : null,
        unitCount !== undefined ? unitCount : null,
        DEFAULT_SETTINGS.currency,
        DEFAULT_SETTINGS.language,
        DEFAULT_SETTINGS.unitPrefix,
        DEFAULT_SETTINGS.unitCount,
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
        unitPrefix: rows[0].unitPrefix ?? DEFAULT_SETTINGS.unitPrefix,
        unitCount: rows[0].unitCount ?? DEFAULT_SETTINGS.unitCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save user settings", detail: error.message },
      { status: 500 },
    );
  }
}
