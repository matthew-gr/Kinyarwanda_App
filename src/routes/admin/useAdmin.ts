import { useEffect, useState } from 'react';
import { isAdmin } from '../../data/admin';

/**
 * null while checking, then whether the signed-in person is an admin. Checks again when
 * `who` changes, such as the signed-in email.
 */
export function useAdmin(who?: string | null): boolean | null {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void isAdmin().then(
      (a) => alive && setAdmin(a),
      () => alive && setAdmin(false),
    );
    return () => {
      alive = false;
    };
  }, [who]);
  return admin;
}
