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
import { ensureSeeded } from './data/content';
import { startSync } from './data/sync';
import { AdminHome } from './routes/admin/AdminHome';
import { AdminItem } from './routes/admin/AdminItem';
import { VoiceTest } from './routes/admin/VoiceTest';
import { History } from './routes/History';
import { Home } from './routes/Home';
import { Learn } from './routes/Learn';
import { NumberListening } from './routes/NumberListening';
import { Profile } from './routes/Profile';
import { QuickRecall } from './routes/QuickRecall';
import { Review } from './routes/Review';
import { Search } from './routes/Search';
import { SpeedSpeaking } from './routes/SpeedSpeaking';
import { Stories, StoryReader } from './routes/Stories';
import { Placement } from './routes/Placement';
import { Topics } from './routes/Topics';
import { VerbBuilder } from './routes/VerbBuilder';
import { UpdateBanner } from './routes/Update';
import { AccessGate } from './routes/Welcome';

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
      () => {
        setReady(true);
        startSync();
      },
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
    <>
      <UpdateBanner />
      <AccessGate>
        <BrowserRouter>
          <Routes>
            <Route element={<TabsLayout />}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="learn/:deck" element={<Learn />} />
            <Route path="review" element={<Review />} />
            <Route path="verbs" element={<VerbBuilder />} />
            <Route path="topics" element={<Topics />} />
            <Route path="placement" element={<Placement />} />
            <Route path="drills/speaking" element={<SpeedSpeaking />} />
            <Route path="drills/numbers" element={<NumberListening />} />
            <Route path="drills/recall" element={<QuickRecall />} />
            <Route path="stories" element={<Stories />} />
            <Route path="stories/:id" element={<StoryReader />} />
            <Route path="admin" element={<AdminHome />} />
            <Route path="admin/items/:id" element={<AdminItem />} />
            <Route path="admin/voices" element={<VoiceTest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AccessGate>
    </>
  );
}
