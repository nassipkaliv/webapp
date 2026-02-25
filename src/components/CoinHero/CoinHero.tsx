import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import coinImage from '../../assets/coin.png';

interface CoinHeroProps {
  onTap: () => void;
}

function CoinHero({ onTap }: CoinHeroProps) {
  const [pulse, setPulse] = useState(false);

  const handleTap = useCallback(() => {
    onTap();

    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
  }, [onTap]);

  return (
    <div
      className="coin-hero relative py-[clamp(8px,2vh,24px)] flex items-center justify-center w-full cursor-pointer"
      style={{ WebkitTapHighlightColor: 'transparent' } as CSSProperties}
      onClick={handleTap}
    >
      <img
        src={coinImage}
        alt="Euro coin"
        className={[
          'w-[clamp(140px,35vh,400px)] h-auto relative z-[1] select-none',
          'drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
          'pointer-events-none outline-none border-0',
          pulse ? 'coin-pulse' : '',
        ].join(' ')}
        draggable={false}
        onAnimationEnd={() => setPulse(false)}
        style={{
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation',
        } as CSSProperties}
      />
    </div>
  );
}

export default CoinHero;