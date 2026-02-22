import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage/HomePage';
import WithdrawPage from './pages/WithdrawPage/WithdrawPage';
import SponsorPage from './pages/SponsorPage/SponsorPage';
import { usePosts } from './hooks/usePosts';
import { useReadPosts } from './hooks/useReadPosts';

const MAX_ENERGY = 50;

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(100);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [sponsorUnlocked, setSponsorUnlocked] = useState(false);
  const { posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = usePosts();
  const { markAsRead, unreadCount } = useReadPosts();
  const unread = unreadCount(posts.map(p => p.id));

  // Energy regeneration: 1 energy per 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, MAX_ENERGY));
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlockSponsor = () => {
    setSponsorUnlocked(true);
    setActiveTab('sponsor');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="mx-auto min-h-dvh relative overflow-hidden">
      {activeTab === 'home' && (
        <HomePage
          balance={balance}
          setBalance={setBalance}
          energy={energy}
          setEnergy={setEnergy}
          maxEnergy={MAX_ENERGY}
          onTabChange={handleTabChange}
          sponsorUnlocked={sponsorUnlocked}
          onUnlockSponsor={handleUnlockSponsor}
          sponsorBadge={unread}
        />
      )}
      {activeTab === 'withdraw' && (
        <WithdrawPage
          balance={balance}
          onTabChange={handleTabChange}
          sponsorUnlocked={sponsorUnlocked}
          sponsorBadge={unread}
        />
      )}
      {activeTab === 'sponsor' && (
        <SponsorPage
          onTabChange={handleTabChange}
          posts={posts}
          postsLoading={postsLoading}
          postsError={postsError}
          refetchPosts={refetchPosts}
          markAsRead={markAsRead}
          unreadCount={unread}
        />
      )}
    </div>
  );
}

export default App;
