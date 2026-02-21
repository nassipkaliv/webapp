import { useState } from 'react';
import t from '../../locales/ru.json';

interface WithdrawModalProps {
  onClose: () => void;
  onGoToSponsor?: () => void;
}

function WithdrawModal({ onClose }: WithdrawModalProps) {
  const [showError, setShowError] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#373737] rounded-[20px] p-[clamp(8px,2vw,16px)] py-[clamp(16px,2vw,28px)] w-full max-w-[720px] flex flex-col items-center gap-[clamp(10px,1.5vw,20px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-inter font-bold text-[clamp(18px,2vw,24px)] text-white text-center leading-[100%]">
          {t.withdrawModal.title}
        </h2>

        <input
          type="text"
          placeholder={t.withdrawModal.inputPlaceholder}
          className="w-full py-3 px-4 mt-[clamp(16px,2vw,24px)] rounded-[9px] border border-[rgba(255,255,255,0.3)] bg-[#535353] font-inter text-[clamp(16px,1.4vw,18px)] text-white placeholder-[rgba(255,255,255,0.4)] outline-none"
        />

        {showError && (
          <div className="w-full flex flex-col gap-2">
            <p className="font-inter font-semibold text-[clamp(14px,1.2vw,18px)] text-[#ff4d4d] text-center leading-[120%]">
              {t.withdrawModal.error}
            </p>
          </div>
        )}

        <button
          className="w-full py-[clamp(12px,1.5vw,16px)] rounded-[9px] mt-[clamp(20px,2vw,30px)] bg-[#00af42] font-inter font-bold text-[clamp(18px,2vw,24px)] leading-[100%] text-center text-white active:scale-[0.97] transition-transform duration-100"
          onClick={() => setShowError(true)}
        >
          {t.withdrawModal.submitButton}
        </button>
      </div>
    </div>
  );
}

export default WithdrawModal;
