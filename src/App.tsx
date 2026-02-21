import { useState } from 'react';
import HomePage from './pages/HomePage/HomePage';
import WithdrawPage from './pages/WithdrawPage/WithdrawPage';
import SponsorPage from './pages/SponsorPage/SponsorPage';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(100);
  const [sponsorUnlocked, setSponsorUnlocked] = useState(false);

  const handleUnlockSponsor = () => {
    setSponsorUnlocked(true);
    setActiveTab('sponsor');
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh relative overflow-hidden max-[430px]:shadow-none shadow-[0_0_60px_rgba(139,0,0,0.2)] border-x border-x-transparent min-[431px]:border-x-[rgba(80,0,0,0.3)]">
      {activeTab === 'home' && (
        <HomePage
          balance={balance}
          setBalance={setBalance}
          onTabChange={setActiveTab}
          sponsorUnlocked={sponsorUnlocked}
          onUnlockSponsor={handleUnlockSponsor}
        />
      )}
      {activeTab === 'withdraw' && (
        <WithdrawPage
          balance={balance}
          onTabChange={setActiveTab}
          sponsorUnlocked={sponsorUnlocked}
        />
      )}
      {activeTab === 'sponsor' && (
        <SponsorPage onTabChange={setActiveTab} />
      )}
    </div>
  );
}

export default App;
