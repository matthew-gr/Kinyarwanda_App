import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../../components/AppBar';
import { useAdmin } from './useAdmin';

/** The frame every admin screen shares: an app bar, and a gate for anyone not an admin. */
export function AdminShell({
  title,
  back,
  children,
}: {
  title: string;
  back: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const admin = useAdmin();
  return (
    <main className="screen admin">
      <AppBar title={title} onBack={() => navigate(back)} backLabel="Back" />
      {admin === null ? null : admin ? (
        children
      ) : (
        <section className="panel">
          <h2 className="h2-bold">Admins only</h2>
          <p className="body">Sign in on Profile with an admin account to edit the course.</p>
        </section>
      )}
    </main>
  );
}

export function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p className="form-error body" role="alert">
      {error}
    </p>
  ) : null;
}
