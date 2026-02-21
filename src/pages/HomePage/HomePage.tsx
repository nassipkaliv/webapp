import { useState } from 'react';
import BalanceHeader from '../../components/BalanceHeader/BalanceHeader';
import CoinHero from '../../components/CoinHero/CoinHero';
import EnergyBar from '../../components/EnergyBar/EnergyBar';
import BottomNav from '../../components/BottomNav/BottomNav';
import EnergyModal from '../../components/EnergyModal/EnergyModal';

const MAX_ENERGY = 50;

interface HomePageProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  onTabChange: (tab: string) => void;
}

function HomePage({ balance, setBalance, onTabChange }: HomePageProps) {
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [showModal, setShowModal] = useState(false);

  const handleCoinTap = () => {
    if (energy <= 0) {
      setShowModal(true);
      return;
    }
    setBalance((prev) => prev + 1);
    setEnergy((prev) => prev - 1);
  };

  return (
    <div className="h-dvh flex flex-col relative bg-gradient-to-b from-black to-[#b42115] overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-[calc(105px+env(safe-area-inset-bottom,0px))] relative z-[1] gap-10">
        <BalanceHeader amount={balance.toFixed(2)} currency="EUR" />
        <CoinHero onTap={handleCoinTap} />
        <EnergyBar current={energy} max={MAX_ENERGY} fillPercent={(energy / MAX_ENERGY) * 50} onPlusClick={() => setShowModal(true)} />
      </main>

      <BottomNav activeTab="home" onTabChange={onTabChange} />

      {showModal && <EnergyModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default HomePage;
