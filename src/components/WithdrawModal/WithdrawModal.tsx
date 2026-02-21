interface WithdrawModalProps {
  onClose: () => void;
}

function WithdrawModal({ onClose }: WithdrawModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-2"
      onClick={onClose}
    >
      <div
        className="bg-[#373737] rounded-[20px] p-[10px] max-w-[350px] w-full flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-inter font-bold text-[24px] text-white text-center leading-[63%]">
          Вывод средств
        </h2>

        <input
          type="text"
          placeholder="Сумма (EUR)"
          className="w-full py-3 px-4 mt-[30px] rounded-[9px] border border-[rgba(255,255,255,0.3)] bg-[#535353] font-inter text-[16px] text-white placeholder-[rgba(255,255,255,0.4)] outline-none"
        />

        <button
          className="w-full py-4 rounded-[9px] mt-[40px] bg-[#00af42] font-inter font-bold text-[24px] leading-[63%] text-center text-white active:scale-[0.97] transition-transform duration-100"
          onClick={onClose}
        >
          Вывести
        </button>
      </div>
    </div>
  );
}

export default WithdrawModal;
