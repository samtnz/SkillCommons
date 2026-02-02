import { NextResponse } from 'next/server';
import { exportSkills } from '../../../../src/lib/skills';
import { parseLimit, parseOffset } from '../../../../src/lib/pagination';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get('limit'));
  const offset = parseOffset(searchParams.get('offset'));

  const skills = await exportSkills({ limit, offset });

  return NextResponse.json({
    data: skills,
    pagination: {
      limit,
      offset,
      returned: skills.length
    }
  });
}
