import { NextResponse } from 'next/server';
import { getSkillDetail } from '../../../../src/lib/skills';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const skill = await getSkillDetail(params.slug);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  return NextResponse.json({ data: skill });
}
