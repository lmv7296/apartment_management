import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'mockdata.json');
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
