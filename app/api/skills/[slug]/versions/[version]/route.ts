import { NextResponse } from 'next/server';
import { getSkillVersionDetail } from '../../../../../../src/lib/skills';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string; version: string } }
) {
  const version = await getSkillVersionDetail(params.slug, params.version);

  if (!version) {
    return NextResponse.json({ error: 'Skill version not found' }, { status: 404 });
  }

  return NextResponse.json({ data: version });
}
