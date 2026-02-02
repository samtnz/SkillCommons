'use client';

import { useEffect, useState } from 'react';

export function PolicyBadge() {
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/meta')
      .then((res) => res.json())
      .then((data) => {
        if (!active) {
          return;
        }
        const policyHash = data?.policy?.hash;
        if (typeof policyHash === 'string' && policyHash.length >= 8) {
          setHash(policyHash.slice(0, 8));
        }
      })
      .catch(() => {
        if (active) {
          setHash(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!hash) {
    return null;
  }

  return <span className="meta">Registry policy: {hash}</span>;
}
