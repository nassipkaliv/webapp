import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage/HomePage';
import WithdrawPage from './pages/WithdrawPage/WithdrawPage';
import SponsorPage from './pages/SponsorPage/SponsorPage';

const MAX_ENERGY = 50;

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(100);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [sponsorUnlocked, setSponsorUnlocked] = useState(false);

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
    <div className="max-w-[430px] mx-auto min-h-dvh relative overflow-hidden max-[430px]:shadow-none shadow-[0_0_60px_rgba(139,0,0,0.2)] border-x border-x-transparent min-[431px]:border-x-[rgba(80,0,0,0.3)]">
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
        />
      )}
      {activeTab === 'withdraw' && (
        <WithdrawPage
          balance={balance}
          onTabChange={handleTabChange}
          sponsorUnlocked={sponsorUnlocked}
        />
      )}
      {activeTab === 'sponsor' && (
        <SponsorPage onTabChange={handleTabChange} />
      )}
    </div>
  );
}

export default App;
