interface EnergyModalProps {
  onClose: () => void;
  onUnlock?: () => void;
}

function EnergyModal({ onClose, onUnlock }: EnergyModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-2"
      onClick={onClose}
    >
      <div
        className="bg-[#373737] rounded-[20px] p-[10px] max-w-[350px] w-full flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="50" height="47" viewBox="0 0 50 47" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.372 2.75591C22.3719 -0.942023 27.6887 -0.91234 29.6478 2.80785L48.8585 39.2949C50.7013 42.795 48.1634 47 44.2082 47H5.26368C1.28129 47 -1.25408 42.7455 0.640643 39.243L20.372 2.75591Z" fill="#212121" />
          <path d="M20.372 2.75591C22.3719 -0.942023 27.6887 -0.91234 29.6478 2.80785L48.8585 39.2949C50.7013 42.795 48.1634 47 44.2082 47H5.26368C1.28129 47 -1.25408 42.7455 0.640643 39.243L20.372 2.75591Z" fill="url(#paint0_linear_22_646)" />
          <path d="M24.7366 13.6047C25.5899 13.6047 26.2825 14.2973 26.2825 15.1507V29.3735C26.2825 29.7835 26.1197 30.1767 25.8297 30.4667C25.5398 30.7566 25.1466 30.9195 24.7366 30.9195C24.3266 30.9195 23.9333 30.7566 23.6434 30.4667C23.3535 30.1767 23.1906 29.7835 23.1906 29.3735V15.1507C23.1906 14.2973 23.8832 13.6047 24.7366 13.6047ZM24.7366 38.3401C25.3926 38.3401 26.0218 38.0795 26.4856 37.6156C26.9495 37.1517 27.2101 36.5226 27.2101 35.8665C27.2101 35.2105 26.9495 34.5814 26.4856 34.1175C26.0218 33.6536 25.3926 33.393 24.7366 33.393C24.0806 33.393 23.4514 33.6536 22.9875 34.1175C22.5237 34.5814 22.263 35.2105 22.263 35.8665C22.263 36.5226 22.5237 37.1517 22.9875 37.6156C23.4514 38.0795 24.0806 38.3401 24.7366 38.3401Z" fill="url(#paint1_linear_22_646)" />
          <defs>
            <linearGradient id="paint0_linear_22_646" x1="7.73103" y1="-7.34353" x2="37.6633" y2="52.6681" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFCD0F" />
              <stop offset="1" stopColor="#FE8401" />
            </linearGradient>
            <linearGradient id="paint1_linear_22_646" x1="18.1409" y1="13.6047" x2="30.0225" y2="38.9535" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A4A4A" />
              <stop offset="1" stopColor="#242424" />
            </linearGradient>
          </defs>
        </svg>

        <h2 className="font-inter font-bold text-[20px] leading-[120%] text-white text-center">
            Больше энергии от 50 до 100 ⚡
        </h2>

        <p className="font-inter text-[16px] leading-[113%] text-[#a6a6a6] text-center">
          Разблокируйте блог спонсора и получите возможность зарабатывать в 2 раза больше денег!
        </p>

        <div className="w-[117px] h-[117px] rounded-[29px] overflow-hidden border-2 border-[rgba(255,255,255,0.1)]">
          <img
            src="/src/assets/channelLogo.png"
            alt="Sponsor"
            className="w-full h-full object-cover"
          />
        </div>

        <button
          className="w-full py-4 rounded-[9px] border border-[rgba(255,255,255,0.3)] bg-[#00af42] font-inter font-medium text-[24px] leading-[63%] text-white text-center active:scale-[0.97] transition-transform duration-100"
          onClick={() => {
            onClose();
            onUnlock?.();
          }}
        >
          Разблокировать
        </button>
      </div>
    </div>
  );
}

export default EnergyModal;
