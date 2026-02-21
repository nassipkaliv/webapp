import coinImage from '../../assets/coin.png';

interface CoinHeroProps {
  onTap: () => void;
}

function CoinHero({ onTap }: CoinHeroProps) {
  return (
    <div className="relative py-6 flex items-center justify-center w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
      <img
        src={coinImage}
        alt="Euro coin"
        className="w-[clamp(180px,25vw,280px)] h-auto relative z-[1] select-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95 transition-transform duration-100"
        draggable={false}
        onClick={onTap}
      />
    </div>
  );
}

export default CoinHero;
