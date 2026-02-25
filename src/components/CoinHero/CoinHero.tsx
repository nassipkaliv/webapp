import coinImage from '../../assets/coin.png';

interface CoinHeroProps {
  onTap: () => void;
}

function CoinHero({ onTap }: CoinHeroProps) {
  return (
    <div className="coin-hero relative py-[clamp(8px,2vh,24px)] flex items-center justify-center w-full">
      <img
        src={coinImage}
        alt="Euro coin"
        className="w-[clamp(140px,35vh,400px)] h-auto relative z-[1] select-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95 transition-transform duration-100 pointer-events-auto outline-none"
        tabIndex={-1}
        draggable={false}
        onClick={onTap}
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
      />
    </div>
  );
}

export default CoinHero;
