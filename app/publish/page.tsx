import { redirect } from 'next/navigation';
import { isAdminRequest } from '../../src/lib/auth';
import { listSkills } from '../../src/lib/skills';
import { getPublisherPublicKey } from '../../src/lib/publisherKey';
import { PublishClient } from './PublishClient';

export default async function PublishPage() {
  const isAdmin = isAdminRequest();
  if (!isAdmin) {
    redirect('/admin');
  }

  const skills = await listSkills({
    limit: 100,
    offset: 0,
    query: undefined,
    tags: [],
    capabilities: []
  });
  const options = skills.map((skill) => ({
    slug: skill.slug,
    title: skill.title
  }));
  const publicKey = getPublisherPublicKey();

  return <PublishClient skills={options} publicKey={publicKey} />;
}
