import { NextResponse } from 'next/server';
import { getSkillVersions } from '../../../../../src/lib/skills';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const versions = await getSkillVersions(params.slug);

  if (!versions) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  return NextResponse.json({ data: versions });
}
