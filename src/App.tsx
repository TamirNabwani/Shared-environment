import { useEffect, useState } from 'react';
import { Toaster } from './components/toast';
import { Body } from './pages/Body';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { Nutrition } from './pages/Nutrition';
import { Records } from './pages/Records';
import { Settings } from './pages/Settings';
import { Sleep } from './pages/Sleep';
import { Workouts } from './pages/Workouts';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'records', label: 'PRs' },
  { id: 'library', label: 'Library' },
  { id: 'body', label: 'Body' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'settings', label: 'Settings' },
] as const;
type Tab = (typeof TABS)[number]['id'];

// Route lives in the URL hash: #records or #records.pullups ('.' keeps it a plain anchor)
function readHash(): { tab: Tab; param?: string } {
  const [tab, param] = location.hash.slice(1).split('.');
  return { tab: TABS.some((t) => t.id === tab) ? (tab as Tab) : 'dashboard', param };
}

export default function App() {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    const onHash = () => {
      setRoute(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (tab: Tab, param?: string) => (location.hash = param ? `${tab}.${param}` : tab);
  const openRecords = (id: string) => go('records', id);

  return (
    <div className="mx-auto min-h-screen max-w-3xl pb-16">
      <nav className="sticky top-0 z-40 border-b border-[#2c2b28] bg-[var(--surface-0)]/95 backdrop-blur">
        <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
          {TABS.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  route.tab === t.id ? 'bg-[var(--surface-2)] font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="px-4 pt-4">
        {route.tab === 'dashboard' && <Dashboard openRecords={openRecords} />}
        {route.tab === 'workouts' && <Workouts />}
        {route.tab === 'records' && <Records focus={route.param} />}
        {route.tab === 'library' && <Library openRecords={openRecords} />}
        {route.tab === 'body' && <Body />}
        {route.tab === 'nutrition' && <Nutrition />}
        {route.tab === 'sleep' && <Sleep />}
        {route.tab === 'settings' && <Settings />}
      </main>
      <Toaster />
    </div>
  );
}
