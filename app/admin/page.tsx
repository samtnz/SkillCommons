import { getPublisherPublicKey } from '../../src/lib/publisherKey';
import { AdminClient } from './AdminClient';

export default function AdminPage() {
  const publicKey = getPublisherPublicKey();

  return (
    <main>
      <AdminClient publicKey={publicKey} />
    </main>
  );
}
