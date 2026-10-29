import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { BottomNav } from './components/BottomNav';
import { ensureSeeded } from './data/repo';
import { History } from './routes/History';
import { Home } from './routes/Home';
import { Learn } from './routes/Learn';
import { Profile } from './routes/Profile';
import { Search } from './routes/Search';

function TabsLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = pathname === '/' ? 'home' : pathname.slice(1);
  return (
    <>
      <main className="screen screen-tabs">
        <Outlet />
      </main>
      <div className="nav-dock">
        <BottomNav active={active} onSelect={(id) => navigate(id === 'home' ? '/' : `/${id}`)} />
      </div>
    </>
  );
}

export function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureSeeded().then(
      () => setReady(true),
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    );
  }, []);

  if (error) {
    return (
      <p className="screen body" role="alert">
        This browser could not open the app's storage: {error}
      </p>
    );
  }
  if (!ready) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TabsLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="learn/:deck" element={<Learn />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
