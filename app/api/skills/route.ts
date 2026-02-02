import { NextResponse } from 'next/server';
import { listSkills } from '../../../src/lib/skills';
import { parseLimit, parseList, parseOffset } from '../../../src/lib/pagination';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || undefined;
  const tags = parseList(searchParams.get('tags'));
  const capabilities = parseList(searchParams.get('capabilities'));
  const limit = parseLimit(searchParams.get('limit'));
  const offset = parseOffset(searchParams.get('offset'));

  const skills = await listSkills({ query, tags, capabilities, limit, offset });

  return NextResponse.json({
    data: skills,
    pagination: {
      limit,
      offset,
      returned: skills.length
    }
  });
}
