import { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage/HomePage';
import WithdrawPage from './pages/WithdrawPage/WithdrawPage';
import SponsorPage from './pages/SponsorPage/SponsorPage';
import { usePosts } from './hooks/usePosts';
import { useReadPosts } from './hooks/useReadPosts';
import coinImage from './assets/coin.png';

// Preload coin image so it's cached before any page renders it
const preload = new Image();
preload.src = coinImage;

// Global vibration on all interactive element taps
function vibrate() {
  try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}
  try { navigator.vibrate?.(10); } catch {}
}
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('button, a, [role="button"]')) vibrate();
}, { passive: true });

const BASE_ENERGY = 50;
const UNLOCKED_ENERGY = 100;
const ENERGY_REGEN_MS = 2 * 60 * 1000; // 1 energy per 2 minutes

function loadNumber(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  } catch { return fallback; }
}

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === 'true';
  } catch { return fallback; }
}

/** Calculate how much energy regenerated while the app was closed */
function calcOfflineRegen(savedEnergy: number, savedTimestamp: number, max: number): number {
  if (!savedTimestamp) return savedEnergy;
  const elapsed = Date.now() - savedTimestamp;
  const regenTicks = Math.floor(elapsed / ENERGY_REGEN_MS);
  return Math.min(savedEnergy + regenTicks, max);
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(() => loadNumber('balance', 100));
  const [sponsorUnlocked, setSponsorUnlocked] = useState(() => loadBool('sponsorUnlocked', false));
  const maxEnergy = sponsorUnlocked ? UNLOCKED_ENERGY : BASE_ENERGY;
  const [energy, setEnergy] = useState(() =>
    calcOfflineRegen(loadNumber('energy', maxEnergy), loadNumber('energyTimestamp', 0), maxEnergy)
  );
  const { posts, loading: postsLoading, loadingMore, error: postsError, hasMore, loadMore, refetch: refetchPosts } = usePosts();
  const { readIds, markAsRead, unreadCount } = useReadPosts();
  const unread = unreadCount(posts.map(p => p.id));

  // Persist balance
  useEffect(() => { localStorage.setItem('balance', String(balance)); }, [balance]);

  // Persist energy + timestamp
  useEffect(() => {
    localStorage.setItem('energy', String(energy));
    localStorage.setItem('energyTimestamp', String(Date.now()));
  }, [energy]);

  // Persist sponsorUnlocked
  useEffect(() => { localStorage.setItem('sponsorUnlocked', String(sponsorUnlocked)); }, [sponsorUnlocked]);

  // Energy regeneration: 1 energy per 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, maxEnergy));
    }, ENERGY_REGEN_MS);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  const handleUnlockSponsor = useCallback(() => {
    setSponsorUnlocked(true);
    setActiveTab('sponsor');
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="mx-auto h-dvh relative overflow-hidden">
      <div className={activeTab !== 'home' ? 'hidden' : ''}>
        <HomePage
          balance={balance}
          setBalance={setBalance}
          energy={energy}
          setEnergy={setEnergy}
          maxEnergy={maxEnergy}
          onTabChange={handleTabChange}
          sponsorUnlocked={sponsorUnlocked}
          onUnlockSponsor={handleUnlockSponsor}
          sponsorBadge={unread}
        />
      </div>
      <div className={activeTab !== 'withdraw' ? 'hidden' : ''}>
        <WithdrawPage
          balance={balance}
          onTabChange={handleTabChange}
          sponsorUnlocked={sponsorUnlocked}
          sponsorBadge={unread}
        />
      </div>
      {activeTab === 'sponsor' && (
        <SponsorPage
          onTabChange={handleTabChange}
          posts={posts}
          postsLoading={postsLoading}
          loadingMore={loadingMore}
          postsError={postsError}
          hasMore={hasMore}
          loadMore={loadMore}
          refetchPosts={refetchPosts}
          markAsRead={markAsRead}
          readIds={readIds}
          unreadCount={unread}
        />
      )}
    </div>
  );
}

export default App;
